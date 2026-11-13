/*
 * The save shared by every project in VS Code.
 *
 * In the VS Code panel the game runs in a frame whose browser storage is not
 * the same from one project to another. The extension keeps one save file for
 * all of them; this module talks to it through postMessage:
 *
 *   game -> extension  { source: "guinea-run", type: "loadSave" }
 *   extension -> game  { source: "vscode-sfdx-hardis", type: "save", blob }   (blob: the file, or null)
 *   game -> extension  { source: "guinea-run", type: "storeSave", blob }       (after each change)
 *   game -> extension  { source: "guinea-run", type: "clearSave" }            (a save edited by hand)
 *
 * The blob is signed like the results of the Hall of Fame: the extension
 * stores it as it is and never reads it. A save edited by hand is refused,
 * and the player starts again from zero. A save signed with another key (the
 * key was rotated) is not a cheat: it is ignored, nothing is erased.
 *
 * Only play.html?from=vscode&save=host uses it, never a test link (they must
 * not change a real player's save). In a browser the game keeps its storage.
 */
import { mergeProgress } from "./progress.js";
import { onSavedLocally } from "./save-signal.js";
import { TALLY_SET, sealSave } from "./tally.js";

/** The browser storage keys the shared save carries. */
export const SAVE_KEYS = {
  progress: "guinea-run-progress-v1",
  pinball: "guinea-run-pinball-v1",
  muted: "guinea-run-muted",
  admins: "guinea-run-last-admins"
};

const FROM_HOST = "vscode-sfdx-hardis";
// Several writes in a row (a world won writes the progress a few times) travel as one save
const WAIT_MS = 400;
// The URL settings of a check: such a game never reads nor writes the shared save
const TEST_PARAMS = ["guinea-unlock", "guinea-test", "guinea-seed", "guinea-at"];

let enabled = false;
let timer = null;
let sending = Promise.resolve();

/** Whether this page should use the shared save: in the VS Code frame that asked for it, never in a check. */
export function hostSaveWanted(params, framed) {
  return Boolean(framed) && params.get("from") === "vscode" && params.get("save") === "host" && !TEST_PARAMS.some((name) => params.has(name));
}

/**
 * Asks the extension for the shared save and puts it into the browser storage
 * before the game starts. Resolves { enabled, refused }: enabled when the
 * extension answered (later changes are sent to it), refused when the save
 * was edited by hand (everything was cleared). Never rejects.
 */
export async function restoreFromHost(options = {}) {
  const blob = await askHost(options.timeoutMs || 3000);
  if (blob === undefined) {
    return { enabled: false, refused: false };
  }
  enabled = true;
  const read = await readSave(blob);
  let refused = false;
  if (read.refused) {
    refused = true;
    clearLocal();
    post({ type: "clearSave" });
  } else if (read.values) {
    applyValues(read.values);
  }
  onSavedLocally(sendSoon);
  listenForClose();
  // What this project had before is added to the shared save at once
  if (!refused) {
    sendSoon();
  }
  return { enabled: true, refused };
}

/** The signed blob for these values ({ progress, pinball, muted, admins }, strings or null), or null when this browser cannot sign. */
export async function buildSave(values) {
  const text = JSON.stringify(values);
  const sg = await sealSave(text);
  if (!sg) {
    return null;
  }
  return JSON.stringify({ v: 1, k: TALLY_SET, text, sg });
}

/**
 * Reads a blob from the extension: { values } when it is valid (values is
 * null when there is no save yet), { refused: true } when it was edited,
 * { ignored: true } when it cannot be checked here (another key, no signing).
 */
export async function readSave(blob) {
  if (blob === null || blob === undefined || blob === "") {
    return { values: null };
  }
  let saved;
  try {
    saved = JSON.parse(blob);
  } catch {
    return { refused: true };
  }
  if (!saved || typeof saved !== "object" || saved.v !== 1 || typeof saved.text !== "string" || typeof saved.sg !== "string") {
    return { refused: true };
  }
  if (saved.k !== TALLY_SET) {
    return { ignored: true };
  }
  const sg = await sealSave(saved.text);
  if (!sg) {
    return { ignored: true };
  }
  if (sg !== saved.sg) {
    return { refused: true };
  }
  let values;
  try {
    values = JSON.parse(saved.text);
  } catch {
    return { refused: true };
  }
  if (!values || typeof values !== "object") {
    return { refused: true };
  }
  const clean = {};
  for (const name of Object.keys(SAVE_KEYS)) {
    const value = values[name];
    if (value !== null && value !== undefined && typeof value !== "string") {
      return { refused: true };
    }
    clean[name] = typeof value === "string" ? value : null;
  }
  return { values: clean };
}

/** Sends the save now, without waiting: what a test or a closing page calls. Resolves once posted. */
export function sendNow() {
  if (!enabled) {
    return sending;
  }
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  sending = sending
    .then(async () => {
      const blob = await buildSave(readLocal());
      if (blob) {
        post({ type: "storeSave", blob });
      }
    })
    .catch(() => {});
  return sending;
}

/** Stops sending (tests). */
export function stopHostSave() {
  enabled = false;
  onSavedLocally(null);
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function askHost(timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(wait);
      window.removeEventListener("message", onMessage);
      resolve(value);
    };
    const onMessage = (event) => {
      const data = event.data;
      // Only the page that holds the frame (the VS Code panel) is heard
      if (event.source !== window.parent || !data || typeof data !== "object" || data.source !== FROM_HOST || data.type !== "save") {
        return;
      }
      finish(typeof data.blob === "string" ? data.blob : null);
    };
    const wait = setTimeout(() => finish(undefined), timeoutMs);
    window.addEventListener("message", onMessage);
    post({ type: "loadSave" });
  });
}

/** The shared save first; the progress of this project is merged in (the best of both, the Hall of Fame profile and mode of the shared save). */
function applyValues(values) {
  const storage = storageOrNull();
  if (!storage) {
    return;
  }
  try {
    if (values.progress) {
      const shared = parseProgress(values.progress);
      const mine = parseProgress(storage.getItem(SAVE_KEYS.progress));
      if (shared) {
        const merged = mine ? mergeProgress(shared, mine, new Set()) : shared;
        storage.setItem(SAVE_KEYS.progress, JSON.stringify(merged));
      }
    }
    for (const name of ["pinball", "muted", "admins"]) {
      if (values[name] !== null) {
        storage.setItem(SAVE_KEYS[name], values[name]);
      }
    }
  } catch {
    // Storage refused: the game plays on what it has
  }
}

function parseProgress(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function clearLocal() {
  const storage = storageOrNull();
  for (const key of Object.values(SAVE_KEYS)) {
    try {
      storage && storage.removeItem(key);
    } catch {
      // Nothing more to clear
    }
  }
}

function readLocal() {
  const storage = storageOrNull();
  const values = {};
  for (const [name, key] of Object.entries(SAVE_KEYS)) {
    let value = null;
    try {
      value = storage ? storage.getItem(key) : null;
    } catch {
      value = null;
    }
    values[name] = value;
  }
  return values;
}

function sendSoon() {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    sendNow();
  }, WAIT_MS);
}

/** A panel closing does not wait for the timer. */
function listenForClose() {
  try {
    const flush = () => {
      if (timer) {
        sendNow();
      }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    });
  } catch {
    // No such events: the timer still sends
  }
}

function post(message) {
  try {
    window.parent.postMessage(Object.assign({ source: "guinea-run" }, message), "*");
  } catch {
    // No page around the frame: nothing to tell
  }
}

function storageOrNull() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
