#!/usr/bin/env node
/**
 * Checks Guinea Run, the game hidden in the course: that readers can find it,
 * that every world opens, plays, ends and frees what it drew, that progress
 * is kept, and that what the game quotes from the labs is still in the labs.
 *
 *   node scripts/build/site.mjs && python -m zensical build -f course-site.yml
 *   node scripts/verify/check-easter-egg.mjs
 *
 * What it proves:
 * - the Konami code typed with the arrows opens the map, in English on an
 *   English page; typed on WASD it opens it in French on a French page; typed
 *   in a text field it does not
 * - from the map, the keyboard alone opens world 0, starts it and plays it
 * - each world opens, starts, takes its controls, ends, and gives back what
 *   it drew when the player returns to the map; the last one ends on the credits,
 *   and its retrofit button takes a click
 * - finishing a world opens the next one, and the browser remembers it
 * - the "Why install anything?" admin past the Re-check door of world 0 holds
 *   the track and throws his blocks across the lanes, the tools brought to his
 *   laptop take all his excuses, he installs VS Code himself and the world ends
 * - the admin at the end of world 1 throws his Flows and jumps, a player who
 *   runs under him touches the axe, and the bridge goes down with him
 * - the "git add ." admin at the end of world 2 throws everything onto the
 *   commit, a player who throws back all but the four files of US-014 beats
 *   him, and the commit cards follow to the end of the world
 * - the "I'll do it by hand after" admin at the end of world 3 takes the
 *   deployment actions out of the Pull Request and switches its base to main,
 *   a player who puts each back in time beats him, and the check goes green
 * - a deployment action declared in the wrong place in world 3 comes back as
 *   a failing gate in world 6
 * - the admin at the end of world 5 clicks Accept Current Change on Mariia's
 *   lines, the guinea pig undoes his clicks and keeps both sides of every
 *   conflict, and his git push --force meets the branch protection
 * - the testers at the end of the uat branch in world 7 hold the track: the
 *   vegetables make the first one validate US-062, the second one leaves on
 *   sick leave, and the promotion question comes after them
 * - the Data Cloud at the end of world 8 throws its errors, a player who jumps
 *   on the beat takes its carrots and fires back, it goes down, and the DORA
 *   card follows
 * - every lab a world card links to exists, in English and in French
 * - every string a world quotes from a lab (its QUOTES) is still in that lab,
 *   in English and in French: a reworded lab fails here, naming the line
 * - on a phone, five taps on the footer guinea pig open it, the pads show,
 *   a swipe and a pad move the guinea pig, the page never scrolls sideways
 * - Esc closes it and gives the page its scroll back; a page change under it
 *   removes it
 * - Pipeline Pinball, the bonus table, stays hidden until every world is done,
 *   then its teaser shows once; it opens, its flippers follow the held keys
 *   and the halves of the screen, Deploy to all orgs puts three balls on the
 *   table, a ball reaches the Production floor, the bot plays it for two
 *   minutes without a ball ever leaving the table, a game ends on its card,
 *   and the Hall of Fame has its board
 * - Org-Man, the second bonus, opens with it: its teaser shows once, the
 *   guinea pig follows the arrows through the maze, a rocket turns the admins
 *   blue, the bot plays, the last dot clears the maze, the card between two
 *   mazes shows and maze 2 starts, a game ends on its card with the join
 *   box, and the Hall of Fame has its board
 * - play.html, opened once online, saves the whole game (sw.js); with the
 *   network cut, every world and both bonuses still open and world 1 plays
 * - in the VS Code frame (play.html?from=vscode&save=host), the game asks the
 *   page around it for the shared save, sends it signed after a change,
 *   refuses one edited by hand (card, storage cleared, file deleted) and puts
 *   a valid one back into its storage
 *
 * Three.js comes from jsDelivr, so this needs the network, like the site does.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { serveSite, SITE } from "../lib/site-server.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const GAME = path.join(ROOT, "site-theme", "javascripts", "guinea-run");
// The software renderer of CI builds every shader on the CPU: a world with
// its 3D models takes half a minute to open there, a second on a real GPU
const OPEN_TIMEOUT = 90000;
const KONAMI_ARROWS = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const KONAMI_WASD = ["w", "w", "s", "s", "a", "d", "a", "d", "b", "a"];
const PROGRESS_KEY = "guinea-run-progress-v1";

const problems = [];

function expect(condition, message) {
  if (!condition) {
    problems.push(message);
  }
  console.log(`${condition ? "ok  " : "FAIL"} ${message}`);
}

/* ---------- Without a browser: the quotes and the lab links ---------- */

function labFile(locale, id) {
  const [major, minor] = id.split(".");
  const localeDir = path.join(ROOT, "labs", locale);
  const level = fs.readdirSync(localeDir).find((name) => name.startsWith(`level-${major}-`));
  if (!level) {
    return null;
  }
  const file = fs.readdirSync(path.join(localeDir, level)).find((name) => name.startsWith(`${major}-${minor}-`) && name.endsWith(".md"));
  return file ? path.join(localeDir, level, file) : null;
}

const { WORLDS } = await import(pathToFileURL(path.join(GAME, "core", "story.js")).href);
for (const world of WORLDS) {
  const module = await import(pathToFileURL(path.join(GAME, "worlds", world.module)).href);
  expect(typeof module.createWorld === "function", `world ${world.id} (${world.module}) exports createWorld`);
  expect(Boolean(module.TEXTS && module.TEXTS.en && module.TEXTS.en.intro && module.TEXTS.en.note), `world ${world.id} has an intro and a note in English`);
  const missingFr = Object.keys(module.TEXTS.en).filter((key) => !(module.TEXTS.fr && key in module.TEXTS.fr));
  expect(missingFr.length === 0, `world ${world.id} has every key in French${missingFr.length ? ": missing " + missingFr.join(", ") : ""}`);
  for (const quote of module.QUOTES || []) {
    // A sentence the French lab translates is checked in English only
    for (const locale of quote.locales || ["en", "fr"]) {
      const file = labFile(locale, quote.lab);
      const found = file && fs.readFileSync(file, "utf8").includes(quote.text);
      if (!found) {
        expect(false, `world ${world.id} quotes "${quote.text}" from Lab ${quote.lab}, and labs/${locale} no longer says it`);
      }
    }
  }
}
// The bonuses are world modules too, each with its own card
const { BONUSES } = await import(pathToFileURL(path.join(GAME, "core", "story.js")).href);
for (const bonus of BONUSES) {
  const module = await import(pathToFileURL(path.join(GAME, "worlds", bonus.module)).href);
  expect(typeof module.createWorld === "function" && module.KIND === "bonus", `the bonus ${bonus.id} (${bonus.module}) exports createWorld`);
  const missingFr = Object.keys(module.TEXTS.en).filter((key) => !(module.TEXTS.fr && key in module.TEXTS.fr));
  expect(missingFr.length === 0, `the bonus ${bonus.id} has every key in French${missingFr.length ? ": missing " + missingFr.join(", ") : ""}`);
  for (const quote of module.QUOTES || []) {
    for (const locale of quote.locales || ["en", "fr"]) {
      const file = labFile(locale, quote.lab);
      if (!(file && fs.readFileSync(file, "utf8").includes(quote.text))) {
        expect(false, `the bonus ${bonus.id} quotes "${quote.text}" from Lab ${quote.lab}, and labs/${locale} no longer says it`);
      }
    }
  }
}
console.log("ok   every quote of the worlds is still in its lab, in English and in French (or listed above)");

const labsModule = path.join(SITE, "theme", "javascripts", "guinea-run", "labs.js");
expect(fs.existsSync(labsModule), "the build wrote the lab links of the game");
if (fs.existsSync(labsModule)) {
  const { LABS } = await import(pathToFileURL(labsModule).href);
  for (const locale of ["en", "fr"]) {
    const dead = [];
    for (const world of WORLDS.concat(BONUSES)) {
      for (const id of world.labs) {
        const lab = LABS[locale] && LABS[locale][id];
        if (!lab || !fs.existsSync(path.join(SITE, lab.url, "index.html"))) {
          dead.push(`world ${world.id} -> Lab ${id}`);
        }
      }
    }
    expect(dead.length === 0, `every lab a world card links to exists in ${locale}${dead.length ? ": " + dead.join(", ") : ""}`);
  }
}

/* ---------- In a browser ---------- */

// The service worker's own requests go through the routes and the offline
// switch too: the offline probe must not pass on a file the worker fetched
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = "1";
let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error(["playwright-core is needed to open the pages. Install it first:", "  npm install --no-save playwright-core", "  npx playwright-core install chrome"].join("\n"));
  process.exit(1);
}

const site = await serveSite();
// A browser of this script's own, never the user's
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function newPage(options) {
  const context = await browser.newContext(options);
  // Google Analytics is answered locally: a CI run is not a reader, and its
  // events would land in the course numbers. What is checked is what the page
  // pushes into dataLayer, which is all gtag.js ever reads.
  await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort());
  const page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`page error on ${page.url()}: ${error.message}`));
  if (process.env.EGG_DEBUG) {
    page.on("console", (m) => console.log("console:", m.text()));
  }
  return page;
}

const state = (page) => page.evaluate(() => document.querySelector(".guinea-run")?.getAttribute("data-state") || null);
const data = (page, name) => page.evaluate((n) => document.querySelector(".guinea-run")?.getAttribute("data-" + n) || null, name);
// One frame of the software renderer can take longer than a fixed wait: poll
// for what should happen, and give up after a few seconds
async function settles(page, read, wanted, ms = 5000) {
  const end = Date.now() + ms;
  let value = await read();
  while (value !== wanted && Date.now() < end) {
    await page.waitForTimeout(150);
    value = await read();
  }
  return value === wanted;
}
const waitState = (page, values) =>
  page
    .waitForFunction((list) => list.includes(document.querySelector(".guinea-run")?.getAttribute("data-state")), [].concat(values), { timeout: OPEN_TIMEOUT })
    .then(
      () => true,
      () => false
    );

// Whether the Hall of Fame box of the end card shows, and says this
const hofBoxSays = (page, pattern) =>
  page.textContent(".guinea-run .gr-modal-body .gr-hof-invite:not([hidden])", { timeout: 500 }).then(
    (text) => pattern.test(text || ""),
    () => false
  );
// Whether the join modal of a first score shows, and says this
const joinSays = (page, pattern) =>
  page.textContent(".guinea-run .gr-join", { timeout: 500 }).then(
    (text) => pattern.test(text || ""),
    () => false
  );

async function typeKeys(page, keys, gap) {
  for (const key of keys) {
    await page.keyboard.press(key);
    if (gap) {
      await page.waitForTimeout(gap);
    }
  }
}

async function openWorld(page, locale, world, extra) {
  await page.goto(`${site.base}${locale}/?guinea-unlock=all&guinea-world=${world}&guinea-seed=3${extra || ""}`, { waitUntil: "load" });
  await typeKeys(page, KONAMI_ARROWS);
  return waitState(page, "intro");
}

// What each world must react to, and how the check sees it
const WORLD_PROBES = {
  0: { keys: ["ArrowLeft"], attr: "lane", expect: "0" },
  1: { keys: ["ArrowRight", "ArrowRight", "ArrowRight"], attr: "x", changes: true },
  2: { keys: ["ArrowLeft"], attr: "lane", expect: "0" },
  3: { keys: ["Enter"], attr: "phase", changes: true },
  4: { keys: ["ArrowLeft"], attr: "lane", expect: "0" },
  5: { keys: [], attr: "round", expect: "1" },
  6: { keys: ["ArrowUp"], attr: "jumps", changes: true },
  7: { keys: ["ArrowLeft"], attr: "lane", expect: "0" },
  8: { keys: ["ArrowUp"], attr: "jumps", changes: true },
  // World 9 opens on its whack-a-mole: the left arrow takes the guinea pig from the middle hole to the one on its left
  9: { keys: ["ArrowLeft"], attr: "hole", expect: "3" }
};

try {
  // 1. English page, the arrows, the map, and world 0 with the keyboard alone
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    await page.goto(`${site.base}en/`, { waitUntil: "load" });
    await typeKeys(page, KONAMI_ARROWS);
    expect(await waitState(page, "map"), "the Konami code with arrows opens the map on an English page");
    const title = await page.textContent(".guinea-run .gr-panel");
    expect(/The pipeline of US-014/.test(title || ""), "the game speaks English on an English page");
    expect((await page.locator(".guinea-run .gr-card").count()) === WORLDS.length, `the map shows the ${WORLDS.length} worlds`);
    expect((await page.locator(".guinea-run .gr-card.is-locked").count()) === WORLDS.length - 1, "a new player has only world 0 open");
    expect(
      await page.evaluate(() => (window.dataLayer || []).some((entry) => entry[0] === "event" && entry[1] === "easter_egg_found")),
      "finding the egg is sent to Google Analytics"
    );
    await page.keyboard.press("Enter");
    expect(await waitState(page, "intro"), "Enter on the map opens world 0");
    await page.keyboard.press("Enter");
    expect(await waitState(page, "playing"), "Enter on the world card starts it");
    await page.keyboard.press("ArrowLeft");
    expect(await settles(page, () => data(page, "lane"), "0"), "the left arrow moves the guinea pig to the left lane");
    await page.keyboard.press("d");
    expect(await settles(page, () => data(page, "lane"), "1"), "D moves it back to the middle lane");
    await page.keyboard.press("p");
    expect((await state(page)) === "paused", "P pauses the world");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    expect((await state(page)) === null, "Esc closes the game");
    expect(await page.evaluate(() => !document.documentElement.classList.contains("guinea-run-open")), "the page scrolls again once the game is closed");

    // A page change under an open game removes it
    await typeKeys(page, KONAMI_ARROWS);
    expect(await waitState(page, "map"), "the game opens a second time on the same page");
    await page.evaluate(() => {
      document.querySelector(".md-nav--primary a.md-nav__link[href*='level-1']").click();
    });
    await page.waitForFunction(() => /level-1/.test(window.location.pathname), null, { timeout: 10000 });
    expect(await settles(page, () => state(page), null), "an instant navigation closes the game");
    await page.context().close();
  }

  // 2. French page, WASD, and nothing from a text field
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    await page.goto(`${site.base}fr/`, { waitUntil: "load" });
    await page.evaluate(() => {
      const field = document.createElement("input");
      field.id = "egg-check-field";
      document.querySelector(".md-content").prepend(field);
      field.focus();
    });
    await typeKeys(page, KONAMI_ARROWS);
    await page.waitForTimeout(800);
    expect((await state(page)) === null, "the code typed in a text field does not open the game");
    await page.evaluate(() => document.getElementById("egg-check-field").remove());
    await typeKeys(page, KONAMI_WASD);
    expect(await waitState(page, "map"), "the Konami code on WASD opens the map on a French page");
    const title = await page.textContent(".guinea-run .gr-panel");
    expect(/Le pipeline de US-014/.test(title || ""), "the game speaks French on a French page");
    const link = await page.evaluate(() => {
      document.querySelector('.guinea-run [data-action="play"]').click();
      return null;
    });
    void link;
    expect(await waitState(page, "intro"), "a world card opens on the French page");
    const href = await page.getAttribute(".guinea-run .gr-labs a", "href");
    expect(Boolean(href && href.includes("/fr/level-1-contributor-basics/1-1-")), "the lab link of a French world card goes to the French lab");
    await page.context().close();
  }

  // 3. Every world: opens, starts, reacts, ends, and gives back what it drew
  for (const world of WORLDS) {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    const opened = await openWorld(page, "en", world.id);
    expect(opened, `world ${world.id} opens its card`);
    if (!opened) {
      await page.context().close();
      continue;
    }
    await page.click('.guinea-run [data-action="start"]');
    expect(await waitState(page, "playing"), `world ${world.id} starts`);
    const probe = WORLD_PROBES[world.id];
    // The first frames of a world can be slow on a busy machine: start from its
    // first drawn frame, then give the keys a few seconds to show
    const firstFrameBy = Date.now() + 5000;
    while ((await data(page, probe.attr)) === null && Date.now() < firstFrameBy) {
      await page.waitForTimeout(150);
    }
    const before = await data(page, probe.attr);
    await page.waitForTimeout(600);
    await typeKeys(page, probe.keys, 250);
    const hasReacted = (value) => (probe.changes ? value !== null && value !== before : value === probe.expect);
    let after = await data(page, probe.attr);
    const until = Date.now() + 3000;
    while (!hasReacted(after) && Date.now() < until) {
      await page.waitForTimeout(150);
      after = await data(page, probe.attr);
    }
    const reacted = hasReacted(after);
    expect(reacted, `world ${world.id} reacts to its controls (data-${probe.attr}: ${before} -> ${after})`);
    await page.waitForTimeout(1500);
    const playing = await state(page);
    expect(playing === "playing" || playing === "failed", `world ${world.id} keeps running for a few seconds (state ${playing})`);
    if (world.module === "world-9-monitoring.js") {
      // An admin who gets away brings up the retrofit button, and a click takes it
      const waiting = () => data(page, "retrofit").then((n) => Number(n || 0));
      const shown = await settles(page, async () => (await waiting()) > 0, true, 15000);
      expect(shown, "world 9 brings up the retrofit button when an admin gets away");
      if (shown) {
        const queued = await waiting();
        await page.click(".guinea-run .gr-w9-retro");
        expect(await settles(page, async () => (await waiting()) < queued, true, 5000), "world 9 takes the retrofit on a click");
      }
    }
    await page.evaluate(() => window.__guineaRun.finish());
    // The last world ends on the credits, the others on their result
    const last = world.id === WORLDS.length - 1;
    const endState = last ? "credits" : "done";
    const end = world.badge ? ["celebrating", endState] : [endState];
    expect(await waitState(page, end), `world ${world.id} ends on ${last ? "the credits" : "its result"}${world.badge ? ", with its badge" : ""}`);
    if (world.badge) {
      await page.keyboard.press("Enter");
      expect(await waitState(page, endState), `world ${world.id} goes from its badge to ${last ? "the credits" : "its result"}`);
    }
    if (!last) {
      expect((await page.locator('.guinea-run [data-action="next"]').count()) === 1, `world ${world.id} offers the next world`);
    } else {
      // The credits roll first: the Special Thanks of sfdx-hardis, then Cloudity
      const roll = await page.evaluate(() => ({
        names: document.querySelectorAll(".guinea-run .gr-roll-names li").length,
        contact: document.querySelector(".guinea-run .gr-roll .gr-roll-contact")?.getAttribute("href") || ""
      }));
      expect(roll.names >= 40 && /^https:\/\/cloudity\.com\/contact-us\//.test(roll.contact), `the credits roll the special thanks (${roll.names} names) and invite to contact Cloudity`);
      await page.click('.guinea-run [data-action="credits-card"]');
      expect(await settles(page, () => page.locator('.guinea-run [data-action="credits-roll"]').count(), 1), "the credits roll leads to the final card");
    }
    const geometriesInWorld = await page.evaluate(() => window.__guineaRun.geometries());
    await page.click('.guinea-run [data-action="map"]');
    expect(await waitState(page, "map"), `world ${world.id} goes back to the map`);
    await page.waitForTimeout(400);
    const geometriesOnMap = await page.evaluate(() => window.__guineaRun.geometries());
    expect(geometriesOnMap < geometriesInWorld || geometriesInWorld < 60, `world ${world.id} frees its geometries (${geometriesInWorld} in the world, ${geometriesOnMap} on the map)`);
    expect(await page.evaluate(() => !document.getElementById("guinea-run-world-css")), `world ${world.id} takes its styles away with it`);
    await page.context().close();
  }

  // 4. Progress: finishing a world opens the next, and the browser remembers
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    await page.goto(`${site.base}en/?guinea-test=1&guinea-online=fake`, { waitUntil: "load" });
    await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
    await typeKeys(page, KONAMI_ARROWS);
    await waitState(page, "map");
    await page.click('.guinea-run [data-action="play"][data-world="0"]');
    await waitState(page, "intro");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.finish());
    await waitState(page, "done");
    expect(await settles(page, () => joinSays(page, /Join the Hall of Fame/), true, 10000), "the first won world opens the join modal over its end card");
    await page.keyboard.press("Escape");
    expect((await page.locator(".guinea-run .gr-join").count()) === 0 && (await state(page)) === "done", "Escape on the join modal is No thanks: the end card stays");
    expect(await page.evaluate(() => window.__guineaRun.online.profile().asked), "No thanks is remembered: the join modal is asked once");
    await page.click('.guinea-run [data-action="map"]');
    await waitState(page, "map");
    expect((await page.locator('.guinea-run [data-action="play"][data-world="1"]').count()) === 1, "finishing world 0 opens world 1");
    await page.reload({ waitUntil: "load" });
    await typeKeys(page, KONAMI_ARROWS);
    await waitState(page, "map");
    expect((await page.locator('.guinea-run [data-action="play"][data-world="1"]').count()) === 1, "the browser remembers world 1 is open");
    expect((await page.textContent('.guinea-run .gr-card[data-world="0"] .gr-stars')).includes("★"), "the map shows the stars of world 0");
    await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
    await page.context().close();
  }

  // 4a. World 0's admin, played by the world's own autoplay (decided at every
  // step of the world): past the Re-check door the track holds, he throws his
  // blocks across the lanes, the tools caught fly to his laptop until his
  // excuses run out, he installs VS Code himself and the world ends. A small
  // window, so the software renderer plays the fight at about its real speed
  // 4b. The Hall of Fame against the database in memory (guinea-online=fake):
  // world 0 won, the join modal over its end card, the nickname typed without
  // moving the guinea pig, a guinea pig picked, the score on the board with my
  // row marked, a nickname with an email refused, a new nickname saved, and
  // "Remove me". A test link never sends anything to the real database.
  {
    for (const viewport of [{ width: 1280, height: 860 }, { width: 390, height: 844, mobile: true }]) {
      const options = viewport.mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport };
      const page = await newPage(options);
      await page.goto(`${site.base}en/?guinea-test=1&guinea-online=fake`, { waitUntil: "load" });
      await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
      await typeKeys(page, KONAMI_ARROWS);
      await waitState(page, "map");
      if (!viewport.mobile) {
        await page.click('.guinea-run [data-action="mode"][data-mode="hard"]');
        const hard = await settles(page, () => page.locator('.guinea-run [data-mode="hard"].is-active').count(), 1);
        const saved = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}").mode, PROGRESS_KEY);
        expect(hard && saved === "hard", `the map switches to Hard mode and the browser remembers it (${saved})`);
        await page.click('.guinea-run [data-action="play"][data-world="0"]');
        await waitState(page, "intro");
        const line = (await page.textContent(".guinea-run .gr-mode-line").catch(() => "")) || "";
        expect(/twice|2 times/.test(line) || /x2/.test(line), `the card of a world says it plays in Hard mode (${line})`);
        await page.click('.guinea-run [data-action="map"]');
        await waitState(page, "map");
        await page.click('.guinea-run [data-action="mode"][data-mode="easy"]');
        await settles(page, () => page.locator('.guinea-run [data-mode="easy"].is-active').count(), 1);
      }
      // Two rivals already on the board of world 0
      await page.evaluate(() =>
        window.__guineaRun.online.seed([
          { name: "Octo-Cat", coat: "golden", boards: [{ board: "w0", score: 31000, stars: 3, bossMs: 41200 }] },
          { name: "Jane-Doe", coat: "snow", boards: [{ board: "w0", score: 90, stars: 1 }] }
        ])
      );
      await page.click('.guinea-run [data-action="play"][data-world="0"]');
      await waitState(page, "intro");
      await page.click('.guinea-run [data-action="start"]');
      await waitState(page, "playing");
      await page.evaluate(() => window.__guineaRun.finish());
      await waitState(page, "done");
      expect(await settles(page, () => joinSays(page, /Join the Hall of Fame/), true, 10000), `the first won world opens the join modal over its end card (${viewport.mobile ? "phone" : "desktop"})`);
      expect(await joinSays(page, /Your first score!/), "the join modal shows the first score");
      const fits = await page.evaluate(() => {
        const save = document.querySelector(".guinea-run .gr-join .gr-hof-save").getBoundingClientRect();
        return save.width > 0 && save.bottom <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(fits, "the call to action of the join modal is on screen, and nothing scrolls sideways");
      await page.click(".guinea-run .gr-join .gr-hof-field input");
      await page.keyboard.type("wasd-dev", { delay: 30 });
      const typed = await page.inputValue(".guinea-run .gr-join .gr-hof-field input");
      expect(typed === "wasd-dev" && (await state(page)) === "done", `the nickname box takes W, A, S and D as letters (${typed})`);
      await page.click('.guinea-run .gr-join [data-coat="ginger"]');
      await page.click(".guinea-run .gr-join .gr-hof-save");
      expect(await settles(page, () => hofBoxSays(page, /Welcome to the Hall of Fame/), true, 10000), "joining closes the modal and the end card says the best scores are on their way");
      expect((await page.locator(".guinea-run .gr-join").count()) === 0, "the join modal is gone once the player joined");
      const db = await page.evaluate(() => window.__guineaRun.online.db());
      expect(
        db.names.some((n) => n.name === "wasd-dev" && n.coat === "ginger") && db.scores.some((s) => s.board === "w0" && s.score > 0) && (await page.evaluate(() => window.__guineaRun.online.profile().asked)),
        "the nickname, the guinea pig and the score of world 0 reach the database, and the join box never comes back"
      );
      await page.click('.guinea-run .gr-modal-body [data-action="hof"][data-world="0"]');
      expect(await waitState(page, "hof"), "the end card opens the board of its world");
      expect(await settles(page, () => page.locator(".guinea-run .gr-hof-row").count(), 3, 15000), "the board of world 0 lists the three players");
      const me = await page.textContent(".guinea-run .gr-hof-row.is-you .gr-hof-handle").catch(() => "");
      expect(me === "wasd-dev", `the player's own row is marked (${me})`);
      expect(viewport.mobile || (await page.locator(".guinea-run .gr-hof-time").count()) > 0, "the board of a world shows the boss times");
      const wide = await page.evaluate(() => {
        const panel = document.querySelector(".guinea-run .gr-panel");
        return { page: document.documentElement.scrollWidth - window.innerWidth, panel: panel ? panel.scrollWidth - panel.clientWidth : 0 };
      });
      expect(wide.page <= 0 && wide.panel <= 1, `the Hall of Fame scrolls nowhere sideways (page ${wide.page} px, card ${wide.panel} px)`);
      await page.click('.guinea-run [data-action="hof-tab"][data-tab="all"]');
      const first = await settles(page, () => page.locator(".guinea-run .gr-hof-row .gr-hof-handle").first().textContent().catch(() => ""), "Octo-Cat", 15000);
      expect(first, "the general board puts the best total first");
      const field = ".guinea-run .gr-hof-send .gr-hof-field input";
      expect((await page.inputValue(field)) === "wasd-dev", "the profile box shows the nickname");
      await page.fill(field, "me@example.com");
      await page.click(".guinea-run .gr-hof-send .gr-hof-save");
      expect(/no email/.test((await page.textContent(".guinea-run .gr-hof-send .gr-hof-message")) || ""), "a nickname with an email is refused before anything is sent");
      await page.fill(field, "wasd-dev2");
      await page.click('.guinea-run .gr-hof-send [data-coat="slate"]');
      await page.click(".guinea-run .gr-hof-send .gr-hof-save");
      // The database takes one nickname every 10 s: the change may wait for its next try
      const renamed = await settles(page, () => page.evaluate(() => window.__guineaRun.online.db().names.some((n) => n.name === "wasd-dev2" && n.coat === "slate")), true, 30000);
      expect(renamed, "a new nickname and guinea pig are saved");
      await page.click(".guinea-run .gr-hof-forget");
      await page.click(".guinea-run .gr-hof-confirm .gr-button:first-of-type");
      expect(await settles(page, () => page.textContent(".guinea-run .gr-hof-confirm").then((s) => /Removed/.test(s || "")), true, 10000), '"Remove me" says it is done');
      const left = await page.evaluate(() => window.__guineaRun.online.db());
      expect(!left.names.some((n) => n.name.startsWith("wasd-dev")) && (await page.evaluate(() => !window.__guineaRun.online.profile().id)), "removing the player deletes every row and stops the sends");
      await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
      await page.context().close();
    }
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    await page.goto(`${site.base}fr/?guinea-test=1`, { waitUntil: "load" });
    await typeKeys(page, KONAMI_ARROWS);
    await waitState(page, "map");
    await page.click('.guinea-run .gr-map-meta [data-action="hof"]');
    await waitState(page, "hof");
    const texts = await page.evaluate(() => ({
      input: Boolean(document.querySelector(".guinea-run .gr-hof-field input")),
      send: document.querySelector(".guinea-run .gr-hof-send")?.textContent || ""
    }));
    expect(!texts.input && /lien de test/.test(texts.send), "a test link sends nothing, and says so in French");
    await page.context().close();
  }

  {
    const page = await newPage({ viewport: { width: 640, height: 430 } });
    // guinea-at=860: past the Re-check door, 20 m before the admin
    expect(await openWorld(page, "en", 0, "&guinea-at=860"), "world 0 opens before its admin");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w0.autoplay(true));
    expect(await settles(page, () => data(page, "boss"), "fight", 30000), 'the "Why install anything?" admin holds the track past the Re-check door');
    // "beaten" lasts a few seconds, then "done" as the track runs again: either one says he gave in
    const gaveIn = () => data(page, "boss").then((v) => (v === "beaten" || v === "done" ? "in" : v));
    expect(await settles(page, gaveIn, "in", 240000), "the tools brought to his laptop take all his excuses");
    const [thrown, bites] = await Promise.all(["thrown", "bites"].map((name) => data(page, name).then(Number)));
    expect(thrown > 0 && bites >= 18, `he threw blocks across the lanes and the guinea pig brought him his tools (${thrown} rows thrown, ${bites} tools)`);
    expect(await waitState(page, "done"), `he installs VS Code himself and world 0 ends (${await data(page, "bosstime")} s of game time for the fight)`);
    await page.context().close();
  }

  // 4b. World 1's castle, played to its end by the world's own autoplay: it
  // dodges the admin's Flows, runs under him while he jumps, touches the axe,
  // and the bridge goes down with him (decided at every step of the world,
  // whatever the frame rate of the software renderer)
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    // guinea-at=169: the checkpoint at the castle door
    expect(await openWorld(page, "en", 1, "&guinea-at=169"), "world 1 opens at its castle");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w1.autoplay(true));
    // A slow software renderer plays the game slower than the clock: generous waits
    expect(await settles(page, () => data(page, "boss"), "fight", 120000), "the admin on the bridge fights after his talk");
    const over = async () => (["done", "failed"].includes(await state(page)) ? "over" : "playing");
    await settles(page, over, "over", 300000);
    const end = await state(page);
    const boss = await data(page, "boss");
    const flows = Number(await data(page, "flows"));
    const jumps = Number(await data(page, "adminJumps"));
    expect(end === "done" && boss === "down", `the guinea pig touches the axe and the admin falls into the lava (state ${end}, data-boss: ${boss})`);
    expect(flows > 0 && jumps > 0, `the admin threw Flows and jumped (${flows} thrown, ${jumps} jumps)`);
    await page.context().close();
  }

  // 5. The plan of world 3 reaches world 6
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    await page.goto(`${site.base}en/`, { waitUntil: "load" });
    await page.evaluate((key) => {
      const plan = { pre: ["deliverability", "backfill"], post: ["refdata", "schedule"] };
      window.localStorage.setItem(key, JSON.stringify({ v: 1, unlocked: 8, worlds: {}, badges: [], notes: {}, plan, finished: false }));
    }, PROGRESS_KEY);
    await openWorld(page, "en", 6);
    expect((await data(page, "misplaced")) === "1", "an action declared before the deployment in world 3 fails in world 6");
    await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
    await page.context().close();
  }

  // 5a. World 7's testers, played by the world's own autoplay (decided at every
  // step of the world): the track holds, one tester validates US-062, the other
  // leaves on sick leave, and the promotion question comes after them. A small
  // window, so the software renderer plays the fight at about its real speed
  {
    const page = await newPage({ viewport: { width: 640, height: 430 } });
    // guinea-at=285: where the track holds for the testers of the uat org
    expect(await openWorld(page, "en", 7, "&guinea-at=285"), "world 7 opens at its testers");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w7.autoplay(true));
    expect(await settles(page, () => data(page, "boss"), "1", 30000), "the tester of US-062 holds the track at the end of the uat branch");
    expect(await settles(page, () => data(page, "fight"), "beaten", 240000), "the vegetables make him test: US-062 validated in the uat org");
    expect(await settles(page, () => data(page, "boss"), "2", 60000), "the tester of US-058 comes at once");
    expect(await settles(page, () => data(page, "fight"), "escape", 240000), "he leaves on sick leave just before his last test");
    expect(await settles(page, () => data(page, "choice"), "on", 120000), `the promotion question comes after the testers (${await data(page, "fight-seconds")} s of game time for both)`);
    const question = (await page.textContent(".guinea-run .gr-run-q")) || "";
    expect(/US-058/.test(question), "the promotion question says why: US-058 is not validated");
    expect(await settles(page, () => data(page, "choice"), "off", 120000), "the guinea pig goes through a door of the promotion question");
    expect((await state(page)) === "playing", `world 7 plays on after its testers (state ${await state(page)})`);
    await page.context().close();
  }

  // 5b. World 8's boss, played to its end by the world's own autoplay (a jump on
  // the exact beat of each target, whatever the frame rate of the software renderer)
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    // guinea-at=164: the checkpoint where the Data Cloud rises
    expect(await openWorld(page, "en", 8, "&guinea-at=164"), "world 8 opens at its boss");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w8.autoplay(true));
    expect(await settles(page, () => data(page, "boss"), "fight", 20000), "the Data Cloud rises at the end of world 8");
    const fought = await page
      .waitForFunction(() => document.querySelector(".guinea-run")?.getAttribute("data-boss") !== "fight", null, { timeout: 240000 })
      .then(
        () => true,
        () => false
      );
    const [boss, thrown, shots] = await Promise.all(["boss", "thrown", "shots"].map((name) => data(page, name)));
    expect(fought && (boss === "down" || boss === "gone"), `the Data Cloud has no life left after the fight (data-boss: ${boss})`);
    expect(Number(thrown) > 0 && Number(shots) > 0, `it threw errors and the guinea pig fired vegetables back (${thrown} thrown, ${shots} fired)`);
    expect(await settles(page, () => data(page, "phase"), "dora", 60000), "the DORA card follows the boss");
    await page.context().close();
  }

  // 5c. World 5's admin, played by the world's own autoplay (decided at every
  // step of the world): it lets him click once, undoes it, keeps both sides of
  // every conflict, and his push meets the branch protection. A small window,
  // so the software renderer plays the fight at about its real speed
  {
    const page = await newPage({ viewport: { width: 640, height: 430 } });
    // guinea-at=4: straight to the admin, after the three rounds
    expect(await openWorld(page, "en", 5, "&guinea-at=4"), "world 5 opens at its admin");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w5.autoplay(true));
    expect(await settles(page, () => data(page, "boss"), "fight", 30000), "the admin grabs the mouse at the end of world 5");
    expect(await settles(page, () => data(page, "boss"), "push", 300000), "the four files are merged with both sides kept");
    const [wipes, caught] = await Promise.all(["wipes", "caught"].map((name) => data(page, name).then(Number)));
    expect(wipes > 0 && caught > 0, `he clicked Accept Current Change and the guinea pig undid it (${wipes} clicks, ${caught} undone)`);
    expect(await settles(page, () => data(page, "boss"), "beaten", 60000), "his git push --force is rejected by the branch protection");
    const end = ["celebrating", "done"];
    expect(await waitState(page, end), `world 5 ends on its badge after the admin (${await data(page, "bosstime")} s of game time for the fight)`);
    await page.context().close();
  }

  // 5d. World 2's admin, played by the world's own autoplay (decided at every
  // step of the world): it throws back every crate that is not US-014 and lets
  // the four files roll in, he gives up, and the commit cards follow to the end
  // of the world. A small window, so the software renderer plays the fight at
  // about its real speed
  {
    const page = await newPage({ viewport: { width: 640, height: 430 } });
    // guinea-at=1: straight to the admin, the four files of US-014 staged
    expect(await openWorld(page, "en", 2, "&guinea-at=1"), "world 2 opens at its admin");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w2.autoplay(true));
    expect(await settles(page, () => data(page, "boss"), "fight", 30000), 'the "git add ." admin comes out of the Metadata Retriever at the end of world 2');
    expect(await settles(page, () => data(page, "boss"), "beaten", 300000), "the junk thrown back at him takes all his health");
    const [dumped, back, staged] = await Promise.all(["dumped", "thrownback", "staged"].map((name) => data(page, name).then(Number)));
    expect(dumped > 0 && back > 0 && staged === 4, `he threw crates, the guinea pig threw the junk back and kept its 4 files (${dumped} thrown, ${back} back, ${staged} staged)`);
    expect(await waitState(page, "done"), `the commit cards follow and world 2 ends (${await data(page, "bosstime")} s of game time for the fight)`);
    const bonuses = (await page.textContent(".guinea-run .gr-bonuses").catch(() => "")) || "";
    expect(/mistake/.test(bonuses) && /Boss beaten in \d+ s/.test(bonuses), `the end card lists the bonuses, mistakes and boss time included (${bonuses})`);
    await page.context().close();
  }

  // 5e. World 3's admin, played by the world's own autoplay (each card he takes,
  // and the base he switches to main, goes back a moment later): his bar runs
  // out, the check goes green, and the world ends on its badge. A small window,
  // so the software renderer plays the fight at about its real speed
  {
    const page = await newPage({ viewport: { width: 640, height: 430 } });
    // guinea-at=4: straight to the admin, the deployment actions committed
    expect(await openWorld(page, "en", 3, "&guinea-at=4"), "world 3 opens at its admin");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w3.autoplay(true));
    expect(await settles(page, () => data(page, "boss"), "fight", 30000), 'the "I\'ll do it by hand after" admin comes at the end of world 3');
    expect(await settles(page, () => data(page, "boss"), "beaten", 240000), "each action and the base put back takes all his health, and the check goes green");
    const taken = Number(await data(page, "taken"));
    expect(taken >= 8, `he took the deployment actions out and switched the base, and each went back (${taken} moves)`);
    expect(await waitState(page, ["celebrating", "done"]), `world 3 ends on its badge after the admin (${await data(page, "bosstime")} s of game time for the fight)`);
    await page.context().close();
  }

  // 5f. World 4's Dev, played by the world's own autoplay (decided at every
  // step of the world): he throws lines of i++ and worse down the lanes, the
  // guinea pig stops them and hits him when his lane is clear, he gives up and
  // the world ends. A small window, so the software renderer plays the fight
  // at about its real speed
  {
    const page = await newPage({ viewport: { width: 640, height: 430 } });
    // guinea-at=6: straight to the Dev, after the review of Mariia's Pull Request
    expect(await openWorld(page, "en", 4, "&guinea-at=6"), "world 4 opens at its Dev");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w4.autoplay(true));
    expect(await settles(page, () => data(page, "dev"), "fight", 30000), "the Dev who pads his tests with i++ comes at the end of world 4");
    const face = await page.evaluate(() => {
      const img = document.querySelector(".guinea-run .gr-dev-bar img");
      return Boolean(img && img.complete && img.naturalWidth > 0 && /bosses\/boss-\d+\.svg/.test(img.src));
    });
    expect(face && Number(await data(page, "devface")) > 0, `the Dev has one of the twenty-one faces (data-devface: ${await data(page, "devface")})`);
    expect(await settles(page, () => data(page, "dev"), "beaten", 240000), "the fixes thrown when his lane is clear take all his health");
    const [thrown, stopped] = await Promise.all(["thrown", "stopped"].map((name) => data(page, name).then(Number)));
    expect(thrown > 0 && stopped > 0, `he threw his lines and the guinea pig stopped the i++ (${thrown} thrown, ${stopped} i++ stopped)`);
    expect(await waitState(page, "done"), "he says he will write real assertions, and world 4 ends");
    await page.context().close();
  }

  // 5g. World 6's Dev "works on my sandbox", played to its end by the world's
  // own autoplay (a jump on the exact beat of each target, whatever the frame
  // rate of the software renderer): he throws his uncommitted components on
  // the beat, the Pull Requests make the pipeline fire back, and the
  // deployment reaches the integration org
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    // guinea-at=196: the checkpoint where the Dev walks in, after the choice of US-062
    expect(await openWorld(page, "en", 6, "&guinea-at=196"), "world 6 opens at its Dev");
    await page.click('.guinea-run [data-action="start"]');
    await waitState(page, "playing");
    await page.evaluate(() => window.__guineaRun.w6.autoplay(true));
    expect(await settles(page, () => data(page, "dev"), "fight", 20000), 'the Dev "works on my sandbox" walks in near the end of world 6');
    const face = await page.evaluate(() => {
      const img = document.querySelector(".guinea-run .gr-dev-bar img");
      return Boolean(img && img.complete && img.naturalWidth > 0 && /bosses\/boss-\d+\.svg/.test(img.src));
    });
    expect(face && Number(await data(page, "devface")) > 0, `the Dev has one of the twenty-one faces (data-devface: ${await data(page, "devface")})`);
    const fought = await page
      .waitForFunction(() => document.querySelector(".guinea-run")?.getAttribute("data-dev") !== "fight", null, { timeout: 240000 })
      .then(
        () => true,
        () => false
      );
    const [dev, thrown, shots] = await Promise.all(["dev", "thrown", "shots"].map((name) => data(page, name)));
    expect(fought && (dev === "down" || dev === "gone"), `the Dev has no health left after the fight (data-dev: ${dev})`);
    expect(Number(thrown) > 0 && Number(shots) > 0, `he threw his components and the pipeline fired back (${thrown} thrown, ${shots} fired)`);
    expect(await waitState(page, "done"), "the deployment from git reaches the integration org, and world 6 ends");
    await page.context().close();
  }

  // 5h. Pipeline Pinball, the bonus table
  {
    const allDone = (teaserSeen) => {
      const worlds = {};
      for (let w = 0; w < 10; w++) {
        worlds[w] = { best: 1000, stars: 1 };
      }
      return JSON.stringify({ v: 1, unlocked: 9, worlds, badges: [1, 2, 3], notes: {}, plan: null, finished: true, bonus: { best: 0, record: null, teaserSeen }, bonuses: { orgman: { best: 0, record: null, teaserSeen } } });
    };
    // Hidden while a world is still to do
    {
      const page = await newPage({ viewport: { width: 1280, height: 860 } });
      await page.goto(`${site.base}en/`, { waitUntil: "load" });
      await page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ v: 1, unlocked: 3, worlds: { 0: { best: 10, stars: 1 } }, badges: [], notes: {}, plan: null, finished: false })), PROGRESS_KEY);
      await typeKeys(page, KONAMI_ARROWS);
      await waitState(page, "map");
      expect((await page.locator(".guinea-run .gr-bonus-card").count()) === 0, "the bonuses stay hidden while a world is still to do");
      // Every world done: the teaser shows once, then the card on the map
      await page.evaluate((args) => window.localStorage.setItem(args[0], args[1]), [PROGRESS_KEY, allDone(false)]);
      await page.reload({ waitUntil: "load" });
      await typeKeys(page, KONAMI_ARROWS);
      expect(await waitState(page, "credits"), "a player who finished every world gets the teaser of the bonus table");
      const teaser = (await page.textContent(".guinea-run .gr-panel")) || "";
      expect(/One more thing/.test(teaser) && (await page.locator('.guinea-run [data-action="bonus"][data-world="pinball"]').count()) === 1, "the teaser offers to play Pipeline Pinball");
      expect((await page.locator('.guinea-run [data-action="bonus"][data-world="orgman"]').count()) === 1 && /Org-Man/.test(teaser), "the same teaser offers Org-Man");
      await page.click('.guinea-run [data-action="map"]');
      expect(await waitState(page, "map"), "Later goes to the map");
      expect((await page.locator(".guinea-run .gr-bonus-card").count()) === 2, "the map shows the cards of both bonuses once every world is done");
      await page.reload({ waitUntil: "load" });
      await typeKeys(page, KONAMI_ARROWS);
      expect(await waitState(page, "map"), "the teaser shows only once");
      await page.click('.guinea-run .gr-bonus-card [data-action="bonus"][data-world="pinball"]');
      expect(await waitState(page, "intro"), "the card of the bonus table opens its intro");
      // A player who knew the table before Org-Man existed gets the teaser of Org-Man alone, once
      const before = JSON.parse(allDone(true));
      before.bonuses.orgman.teaserSeen = false;
      await page.evaluate((args) => window.localStorage.setItem(args[0], args[1]), [PROGRESS_KEY, JSON.stringify(before)]);
      await page.reload({ waitUntil: "load" });
      await typeKeys(page, KONAMI_ARROWS);
      expect(await waitState(page, "credits"), "a player who knew the table gets the teaser of Org-Man");
      expect(
        (await page.locator('.guinea-run [data-action="bonus"][data-world="orgman"]').count()) === 1 && (await page.locator('.guinea-run [data-action="bonus"][data-world="pinball"]').count()) === 0,
        "that teaser offers Org-Man alone"
      );
      await page.click('.guinea-run [data-action="bonus"][data-world="orgman"]');
      expect(await waitState(page, "intro"), "the teaser opens the card of Org-Man");
      await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
      await page.context().close();
    }
    // Played: the flippers, the balls, the Production floor, the end
    {
      const page = await newPage({ viewport: { width: 1280, height: 860 } });
      expect(await openWorld(page, "en", "pinball", "&guinea-online=fake"), "the bonus table opens its card");
      await page.click('.guinea-run [data-action="bonus-new"]');
      expect(await waitState(page, "playing"), "a game of Pipeline Pinball starts");
      await page.waitForFunction(() => window.__guineaRun && window.__guineaRun.pinball, null, { timeout: 20000 }).catch(() => {});
      const flippers = () => page.evaluate(() => window.__guineaRun.pinball.flippers());
      await page.keyboard.down("ShiftLeft");
      const up = await settles(page, () => flippers().then((f) => f.left && !f.right), true, 3000);
      await page.keyboard.up("ShiftLeft");
      const down = await settles(page, () => flippers().then((f) => !f.left), true, 3000);
      expect(up && down, "the left flipper is up while Shift is held, and down once it is let go");
      // The ball waits on the plunger: while it is the only one, the right half pulls the plunger.
      // Space launches it first, then the halves of the screen are the flippers, as fingers do
      await page.keyboard.down("Space");
      await page.waitForTimeout(500);
      await page.keyboard.up("Space");
      await page.waitForTimeout(800);
      await page.mouse.move(1000, 500);
      await page.mouse.down();
      const right = await settles(page, () => flippers().then((f) => f.right && !f.left), true, 3000);
      await page.mouse.up();
      expect(right && (await settles(page, () => flippers().then((f) => !f.right), true, 3000)), "a press on the right half of the screen holds the right flipper");
      // Straight to the big moments, before the bot plays: its game may end within two minutes
      await page.evaluate(() => window.__guineaRun.pinball.jump(1));
      expect(await settles(page, () => page.evaluate(() => window.__guineaRun.pinball.balls().length), 3, 30000), "Deploy to all orgs puts three balls on the table");
      await page.evaluate(() => window.__guineaRun.pinball.jump(3));
      expect(await settles(page, () => page.evaluate(() => window.__guineaRun.pinball.balls().some((b) => b.floor === 1 && b.mode === "table")), true, 30000), "the production ramp takes a ball up to the Production floor");
      // Five players on its board, the fifth at 5 points: the game passes it
      await page.evaluate(() => window.__guineaRun.online.seed([1, 2, 3, 4, 5].map((i) => ({ name: "p" + i, board: "pinball", score: i, level: 1 }))));
      expect(await settles(page, () => page.evaluate(() => window.__guineaRun.hofTarget()), 1, 5000), "the table knows the score of the fifth of its board");
      await page.evaluate(() => window.__guineaRun.pinball.autoplay(true));
      expect(await settles(page, () => data(page, "pb-top5"), "1", 30000), "the display flashes TOP 5 once the game passes the fifth of the board");
      // Two minutes of the bot: the ball never leaves the table
      let escaped = "";
      let lost = false;
      const until = Date.now() + 120000;
      while (Date.now() < until && !escaped) {
        await page.waitForTimeout(1000);
        if ((await state(page)) !== "playing") {
          lost = true;
          break;
        }
        const balls = await page.evaluate(() => window.__guineaRun.pinball.balls());
        for (const b of balls) {
          // Past the walls: the top arc ends at 23.05, the arc of the Production floor at 33.5
          const out = b.mode === "table" && (b.floor === 0 ? b.x < -5.6 || b.x > 6.7 || b.y > 23.4 : b.x < -4.1 || b.x > 4.1 || b.y > 33.8);
          if (out) {
            escaped = `${b.x.toFixed(2)},${b.y.toFixed(2)} on floor ${b.floor}`;
          }
        }
      }
      const hud = await page.evaluate(() => window.__guineaRun.pinball.hud());
      expect(!escaped, `the bot played the table${lost ? " to the end of its game" : " for two minutes"} and no ball left it${escaped ? ": " + escaped : ""} (score ${hud.score})`);
      expect(hud.score > 0, `the table scores (${hud.score} points)`);
      if (!lost) {
        await page.evaluate(() => window.__guineaRun.finish());
      }
      expect(await waitState(page, "done"), "a game of Pipeline Pinball ends on its card");
      expect((await page.locator(".guinea-run .gr-score").count()) === 1, "the end card of the bonus table shows the score");
      expect(await settles(page, () => joinSays(page, /Join the Hall of Fame/), true, 10000), "the end card of the bonus table opens the join modal for a player who never joined");
      await page.click(".guinea-run .gr-join .gr-hof-skip");
      expect((await page.locator(".guinea-run .gr-join").count()) === 0, "No thanks closes the join modal over the bonus table's end card");
      await page.click('.guinea-run [data-action="map"]');
      expect(await waitState(page, "map"), "the bonus table goes back to the map");
      expect(await page.evaluate(() => !document.getElementById("guinea-run-world-css")), "the bonus table takes its styles away with it");
      await page.context().close();
    }
    // Its board in the Hall of Fame
    {
      const page = await newPage({ viewport: { width: 1280, height: 860 } });
      await page.goto(`${site.base}en/?guinea-test=1&guinea-online=fake`, { waitUntil: "load" });
      await typeKeys(page, KONAMI_ARROWS);
      await waitState(page, "map");
      await page.evaluate(() => window.__guineaRun.online.seed([{ name: "Octo-Cat", coat: "chocolate", board: "pinball", score: 12345678, level: 2 }]));
      await page.click('.guinea-run .gr-map-meta [data-action="hof"]');
      await waitState(page, "hof");
      await page.click('.guinea-run [data-action="hof-tab"][data-tab="pinball"]');
      const row = await settles(page, () => page.locator(".guinea-run .gr-hof-row .gr-hof-handle").first().textContent().catch(() => ""), "Octo-Cat", 15000);
      expect(row, "the Hall of Fame has a Pinball board, with the best game of each player");
      await page.context().close();
    }
  }

  // 5i. Org-Man, the second bonus
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    expect(await openWorld(page, "en", "orgman", "&guinea-online=fake"), "Org-Man opens its card");
    await page.click('.guinea-run [data-action="bonus-new"]');
    expect(await waitState(page, "playing"), "a game of Org-Man starts");
    await page.waitForFunction(() => window.__guineaRun && window.__guineaRun.orgman, null, { timeout: 20000 }).catch(() => {});
    const om = () => page.evaluate(() => window.__guineaRun.orgman.state());
    // The software renderer of the check draws a few frames a second: Ready lasts longer than its 2.2 s of game time
    expect(await settles(page, () => om().then((s) => s.phase), "play", 30000), "the maze goes from Ready to play");
    const start = await om();
    await page.keyboard.press("ArrowRight");
    const moved = await settles(page, () => om().then((s) => s.pig.x !== start.pig.x || s.pig.y !== start.pig.y), true, 4000);
    const facing = await om();
    expect(moved && facing.pig.dir === 3, `the guinea pig follows the right arrow through the maze (${JSON.stringify(facing.pig)})`);
    await page.evaluate(() => window.__guineaRun.orgman.jump("blue"));
    expect(await settles(page, () => data(page, "om-blue"), "1", 3000), "a rocket turns the admins blue");
    // Five players on its board, the fifth at 5 points: the game passes it
    await page.evaluate(() => window.__guineaRun.online.seed([1, 2, 3, 4, 5].map((i) => ({ name: "p" + i, board: "orgman", score: i, level: 1 }))));
    expect(await settles(page, () => page.evaluate(() => window.__guineaRun.hofTarget()), 1, 5000), "the maze knows the score of the fifth of its board");
    await page.evaluate(() => window.__guineaRun.orgman.autoplay(true));
    expect(await settles(page, () => data(page, "om-top5"), "1", 30000), "the score to beat flashes once the game passes the fifth of the board");
    await page.evaluate(() => window.__guineaRun.orgman.jump("clear"));
    expect(await settles(page, () => data(page, "om-card"), "1", 20000), "the last dot clears the maze, and the card between two mazes shows");
    const card = (await page.textContent(".guinea-run .gr-om-card").catch(() => "")) || "";
    expect(/Maze 1 cleared/.test(card) && /Next: Flow Builder/.test(card), `the card says the maze is cleared and names the next one (${card.slice(0, 120)})`);
    expect(await settles(page, () => data(page, "om-level"), "2", 20000), "maze 2 starts after the card");
    const score = (await om()).score;
    expect(score > 0, `Org-Man scores (${score} points)`);
    await page.evaluate(() => window.__guineaRun.finish());
    expect(await waitState(page, "done"), "a game of Org-Man ends on its card");
    expect((await page.locator(".guinea-run .gr-score").count()) === 1, "the end card of Org-Man shows the score");
    expect(await settles(page, () => joinSays(page, /Join the Hall of Fame/), true, 10000), "the end card of Org-Man opens the join modal for a player who never joined");
    await page.keyboard.press("Escape");
    expect((await page.locator(".guinea-run .gr-join").count()) === 0 && (await state(page)) === "done", "Escape closes the join modal over Org-Man's end card, which stays");
    await page.click('.guinea-run [data-action="map"]');
    expect(await waitState(page, "map"), "Org-Man goes back to the map");
    expect(await page.evaluate(() => !document.getElementById("guinea-run-world-css")), "Org-Man takes its styles away with it");
    // Its board in the Hall of Fame
    await page.evaluate(() => window.__guineaRun.online.seed([{ name: "Maze-Cat", coat: "slate", board: "orgman", score: 45678, level: 4 }]));
    await page.click('.guinea-run .gr-map-meta [data-action="hof"]');
    await waitState(page, "hof");
    await page.click('.guinea-run [data-action="hof-tab"][data-tab="orgman"]');
    const row = await settles(page, () => page.locator(".guinea-run .gr-hof-row .gr-hof-handle").first().textContent().catch(() => ""), "Maze-Cat", 15000);
    expect(row, "the Hall of Fame has an Org-Man board, with the best game of each player");
    await page.context().close();
  }

  // 6. A phone: the footer guinea pig, the pads, swipes
  {
    const page = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.goto(`${site.base}fr/`, { waitUntil: "load" });
    const egg = page.locator("[data-guinea-egg]");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Scroll until the footer stops moving: the site scrolls smoothly, and late
    // content above it can still push it down
    let spot = null;
    for (let tries = 0; tries < 20; tries++) {
      const next = await egg.evaluate((node) => {
        // The comment frame never settles on a local copy: it resizes as it
        // retries, and the footer moves with it. It is not what this checks.
        document.querySelectorAll(".giscus, .giscus-frame").forEach((frame) => frame.remove());
        node.scrollIntoView({ block: "center", behavior: "instant" });
        const r = node.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (spot && Math.abs(next.y - spot.y) < 1) {
        break;
      }
      spot = next;
      await page.waitForTimeout(300);
    }
    // Then tap fast, as a reader does: the five taps must fit in three seconds
    for (let i = 0; i < 5; i++) {
      await page.touchscreen.tap(spot.x, spot.y);
    }
    expect(await waitState(page, "map"), "five taps on the footer guinea pig open the map on a phone");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "the map fits the width of a phone");
    await page.tap('.guinea-run [data-action="play"][data-world="0"]');
    expect(await waitState(page, "intro"), "tapping Play opens the world card on a phone");
    expect(await page.isChecked(".guinea-run .gr-toggle input"), "the pads are offered by default on a touch screen");
    await page.tap('.guinea-run [data-action="start"]');
    expect(await waitState(page, "playing"), "tapping Start starts the world");
    expect(await page.isVisible(".guinea-run .gr-controls"), "the pads are shown during the world");
    const box = await page.locator(".guinea-run .gr-canvas").boundingBox();
    const y = box.y + box.height * 0.45;
    await page.mouse.move(box.x + box.width * 0.3, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, y, { steps: 4 });
    await page.mouse.up();
    expect(await settles(page, () => data(page, "lane"), "2"), "a swipe to the right moves the guinea pig to the right lane");
    await page.tap('.guinea-run .gr-controls [data-pad="left"]');
    expect(await settles(page, () => data(page, "lane"), "1"), "the left pad moves it back to the middle lane");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "the page does not scroll sideways on a phone");
    await page.tap('.guinea-run [data-action="quit"]');
    await page.waitForTimeout(300);
    expect((await state(page)) === null, "the close button closes the game on a phone");
    await page.context().close();
  }

  // 7. Offline: play.html saves the game once, then plays without a network
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    const play = `${site.base}theme/javascripts/guinea-run/play.html?guinea-offline=1`;
    await page.goto(play, { waitUntil: "load" });
    expect(await waitState(page, "map"), "play.html opens the map");
    const saved = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const until = Date.now() + 60000;
      while (Date.now() < until) {
        const names = (await caches.keys()).filter((name) => name.startsWith("guinea-run-"));
        if (names.length && registration.active) {
          return (await (await caches.open(names[0])).keys()).length;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      return 0;
    });
    expect(saved > 100, `play.html saves the whole game for offline play (${saved} files)`);
    await page.context().route(/./, (route) => (new URL(route.request().url()).origin === new URL(site.base).origin ? route.continue() : route.abort()));
    await page.context().setOffline(true);
    for (const world of WORLDS.map((w) => String(w.id)).concat(BONUSES.map((b) => b.id))) {
      await page.goto(`${play}&guinea-unlock=all&guinea-world=${world}`, { waitUntil: "load" });
      expect(await waitState(page, "intro"), `offline, world ${world} opens from the saved copy`);
    }
    await page.goto(`${play}&guinea-unlock=all&guinea-world=1`, { waitUntil: "load" });
    if (await waitState(page, "intro")) {
      await page.click('.guinea-run [data-action="start"]');
      expect(await waitState(page, "playing"), "offline, world 1 starts and plays");
    }
    await page.context().close();
  }

  // 8. The save VS Code shares between projects: a page plays the extension around play.html
  {
    const page = await newPage({ viewport: { width: 1280, height: 860 } });
    const play = `${site.base}theme/javascripts/guinea-run/play.html?lang=en&from=vscode&save=host`;
    // A page of the local site plays the panel: a routed page counts as public, and Chrome refuses it a loopback frame
    await page.goto(`${site.base}404.html`, { waitUntil: "load" });
    await page.evaluate((url) => {
      // Over the page, which stays as it is (its own scripts expect their elements)
      const frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647";
      document.body.appendChild(frame);
      window.file = null;
      window.stored = [];
      window.cleared = false;
      window.addEventListener("message", (event) => {
        const data = event.data || {};
        if (event.source !== frame.contentWindow || data.source !== "guinea-run") {
          return;
        }
        if (data.type === "loadSave") {
          frame.contentWindow.postMessage({ source: "vscode-sfdx-hardis", type: "save", blob: window.file }, "*");
        } else if (data.type === "storeSave") {
          window.stored.push(data.blob);
        } else if (data.type === "clearSave") {
          window.cleared = true;
          window.file = null;
        }
      });
      window.openGame = (file) => {
        window.file = file;
        window.stored = [];
        window.cleared = false;
        frame.src = url;
      };
    }, play);
    const gameFrame = () => page.frames().find((f) => f.url().includes("play.html"));
    const frameState = async () => {
      const frame = gameFrame();
      return frame ? frame.evaluate(() => document.querySelector(".guinea-run")?.getAttribute("data-state") || null).catch(() => null) : null;
    };
    const openGame = async (file, wanted) => {
      await page.evaluate((f) => window.openGame(f), file);
      return settles(page, frameState, wanted, OPEN_TIMEOUT);
    };

    expect(await openGame(null, "map"), "in VS Code, the game asks for the shared save and opens the map");
    const hint = await gameFrame().textContent(".guinea-run .gr-map-hint");
    expect(/every VS Code project/.test(hint || ""), `in VS Code, the map says the progress follows every project (${hint})`);
    await gameFrame().click('.guinea-run [data-action="mute"]');
    const sent = await settles(page, () => page.evaluate(() => window.stored.some((blob) => JSON.parse(JSON.parse(blob).text).muted === "1")), true, 5000);
    expect(sent, "in VS Code, a change (the sound muted) is sent to the extension, signed");
    const good = await page.evaluate(() => window.stored[window.stored.length - 1]);

    // Edited by hand: refused, everything cleared, the extension told to delete it
    const edited = JSON.stringify(Object.assign(JSON.parse(good), { text: JSON.parse(good).text.replace('"muted":"1"', '"muted":"0"') }));
    expect(await openGame(edited, "credits"), "a shared save edited by hand shows the card that refuses it");
    const title = await gameFrame().textContent(".guinea-run .gr-modal-header h2");
    expect(/Nice try/.test(title || ""), `the refused save says why (${title})`);
    expect(await page.evaluate(() => window.cleared), "a refused save is deleted by the extension");
    const left = await gameFrame().evaluate(() => window.localStorage.getItem("guinea-run-muted"));
    expect(left === null, "a refused save clears what the game kept in this project");

    // Valid again: it is put back into this project's storage
    expect(await openGame(good, "map"), "a valid shared save opens the map");
    const muted = await gameFrame().evaluate(() => window.localStorage.getItem("guinea-run-muted"));
    expect(muted === "1", "a valid shared save comes back into this project's storage");
    await page.context().close();
  }
} finally {
  await browser.close();
  await site.close();
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}
console.log("\nGuinea Run opens, plays, ends and keeps its word to the labs.");
