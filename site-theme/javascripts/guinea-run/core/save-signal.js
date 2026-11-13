/*
 * The modules that write to the browser storage (progress, the saved pinball
 * game, the sound switch, the admins' faces) call savedLocally() after each
 * write. Nothing listens in a browser. In the VS Code panel, core/host-save.js
 * listens and sends the save to the extension, so every project shares it.
 *
 * A module of its own so those four never import the signing code.
 */

let listener = null;

/** Something the game remembers just changed in the browser storage. */
export function savedLocally() {
  if (listener) {
    try {
      listener();
    } catch {
      // A save that cannot travel never stops the game
    }
  }
}

/** core/host-save.js listens here; null stops listening. */
export function onSavedLocally(fn) {
  listener = typeof fn === "function" ? fn : null;
}
