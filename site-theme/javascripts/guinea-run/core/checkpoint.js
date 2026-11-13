/*
 * The saved game of Pipeline Pinball, kept in the browser while a game is
 * paused or the page is closed. It is signed like the results of the Hall of
 * Fame, so a saved game edited by hand is refused when it is read back, and a
 * new game starts.
 *
 * Signing takes a few milliseconds and cannot finish while a page closes: the
 * table saves every few seconds of play, so a closed page loses at most those.
 */
import { savedLocally } from "./save-signal.js";
import { TALLY_SET, sealCheckpoint } from "./tally.js";

const KEY = "guinea-run-pinball-v1";

/** Whether a saved game is waiting (its signature is checked when it is read). */
export function hasCheckpoint() {
  try {
    return Boolean(window.localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

/** Saves the state of a game. Resolves when it is written; never rejects. */
export async function saveCheckpoint(state) {
  try {
    const text = JSON.stringify(state);
    const sg = await sealCheckpoint(text);
    if (!sg) {
      return false;
    }
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, k: TALLY_SET, text, sg }));
    savedLocally();
    return true;
  } catch {
    return false;
  }
}

/** The saved game: { state }, { broken: true } when it was changed, or null when there is none. */
export async function loadCheckpoint() {
  let saved;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    saved = JSON.parse(raw);
  } catch {
    return { broken: true };
  }
  if (!saved || saved.v !== 1 || typeof saved.text !== "string" || saved.k !== TALLY_SET) {
    return { broken: true };
  }
  const sg = await sealCheckpoint(saved.text);
  if (!sg || sg !== saved.sg) {
    return { broken: true };
  }
  try {
    return { state: JSON.parse(saved.text) };
  } catch {
    return { broken: true };
  }
}

export function clearCheckpoint() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing saved, nothing to clear
    return;
  }
  savedLocally();
}
