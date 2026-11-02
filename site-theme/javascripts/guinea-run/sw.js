/*
 * Guinea Run offline: a service worker that keeps a copy of the whole game, so
 * play.html (the game alone, also framed by the VS Code panel) plays without a
 * network once it has been opened online.
 *
 * play.html registers it once the game is ready. On install it saves every
 * file of FILES and Three.js, all or nothing: a file that fails drops the
 * install, tried again at the next visit. It never takes over a page already
 * open: a new version waits until every game page is closed, so a game in
 * progress never mixes two versions. Then it deletes the older copies.
 *
 * VERSION and FILES are written by scripts/build/site.mjs (a hash of the files,
 * and their paths from this folder). A copy that was never built ("dev") saves
 * nothing and serves nothing.
 *
 * The Hall of Fame board, GitHub, analytics and anything else stay on the
 * network: only the site's own files and the pinned Three.js are served here.
 */

const VERSION = "dev";
const FILES = [];
const THREE_URL = "";

const PREFIX = "guinea-run-";
const CACHE = PREFIX + VERSION;
const THREE_ROOT = THREE_URL.slice(0, THREE_URL.lastIndexOf("/") + 1);

self.addEventListener("install", (event) => {
  event.waitUntil(saveGame());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(dropOlderCopies());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (VERSION === "dev" || request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  // The Hall of Fame database is on another origin: it always goes to the network
  const served = url.origin === self.location.origin || (Boolean(THREE_ROOT) && request.url.startsWith(THREE_ROOT));
  if (served) {
    event.respondWith(fromCopy(request));
  }
});

async function saveGame() {
  if (VERSION === "dev") {
    return;
  }
  const cache = await caches.open(CACHE);
  // "reload": straight from the server, never a file the browser kept from an older version
  await cache.addAll(FILES.map((file) => new Request(new URL(file, self.location).href, { cache: "reload" })));
  if (THREE_URL) {
    await saveScript(cache, THREE_URL, new Set());
  }
}

/** Saves a script and the scripts it imports by a relative path (Three.js imports its core). */
async function saveScript(cache, url, seen) {
  if (seen.has(url)) {
    return;
  }
  seen.add(url);
  const response = await fetch(url, { mode: "cors", cache: "reload" });
  if (!response.ok) {
    throw new Error("Guinea Run could not save " + url);
  }
  const text = await response.clone().text();
  await cache.put(url, response);
  for (const match of text.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g)) {
    await saveScript(cache, new URL(match[1], url).href, seen);
  }
}

async function dropOlderCopies() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith(PREFIX) && name !== CACHE).map((name) => caches.delete(name)));
}

/** The saved copy first, the network otherwise; a file the list missed is added once fetched. */
async function fromCopy(request) {
  const cache = await caches.open(CACHE);
  const page = request.mode === "navigate";
  // play.html?lang=fr&from=vscode is the same page as play.html
  const saved = await cache.match(request, { ignoreSearch: page });
  if (saved) {
    return saved;
  }
  const response = await fetch(request);
  if (!page && response.ok && response.type !== "opaque") {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}
