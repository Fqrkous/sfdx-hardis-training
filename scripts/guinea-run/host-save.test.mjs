/**
 * node --test scripts/guinea-run/host-save.test.mjs
 *
 * The save every VS Code project shares (core/host-save.js): the extension
 * keeps it, the game signs it, checks it when it comes back, merges it with
 * what this project had, and starts again from zero when it was edited by hand.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { SAVE_KEYS, buildSave, hostSaveWanted, readSave, restoreFromHost, sendNow, stopHostSave } from "../../site-theme/javascripts/guinea-run/core/host-save.js";
import { savedLocally } from "../../site-theme/javascripts/guinea-run/core/save-signal.js";
import { createProgress } from "../../site-theme/javascripts/guinea-run/core/progress.js";

/**
 * A frame in the VS Code panel: one localStorage, and a parent that answers
 * loadSave with `file` (undefined: never answers) and records what it hears.
 */
function fakeFrame(file, local = {}) {
  const items = new Map(Object.entries(local));
  const heard = [];
  const listeners = new Set();
  const parent = {
    postMessage(message) {
      heard.push(message);
      if (message.type === "loadSave" && file !== undefined) {
        setTimeout(() => {
          for (const fn of listeners) {
            fn({ source: parent, data: { source: "vscode-sfdx-hardis", type: "save", blob: file } });
          }
        }, 0);
      }
    }
  };
  globalThis.window = {
    parent,
    localStorage: {
      getItem: (key) => (items.has(key) ? items.get(key) : null),
      setItem: (key, value) => items.set(key, String(value)),
      removeItem: (key) => items.delete(key)
    },
    addEventListener: (type, fn) => type === "message" && listeners.add(fn),
    removeEventListener: (type, fn) => listeners.delete(fn)
  };
  return { items, heard, parent, listeners };
}

function progressOf(items) {
  return JSON.parse(items.get(SAVE_KEYS.progress) || "null");
}

function progressText(worlds, extra = {}) {
  return JSON.stringify(Object.assign({ v: 1, unlocked: Object.keys(worlds).length, worlds, badges: [], notes: {}, plan: null, finished: false }, extra));
}

test.afterEach(() => stopHostSave());

test("only the VS Code frame that asked for it, never a check", () => {
  const p = (query) => new URLSearchParams(query);
  assert.equal(hostSaveWanted(p("from=vscode&save=host"), true), true);
  assert.equal(hostSaveWanted(p("from=vscode&save=host"), false), false);
  assert.equal(hostSaveWanted(p("from=vscode"), true), false);
  assert.equal(hostSaveWanted(p("save=host"), true), false);
  for (const name of ["guinea-unlock=all", "guinea-test=1", "guinea-seed=3", "guinea-at=100"]) {
    assert.equal(hostSaveWanted(p("from=vscode&save=host&" + name), true), false, name);
  }
});

test("a save built here reads back the same", async () => {
  const values = { progress: progressText({ 0: { best: 900, stars: 2 } }), pinball: null, muted: "1", admins: '{"0":[4]}' };
  const read = await readSave(await buildSave(values));
  assert.deepEqual(read.values, values);
});

test("one character changed anywhere and the save is refused", async () => {
  const blob = await buildSave({ progress: progressText({ 0: { best: 900, stars: 2 } }), pinball: null, muted: null, admins: null });
  const saved = JSON.parse(blob);
  const edited = JSON.stringify(Object.assign({}, saved, { text: saved.text.replace("900", "999") }));
  assert.deepEqual(await readSave(edited), { refused: true });
  const signedAgain = JSON.stringify(Object.assign({}, saved, { sg: saved.sg.slice(0, -1) + (saved.sg.endsWith("A") ? "B" : "A") }));
  assert.deepEqual(await readSave(signedAgain), { refused: true });
  assert.deepEqual(await readSave("not json"), { refused: true });
  assert.deepEqual(await readSave('{"v":1}'), { refused: true });
});

test("a save signed with another key is ignored, not called a cheat", async () => {
  const saved = JSON.parse(await buildSave({ progress: null, pinball: null, muted: null, admins: null }));
  assert.deepEqual(await readSave(JSON.stringify(Object.assign({}, saved, { k: saved.k + 1 }))), { ignored: true });
});

test("no answer from the extension: the game plays on this project's storage and sends nothing", async () => {
  const frame = fakeFrame(undefined, { [SAVE_KEYS.muted]: "1" });
  const result = await restoreFromHost({ timeoutMs: 20 });
  assert.deepEqual(result, { enabled: false, refused: false });
  savedLocally();
  await sendNow();
  assert.equal(frame.items.get(SAVE_KEYS.muted), "1");
  assert.deepEqual(
    frame.heard.map((m) => m.type),
    ["loadSave"]
  );
});

test("the shared save and this project's are merged, the shared Hall of Fame profile wins", async () => {
  const shared = {
    progress: progressText({ 0: { best: 1200, stars: 3 }, 1: { best: 500, stars: 1 } }, { online: { id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "Shared", coat: "golden", asked: true, sent: { w0: 1200 } }, mode: "hard" }),
    pinball: '{"v":1,"k":1,"text":"{}","sg":"x"}',
    muted: "1",
    admins: '{"0":[7]}'
  };
  const frame = fakeFrame(await buildSave(shared), {
    [SAVE_KEYS.progress]: progressText({ 0: { best: 800, stars: 2 }, 2: { best: 300, stars: 1 } }, { online: { id: "0b4f3c1e-2222-4a2b-8c3d-000000000002", name: "Other", coat: "snow", sent: {} }, badges: [1] }),
    [SAVE_KEYS.muted]: "0"
  });
  const result = await restoreFromHost({ timeoutMs: 1000 });
  assert.deepEqual(result, { enabled: true, refused: false });
  const merged = progressOf(frame.items);
  assert.equal(merged.worlds[0].best, 1200);
  assert.equal(merged.worlds[1].best, 500);
  assert.equal(merged.worlds[2].best, 300);
  assert.equal(merged.online.id, "0b4f3c1e-1111-4a2b-8c3d-000000000001");
  assert.equal(merged.online.name, "Shared");
  assert.equal(merged.online.sent.w0, 1200);
  assert.equal(merged.mode, "hard");
  assert.deepEqual(merged.badges, [1]);
  assert.equal(frame.items.get(SAVE_KEYS.muted), "1");
  assert.equal(frame.items.get(SAVE_KEYS.pinball), shared.pinball);
  assert.equal(frame.items.get(SAVE_KEYS.admins), shared.admins);
});

test("a pinball game saved only in this project is kept", async () => {
  const frame = fakeFrame(await buildSave({ progress: null, pinball: null, muted: null, admins: null }), { [SAVE_KEYS.pinball]: "local-game" });
  await restoreFromHost({ timeoutMs: 1000 });
  assert.equal(frame.items.get(SAVE_KEYS.pinball), "local-game");
});

test("no shared save yet: this project's progress becomes the shared save", async () => {
  const frame = fakeFrame(null, { [SAVE_KEYS.progress]: progressText({ 0: { best: 700, stars: 2 } }) });
  await restoreFromHost({ timeoutMs: 1000 });
  await sendNow();
  const stored = frame.heard.filter((m) => m.type === "storeSave");
  assert.equal(stored.length, 1);
  const read = await readSave(stored[0].blob);
  assert.equal(JSON.parse(read.values.progress).worlds[0].best, 700);
});

test("a save edited by hand: everything is cleared and the extension deletes it", async () => {
  const saved = JSON.parse(await buildSave({ progress: progressText({ 0: { best: 100, stars: 1 } }), pinball: null, muted: null, admins: null }));
  const edited = JSON.stringify(Object.assign({}, saved, { text: saved.text.replace("100", "199") }));
  const frame = fakeFrame(edited, {
    [SAVE_KEYS.progress]: progressText({ 0: { best: 100, stars: 1 } }, { online: { id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "me", coat: "agouti" } }),
    [SAVE_KEYS.pinball]: "game",
    [SAVE_KEYS.muted]: "1",
    [SAVE_KEYS.admins]: "{}",
    "guinea-run-installed": "1"
  });
  const result = await restoreFromHost({ timeoutMs: 1000 });
  assert.deepEqual(result, { enabled: true, refused: true });
  for (const key of Object.values(SAVE_KEYS)) {
    assert.equal(frame.items.has(key), false, key);
  }
  assert.equal(frame.items.get("guinea-run-installed"), "1");
  assert.ok(frame.heard.some((m) => m.type === "clearSave"));
  assert.ok(!frame.heard.some((m) => m.type === "storeSave"));
  // The game starts from zero, Hall of Fame profile included
  const progress = createProgress();
  assert.equal(progress.unlocked, 0);
  assert.ok(!progress.online.id);
});

test("several changes in a row travel as one signed save", async () => {
  const frame = fakeFrame(null);
  await restoreFromHost({ timeoutMs: 1000 });
  await sendNow();
  const before = frame.heard.length;
  const progress = createProgress();
  progress.complete(0, 1500, 3, 1, { w: 0, sc: 1500 });
  progress.addBadge(1);
  savedLocally();
  await new Promise((resolve) => setTimeout(resolve, 600));
  await sendNow();
  const stored = frame.heard.slice(before).filter((m) => m.type === "storeSave");
  // One from the timer, one from sendNow: never one per write
  assert.ok(stored.length >= 1 && stored.length <= 2, String(stored.length));
  const read = await readSave(stored[stored.length - 1].blob);
  const sent = JSON.parse(read.values.progress);
  assert.equal(sent.worlds[0].best, 1500);
  assert.deepEqual(sent.badges, [1]);
});

test("a message from anything but the parent page is not heard", async () => {
  const frame = fakeFrame(undefined);
  const restoring = restoreFromHost({ timeoutMs: 50 });
  for (const fn of frame.listeners) {
    fn({ source: {}, data: { source: "vscode-sfdx-hardis", type: "save", blob: null } });
  }
  assert.deepEqual(await restoring, { enabled: false, refused: false });
});
