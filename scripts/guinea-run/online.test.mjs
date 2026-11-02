/**
 * node --test scripts/guinea-run/online.test.mjs
 *
 * The Hall of Fame online (core/online.js): the nickname rules, what a result
 * becomes, the three ends of a send, the sync that sends every new best once,
 * and the database in memory that copies the rules of the real one
 * (core/online-fake.js, scripts/guinea-run/supabase.sql). The real database
 * is checked by `node scripts/guinea-run/supabase.mjs smoke`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { cleanName, nameProblem, rowOf, boardOf, plausible, createNet, createSync, COATS, COAT_FILTERS, RETRY_MS } from "../../site-theme/javascripts/guinea-run/core/online.js";
import { createFakeDb, fakeFetch, seedFakeDb } from "../../site-theme/javascripts/guinea-run/core/online-fake.js";
import { bonusTarget, collectResults, boardId, loadList } from "../../site-theme/javascripts/guinea-run/core/hof.js";

const ID = "0b4f3c1e-1111-4a2b-8c3d-000000000001";
const OTHER = "0b4f3c1e-2222-4a2b-8c3d-000000000002";

/** A world result as the game keeps it once signed. */
const world = (w, sc, extra = {}) => Object.assign({ w, sc, st: 2, bm: 30000, m: "easy", at: 1767225600000 + w, v: "test", k: 1, sg: "sig-" + w + "-" + sc }, extra);

/** A progress store with just what the sync reads and writes. */
function fakeProgress(profile) {
  let online = Object.assign({ id: ID, name: "Nico", coat: "golden", asked: true, named: "", refused: "", sent: {} }, profile);
  return {
    get online() {
      return JSON.parse(JSON.stringify(online));
    },
    setOnline(patch) {
      online = Object.assign({}, online, patch);
    },
    addOnlineSent(board, score) {
      online.sent = Object.assign({}, online.sent, { [board]: Math.max(online.sent[board] || 0, score) });
    }
  };
}

/** A clock the tests move by hand, and timers that run only when asked. */
function fakeClock(start = 1_000_000) {
  let now = start;
  const pending = [];
  return {
    now: () => now,
    advance: (ms) => (now += ms),
    timers: { set: (fn, ms) => pending.push({ fn, ms }) && pending.length, clear: () => {} },
    pending,
    runTimers: () => pending.splice(0).forEach((t) => t.fn())
  };
}

function fakeNet(db) {
  return createNet({ url: "https://fake.invalid", key: "fake", fetch: fakeFetch(db) });
}

test("a nickname is trimmed, and refused when it looks like an email or a web address", () => {
  assert.equal(cleanName("  Nico   the  pig "), "Nico the pig");
  assert.equal(nameProblem("Nico"), "");
  for (const bad of ["", "   ", "x".repeat(21), "me@example.com", "https://a.b", "www.example.com", "a\u0007b"]) {
    assert.equal(nameProblem(bad), "hofNameBad", JSON.stringify(bad));
  }
  assert.equal(nameProblem("x".repeat(20)), "");
});

test("every coat has its tint", () => {
  for (const coat of COATS) {
    assert.equal(typeof COAT_FILTERS[coat], "string", coat);
  }
});

test("a result becomes the row of its board, with the fields its signature covers", () => {
  assert.deepEqual(rowOf(world(3, 1500, { bm: null, m: "hard" }), ID), {
    player_id: ID,
    board: "w3",
    score: 1500,
    at: 1767225600003,
    version: "test",
    key_id: 1,
    sig: "sig-3-1500",
    stars: 2,
    boss_ms: null,
    mode: "hard"
  });
  const pin = rowOf({ pin: 1, sc: 400000, ms: 90000, lv: 2, mi: 3, nt: 1, at: 5, v: "t", k: 1, sg: "p" }, ID);
  assert.equal(pin.board, "pinball");
  assert.deepEqual([pin.play_ms, pin.level, pin.missions, pin.notes], [90000, 2, 3, 1]);
  const org = rowOf({ org: 1, sc: 9000, ms: 60000, lv: 2, gh: 4, at: 5, v: "t", k: 1, sg: "o" }, ID);
  assert.equal(boardOf({ org: 1 }), "orgman");
  assert.deepEqual([org.board, org.admins, org.level], ["orgman", 4, 2]);
  assert.equal(plausible(rowOf(world(0, 100), ID)), true);
  assert.equal(plausible(rowOf(world(0, 0), ID)), false, "no score");
  assert.equal(plausible(rowOf(world(0, 100, { sg: "" }), ID)), false, "not signed");
  assert.equal(plausible(rowOf(world(0, 100, { m: "turbo" }), ID)), false, "no such mode");
  assert.equal(plausible(Object.assign(rowOf(world(0, 100), ID), { board: "w12" })), false, "no such board");
});

test("a send ends sent, later or refused", async () => {
  const answer = (status, body) => async () => ({ ok: status < 300, status, text: async () => body || "", json: async () => JSON.parse(body) });
  const net = (fetch) => createNet({ url: "https://x.invalid/", key: "sb_publishable_x", fetch });
  assert.equal(await net(answer(201)).send("guinea_scores", {}), "sent");
  assert.equal(await net(answer(503, "{}")).send("guinea_scores", {}), "later");
  assert.equal(await net(answer(429, "{}")).send("guinea_scores", {}), "later");
  assert.equal(await net(answer(400, '{"message":"too soon"}')).send("guinea_scores", {}), "later");
  assert.equal(await net(answer(400, '{"message":"not better"}')).send("guinea_scores", {}), "refused");
  assert.equal(await net(answer(401, '{"message":"no"}')).send("guinea_scores", {}), "refused");
  assert.equal(
    await net(async () => {
      throw new TypeError("Failed to fetch");
    }).send("guinea_scores", {}),
    "later",
    "no network"
  );
  assert.equal(await createNet({}).send("guinea_scores", {}), "later", "a network that is off sends nothing");
  assert.equal(createNet({}).enabled, false);
});

test("a publishable key is never sent as a Bearer, a legacy JWT key is", async () => {
  const seen = [];
  const fetch = async (url, init) => {
    seen.push(init.headers);
    return { ok: true, status: 200, text: async () => "[]", json: async () => [] };
  };
  await createNet({ url: "https://x.invalid", key: "sb_publishable_abc", fetch }).readBoard("w0");
  await createNet({ url: "https://x.invalid", key: "eyJhbGciOi", fetch }).readBoard("w0");
  assert.equal(seen[0].apikey, "sb_publishable_abc");
  assert.equal(seen[0].Authorization, undefined);
  assert.equal(seen[1].Authorization, "Bearer eyJhbGciOi");
});

test("the sync sends the nickname first, then every best not sent yet, each once", async () => {
  const clock = fakeClock();
  const db = createFakeDb(clock.now);
  const progress = fakeProgress();
  const results = [world(0, 1500), world(1, 800)];
  const sync = createSync({ progress, net: fakeNet(db), results: () => results, timers: clock.timers });
  const first = await sync.run();
  assert.deepEqual(first.sent, ["w0", "w1"]);
  assert.equal(progress.online.named, "Nico|golden");
  assert.deepEqual(progress.online.sent, { w0: 1500, w1: 800 });
  assert.equal(db.names.length, 1);
  assert.equal(db.scores.length, 2);
  clock.advance(20000);
  const again = await sync.run();
  assert.deepEqual(again.sent, [], "nothing new: nothing sent");
  assert.equal(db.names.length, 1, "the same nickname is not sent again");
  results[0] = world(0, 2000);
  assert.deepEqual((await sync.run()).sent, ["w0"], "a new best of world 0 goes");
});

test("a refused best is never sent again, a later one is tried again", async () => {
  const clock = fakeClock();
  const db = createFakeDb(clock.now);
  seedFakeDb(db, []);
  const progress = fakeProgress();
  let online = false;
  const fetch = fakeFetch(db);
  const net = createNet({
    url: "https://fake.invalid",
    key: "fake",
    fetch: async (...args) => {
      if (!online) {
        throw new TypeError("offline");
      }
      return fetch(...args);
    }
  });
  const sync = createSync({ progress, net, results: () => [world(0, 1500)], timers: clock.timers });
  const offline = await sync.run();
  assert.equal(offline.later, true);
  assert.equal(sync.waiting, true);
  assert.equal(clock.pending.length, 1);
  assert.equal(clock.pending[0].ms, RETRY_MS);
  online = true;
  clock.runTimers();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(db.scores.length, 1, "sent once the network is back");
  assert.equal(sync.waiting, false);
  // The database refuses this one (not better than what it holds): marked sent, never tried again
  const lower = createSync({ progress: fakeProgress({ named: "Nico|golden" }), net: fakeNet(db), results: () => [world(0, 1200)], timers: clock.timers });
  clock.advance(20000);
  const refused = await lower.run();
  assert.deepEqual(refused.sent, []);
  assert.equal(refused.later, false);
});

test("a refused nickname stops the sends until it changes", async () => {
  const db = createFakeDb();
  const progress = fakeProgress({ name: "me@example.com" });
  const sync = createSync({ progress, net: fakeNet(db), results: () => [world(0, 1500)], timers: fakeClock().timers });
  const summary = await sync.run();
  assert.equal(summary.nameRefused, true);
  assert.equal(db.scores.length, 0);
  assert.equal((await sync.run()).nameRefused, true, "the same nickname is not tried again");
  progress.setOnline({ name: "Nico" });
  assert.deepEqual((await sync.run()).sent, ["w0"]);
});

test("one sync at a time: a call while one runs gets the same promise, then one more run", async () => {
  const db = createFakeDb();
  const progress = fakeProgress();
  let calls = 0;
  const sync = createSync({
    progress,
    net: fakeNet(db),
    results: () => {
      calls++;
      return [world(0, 1500)];
    },
    timers: fakeClock().timers
  });
  const one = sync.run();
  const two = sync.run();
  assert.equal(one, two);
  await one;
  assert.equal(calls, 2, "the second call asked for one more run");
  assert.equal(db.scores.length, 1);
});

test("a profile without an id or a nickname sends nothing", async () => {
  const db = createFakeDb();
  for (const profile of [{ id: "" }, { name: "" }]) {
    const summary = await createSync({ progress: fakeProgress(profile), net: fakeNet(db), results: () => [world(0, 1500)], timers: fakeClock().timers }).run();
    assert.deepEqual(summary.sent, []);
  }
  assert.equal(db.names.length + db.scores.length, 0);
});

test("the database in memory: throttle, no score before a name, only a new best", async () => {
  const clock = fakeClock();
  const db = createFakeDb(clock.now);
  const net = fakeNet(db);
  assert.equal(await net.send("guinea_scores", rowOf(world(0, 100), ID)), "refused", "no name yet");
  assert.equal(await net.send("guinea_names", { player_id: ID, name: "Nico", coat: "golden" }), "sent");
  assert.equal(await net.send("guinea_names", { player_id: ID, name: "Nico2", coat: "golden" }), "later", "too soon");
  assert.equal(await net.send("guinea_names", { player_id: OTHER, name: "x@y.z", coat: "golden" }), "refused");
  assert.equal(await net.send("guinea_names", { player_id: OTHER, name: "Ok", coat: "purple" }), "refused");
  assert.equal(await net.send("guinea_scores", rowOf(world(0, 1500), ID)), "sent");
  assert.equal(await net.send("guinea_scores", rowOf(world(0, 1600), ID)), "later", "too soon on the same board");
  assert.equal(await net.send("guinea_scores", rowOf(world(1, 700), ID)), "sent", "another board is not throttled");
  clock.advance(11000);
  assert.equal(await net.send("guinea_scores", rowOf(world(0, 1500), ID)), "refused", "not better");
  assert.equal(await net.send("guinea_scores", rowOf(world(0, 1600), ID)), "sent");
});

test("the boards: best first, the newest nickname on every score, my ranks, forget", async () => {
  const clock = fakeClock();
  const db = createFakeDb(clock.now);
  seedFakeDb(db, [
    { name: "Octo", coat: "snow", boards: [{ board: "w0", score: 3000, stars: 3, bossMs: 40000 }, { board: "w1", score: 100 }] },
    { name: "Jane", coat: "slate", boards: [{ board: "w0", score: 3000, stars: 3, bossMs: 30000 }] },
    { name: "Pin", board: "pinball", score: 500, level: 2 }
  ]);
  const net = fakeNet(db);
  await net.send("guinea_names", { player_id: ID, name: "Nico", coat: "golden" });
  await net.send("guinea_scores", rowOf(world(0, 1500), ID));
  const w0 = await net.readBoard("w0");
  assert.deepEqual(
    w0.map((r) => r.name),
    ["Jane", "Octo", "Nico"],
    "a tie goes to the fastest boss"
  );
  assert.equal(w0[2].coat, "golden");
  assert.equal(w0[0].bossMs, 30000);
  const all = await net.readBoard("all");
  assert.deepEqual(
    all.map((r) => [r.name, r.total]),
    [
      ["Octo", 3100],
      ["Jane", 3000],
      ["Nico", 1500]
    ]
  );
  assert.equal((await net.readBoard("pinball"))[0].level, 2);
  clock.advance(11000);
  await net.send("guinea_names", { player_id: ID, name: "Nicolas", coat: "ginger" });
  assert.equal((await net.readBoard("w0"))[2].name, "Nicolas", "a new nickname shows on the past scores");
  assert.deepEqual(await net.ranks(ID), { w0: { rank: 3, players: 3 }, all: { rank: 3, players: 3 } });
  assert.deepEqual(await net.ranks(OTHER), {});
  assert.equal(await net.forget(ID), true);
  assert.equal((await net.readBoard("w0")).length, 2);
  assert.deepEqual(await net.ranks(ID), {});
});

test("a banned player is off every board and their sends are refused", async () => {
  const db = createFakeDb();
  const net = fakeNet(db);
  await net.send("guinea_names", { player_id: ID, name: "Nico", coat: "golden" });
  await net.send("guinea_scores", rowOf(world(0, 1500), ID));
  db.banned.add(ID);
  assert.deepEqual(await net.readBoard("w0"), []);
  assert.equal(await net.send("guinea_scores", rowOf(world(1, 1500), ID)), "refused");
});

test("hof.js: board ids, the TOP 5 target of a bonus, the signed results of a device", async () => {
  assert.equal(boardId("all"), "all");
  assert.equal(boardId(3), "w3");
  assert.equal(boardId("pinball"), "pinball");
  const list = [9, 7, 5, 3, 2, 1].map((score) => ({ score }));
  assert.equal(bonusTarget(list.slice(0, 4), 0, 0), 0, "fewer than five others: no flash");
  assert.equal(bonusTarget(list, 0, 0), 2, "the fifth of the others");
  assert.equal(bonusTarget(list, 2, 7), 7, "my own row is not a rival, and my best must be beaten too");
  assert.equal(bonusTarget(list, 0, 4), 4);
  const progress = {
    world: (w) => (w === 0 ? { best: 1500, record: world(0, 1500) } : w === 1 ? { best: 800, record: { w: 1, sc: 800 } } : w === 2 ? { best: 900, record: world(2, 700) } : { best: 0 }),
    bonus: { record: { pin: 1, sc: 5, sg: "p" } },
    bonusOf: () => ({ record: { org: 1, sc: 6, sg: "o" } })
  };
  assert.deepEqual(
    collectResults(progress).map((r) => r.sc),
    [1500, 5, 6],
    "only signed results that are still the best"
  );
  assert.deepEqual(await loadList(createNet({}), 0), { list: [], ok: false }, "off: an empty board, never an error");
});
