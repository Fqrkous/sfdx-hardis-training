/**
 * node --test scripts/guinea-run/progress.test.mjs
 *
 * The save of Guinea Run when the game is open twice (two tabs, two VS Code
 * windows): each save keeps the best of what is stored and of what this game
 * did, so a world won in one is never erased by the other.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createProgress, mergeProgress } from "../../site-theme/javascripts/guinea-run/core/progress.js";

const KEY = "guinea-run-progress-v1";

/** A browser with one localStorage, shared by every game opened in it. */
function fakeBrowser() {
  const items = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => (items.has(key) ? items.get(key) : null),
      setItem: (key, value) => items.set(key, String(value)),
      removeItem: (key) => items.delete(key)
    },
    addEventListener: () => {}
  };
  return { stored: () => JSON.parse(items.get(KEY) || "null") };
}

test("two games won different worlds: both stay won", () => {
  const browser = fakeBrowser();
  const one = createProgress();
  const two = createProgress();
  one.complete(0, 1200, 3, 1, { w: 0, sc: 1200 });
  two.complete(1, 900, 2, 2, { w: 1, sc: 900 });
  const saved = browser.stored();
  assert.equal(saved.worlds[0].best, 1200);
  assert.equal(saved.worlds[1].best, 900);
  assert.equal(saved.unlocked, 2);
  // The game that did not win world 0 reads it after its own save
  assert.equal(two.world(0).best, 1200);
});

test("the same world won twice keeps the higher score and its result", () => {
  const browser = fakeBrowser();
  const one = createProgress();
  const two = createProgress();
  one.complete(2, 2000, 3, 3, { w: 2, sc: 2000 });
  two.complete(2, 1500, 3, 3, { w: 2, sc: 1500 });
  const saved = browser.stored();
  assert.equal(saved.worlds[2].best, 2000);
  assert.equal(saved.worlds[2].record.sc, 2000);
});

test("badges, notes and the pinball best are kept from both", () => {
  const browser = fakeBrowser();
  const one = createProgress();
  const two = createProgress();
  one.addBadge(1);
  one.addNote(3);
  one.completeBonus(50000, { pin: 1, sc: 50000 });
  two.addBadge(2);
  two.addNote(5);
  two.completeBonus(20000, { pin: 1, sc: 20000 });
  const saved = browser.stored();
  assert.deepEqual(saved.badges, [1, 2]);
  assert.deepEqual(Object.keys(saved.notes).sort(), ["3", "5"]);
  assert.equal(saved.bonus.best, 50000);
  assert.equal(saved.bonus.record.sc, 50000);
});

test("a mode chosen in one game is not undone by a save of the other", () => {
  const browser = fakeBrowser();
  const one = createProgress();
  const two = createProgress();
  one.setMode("hard");
  two.addNote(1);
  assert.equal(browser.stored().mode, "hard");
  two.setMode("normal");
  assert.equal(browser.stored().mode, "normal");
});

test("a reset is not merged back with what it forgets", () => {
  const browser = fakeBrowser();
  const one = createProgress();
  one.setMode("hard");
  one.complete(0, 1000, 3, 1, null);
  one.reset();
  const saved = browser.stored();
  assert.deepEqual(saved.worlds, {});
  assert.equal(saved.unlocked, 0);
  assert.equal(saved.mode, "hard");
});

test("a volatile game (a check) never writes", () => {
  const browser = fakeBrowser();
  const check = createProgress({ volatile: true, unlockAll: true });
  check.complete(0, 1000, 3, 1, null);
  assert.equal(browser.stored(), null);
});

test("mergeProgress: a signed result wins a tie", () => {
  const stored = { v: 1, unlocked: 1, worlds: { 0: { best: 800, stars: 2, record: { sc: 800, sg: "x" } } } };
  const mine = { v: 1, unlocked: 1, worlds: { 0: { best: 800, stars: 3, record: { sc: 800 } } } };
  const merged = mergeProgress(stored, mine, new Set());
  assert.equal(merged.worlds[0].record.sg, "x");
  assert.equal(merged.worlds[0].stars, 3);
});

test("mergeProgress: the same player keeps the higher score sent of each board", () => {
  const stored = { v: 1, online: { id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "Nico", coat: "golden", asked: true, sent: { w0: 500, w1: 900, pinball: 100 } } };
  const mine = { v: 1, online: { id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "Nico", coat: "golden", sent: { w0: 700, pinball: 50 } } };
  const merged = mergeProgress(stored, mine, new Set());
  assert.deepEqual(merged.online.sent, { w0: 700, w1: 900, pinball: 100 });
  assert.equal(merged.online.asked, true);
});

test("mergeProgress: a profile chosen in this game wins, a profile without an id takes the other's", () => {
  const stored = { v: 1, online: { id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "Old", coat: "snow", sent: { w0: 500 } } };
  const mine = { v: 1, online: { id: "0b4f3c1e-2222-4a2b-8c3d-000000000002", name: "New", coat: "slate", sent: {} } };
  const chosen = mergeProgress(stored, mine, new Set(["online"]));
  assert.equal(chosen.online.id, "0b4f3c1e-2222-4a2b-8c3d-000000000002");
  assert.equal(chosen.online.name, "New");
  assert.deepEqual(chosen.online.sent, {}, "another player: nothing of the first one's sends");
  const empty = mergeProgress(stored, { v: 1, online: { asked: true } }, new Set(["online"]));
  assert.equal(empty.online.id, "0b4f3c1e-1111-4a2b-8c3d-000000000001");
  assert.equal(empty.online.asked, true);
});

test("Remove me sticks: the next save does not take the removed id back from the stored copy", () => {
  const browser = fakeBrowser();
  const id = "0b4f3c1e-1111-4a2b-8c3d-000000000001";
  const progress = createProgress();
  progress.setOnline({ id, name: "Nico", coat: "golden", asked: true });
  progress.addOnlineSent("w0", 1500);
  progress.setOnline({ id: "", name: "", asked: true, left: id });
  assert.equal(progress.online.id, "", "the game forgets the id");
  assert.equal(browser.stored().online.id, "", "the save forgets it too");
  // Any later write merges with the stored copy again
  progress.complete(0, 300, 1, 1, { test: true });
  assert.equal(browser.stored().online.id, "");
  assert.deepEqual(browser.stored().online.sent, {}, "nothing is sent for the removed player");
});

test("mergeProgress: an older copy of the save never brings a removed player back", () => {
  const id = "0b4f3c1e-1111-4a2b-8c3d-000000000001";
  const removed = { v: 1, online: { asked: true, left: id } };
  const older = { v: 1, online: { id, name: "Nico", coat: "golden", asked: true, sent: { w0: 500 } } };
  // The removal is this game's choice, the stored copy is older
  assert.equal(mergeProgress(older, removed, new Set(["online"])).online.id, "");
  // The removal is stored, an older game writes its profile
  assert.equal(mergeProgress(removed, older, new Set(["online"])).online.id, "");
  assert.equal(mergeProgress(removed, older, new Set()).online.id, "");
  // Joining again with a new id works, and keeps the removed id away
  const again = { v: 1, online: { id: "0b4f3c1e-2222-4a2b-8c3d-000000000002", name: "Nico", coat: "golden", asked: true, left: id } };
  assert.equal(mergeProgress(older, again, new Set(["online"])).online.id, "0b4f3c1e-2222-4a2b-8c3d-000000000002");
});

test("the old GitHub handle and its sends are forgotten, a broken profile is repaired", () => {
  const browser = fakeBrowser();
  window.localStorage.setItem(KEY, JSON.stringify({ v: 1, unlocked: 1, worlds: {}, handle: "octocat", sent: { worlds: { 0: 5 } }, sentAt: 9, online: { id: "not-an-id", name: "  a   b  ", coat: "purple", sent: { w0: "x", w3: 40, nope: 9 } } }));
  const progress = createProgress();
  assert.deepEqual(progress.online, { id: "", name: "a b", coat: "agouti", asked: false, named: "", refused: "", left: "", sent: { w3: 40 } });
  progress.setOnline({ id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "Nico", coat: "golden", asked: true });
  const stored = browser.stored();
  assert.equal(stored.handle, undefined);
  assert.equal(stored.sent, undefined);
  assert.equal(stored.sentAt, undefined);
  assert.equal(stored.online.id, "0b4f3c1e-1111-4a2b-8c3d-000000000001");
  assert.deepEqual(stored.online.sent, {}, "a new id starts what was sent from zero");
});

test("a reset keeps the Hall of Fame profile", () => {
  fakeBrowser();
  const progress = createProgress();
  progress.setOnline({ id: "0b4f3c1e-1111-4a2b-8c3d-000000000001", name: "Nico", coat: "golden", asked: true });
  progress.addOnlineSent("w0", 1500);
  progress.reset();
  assert.equal(progress.online.name, "Nico");
  assert.equal(progress.online.sent.w0, 1500);
});

test("mergeProgress: the best Org-Man game is kept from both", () => {
  const stored = { v: 1, bonuses: { orgman: { best: 900, record: { org: 1, sc: 900, sg: "a" }, teaserSeen: true } } };
  const mine = { v: 1, bonuses: { orgman: { best: 500, record: { org: 1, sc: 500, sg: "b" }, teaserSeen: false } } };
  const merged = mergeProgress(stored, mine, new Set());
  assert.equal(merged.bonuses.orgman.best, 900);
  assert.equal(merged.bonuses.orgman.record.sg, "a", "the record of the best game");
  assert.equal(merged.bonuses.orgman.teaserSeen, true);
});
