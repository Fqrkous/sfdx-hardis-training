#!/usr/bin/env node
/**
 * The Guinea Run Hall of Fame database (Supabase), from the maintainer's machine.
 *
 *   node scripts/guinea-run/supabase.mjs apply            create or update the tables, checks and views (supabase.sql)
 *   node scripts/guinea-run/supabase.mjs settings         push the limits and the Org-Man ceilings
 *   node scripts/guinea-run/supabase.mjs keys             push the signing keys of the local list
 *   node scripts/guinea-run/supabase.mjs players <text>   the players whose nickname holds <text>, with their ids
 *   node scripts/guinea-run/supabase.mjs ban <id> [note]  hide a player from every board and refuse their sends
 *   node scripts/guinea-run/supabase.mjs unban <id>
 *   node scripts/guinea-run/supabase.mjs forget <id>      delete every row of a player (asked by them)
 *   node scripts/guinea-run/supabase.mjs smoke            check the live database as the game sees it, then clean up
 *
 * Reads, outside the repository, in ~/.config/sfdx-hardis-training/:
 *   supabase.json             { ref, token }: the access token (supabase-api.mjs)
 *   guinea-run-limits.json    caps, minBossMs, pinball and Org-Man limits: never written in the repository
 *   guinea-run-keys.json      { id: base64 key }: written by rotate-key.mjs
 * Never prints a key or a limit.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR, literal, pushKeys, runSql } from "./supabase-api.mjs";
import { maxScoreThrough } from "../../site-theme/javascripts/guinea-run/worlds/orgman/rules.js";
import { createNet } from "../../site-theme/javascripts/guinea-run/core/online.js";
import { ONLINE_URL, ONLINE_KEY } from "../../site-theme/javascripts/guinea-run/core/online-config.js";
import { TALLY_SET, stamp, stampPinball, stampOrgman } from "../../site-theme/javascripts/guinea-run/core/tally.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Org-Man levels the database accepts (supabase.sql: level between 1 and 1000)
const ORGMAN_LEVELS = 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const [command, ...rest] = process.argv.slice(2);
const commands = { apply, settings, keys, players, ban, unban, forget, smoke };
if (!commands[command]) {
  console.error(`Usage: node scripts/guinea-run/supabase.mjs <${Object.keys(commands).join("|")}> ...`);
  process.exit(1);
}
try {
  await commands[command](...rest);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

async function apply() {
  await runSql(fs.readFileSync(path.join(HERE, "supabase.sql"), "utf8"));
  console.log("supabase.sql applied.");
}

async function settings() {
  const file = path.join(CONFIG_DIR, "guinea-run-limits.json");
  let limits;
  try {
    limits = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error(`${file} could not be read: nothing pushed.`);
  }
  const value = Object.assign({}, limits, { orgmanMazes: Array.from({ length: ORGMAN_LEVELS }, (_, i) => maxScoreThrough(i + 1)) });
  await runSql(`update guinea_private.settings set value = ${literal(JSON.stringify(value))}::jsonb where id;`);
  console.log(`Limits pushed (${Object.keys(limits).length} entries) with the Org-Man ceilings of ${ORGMAN_LEVELS} mazes.`);
}

async function keys() {
  const file = path.join(CONFIG_DIR, "guinea-run-keys.json");
  const store = JSON.parse(fs.readFileSync(file, "utf8"));
  await pushKeys(store);
  console.log(`Keys ${Object.keys(store).join(", ")} pushed.`);
}

async function players(text) {
  if (!text) {
    throw new Error("players needs a part of a nickname.");
  }
  const rows = await runSql(
    `select n.player_id, n.name, n.coat, (select count(*) from public.guinea_scores s where s.player_id = n.player_id) as scores,
            exists (select 1 from guinea_private.banned b where b.player_id = n.player_id) as banned
     from guinea_private.names n where n.name ilike ${literal("%" + text.replace(/[%_\\]/g, "\\$&") + "%")} order by n.name limit 50;`
  );
  if (!rows.length) {
    console.log("No player has that in their nickname.");
    return;
  }
  for (const r of rows) {
    console.log(`${r.player_id}  ${r.name} (${r.coat})  ${r.scores} score(s)${r.banned ? "  BANNED" : ""}`);
  }
}

async function ban(id, ...note) {
  playerId(id);
  await runSql(`insert into guinea_private.banned (player_id, note) values (${literal(id)}, ${literal(note.join(" "))}) on conflict (player_id) do update set note = excluded.note;`);
  console.log(`Player ${id} banned: off every board, their sends refused.`);
}

async function unban(id) {
  playerId(id);
  await runSql(`delete from guinea_private.banned where player_id = ${literal(id)};`);
  console.log(`Player ${id} no longer banned.`);
}

async function forget(id) {
  playerId(id);
  const rows = await runSql(`select public.guinea_forget(${literal(id)}) as removed;`);
  console.log(`Player ${id}: ${rows[0] ? rows[0].removed : 0} row(s) deleted.`);
}

/** Plays the database as the game does, with the publishable key, and removes its rows at the end. */
async function smoke() {
  const net = createNet({ url: ONLINE_URL, key: ONLINE_KEY });
  if (!net.enabled) {
    throw new Error("online-config.js is empty.");
  }
  const failures = [];
  const expect = (ok, what) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
    if (!ok) {
      failures.push(what);
    }
  };
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const [me, other, third] = ids;
  const name = "smoke-" + me.slice(0, 6);
  const signed = async (fields) => {
    const r = Object.assign({ w: 0, sc: 100, st: 1, bm: null, m: "easy", at: Date.now() - 1000, v: "smoke", k: TALLY_SET }, fields);
    r.sg = await stamp(r);
    return { player_id: fields.player_id, board: "w" + r.w, score: r.sc, stars: r.st, boss_ms: r.bm, mode: r.m, at: r.at, version: r.v, key_id: r.k, sig: r.sg };
  };
  // The message of a refused score, "" when it is taken
  const reason = async (row) => {
    const response = await fetch(ONLINE_URL + "/rest/v1/guinea_scores", {
      method: "POST",
      headers: { apikey: ONLINE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row)
    });
    return response.ok ? "" : String((await response.json().catch(() => ({}))).message || response.status);
  };
  try {
    expect((await net.send("guinea_scores", await signed({ player_id: me }))) === "refused", "a score before any nickname is refused");
    expect((await net.send("guinea_names", { player_id: me, name, coat: "golden" })) === "sent", "a nickname is taken");
    expect((await net.send("guinea_names", { player_id: other, name: "me@example.com", coat: "golden" })) === "refused", "a nickname with an email is refused");
    expect((await net.send("guinea_names", { player_id: other, name: "www.example.com", coat: "golden" })) === "refused", "a nickname with a web address is refused");
    expect((await net.send("guinea_names", { player_id: other, name: "fine", coat: "purple" })) === "refused", "an unknown guinea pig is refused");
    expect((await net.send("guinea_names", { player_id: me, name: name + "x", coat: "golden" })) === "later", "a second nickname within 10 s waits (too soon)");
    expect((await net.send("guinea_scores", await signed({ player_id: me, w: 0, sc: 1500 }))) === "sent", "a signed score is taken");
    expect((await net.send("guinea_scores", await signed({ player_id: me, w: 0, sc: 1600 }))) === "later", "a second score of the same board within 10 s waits (too soon)");
    const forged = await signed({ player_id: me, w: 1, sc: 900 });
    forged.score = 9000;
    expect((await net.send("guinea_scores", forged)) === "refused", "a score changed after signing is refused");
    expect((await reason(await signed({ player_id: me, w: 2, sc: 999999999 }))) === "over limits", "a score over the cap is refused");
    expect((await reason(await signed({ player_id: me, w: 3, sc: 500, at: Date.now() + 5 * 3600000 }))) === "bad date", "a score from the future is refused");
    expect((await reason(await signed({ player_id: me, w: 4, sc: 700, st: 2, bm: 41000, m: "hard" }))) === "", "a hard mode score with a boss time is taken");
    const pin = { pin: 1, sc: 400000, ms: 90000, lv: 1, mi: 2, nt: 0, at: Date.now() - 1000, v: "smoke", k: TALLY_SET };
    pin.sg = await stampPinball(pin);
    expect((await reason({ player_id: me, board: "pinball", score: pin.sc, play_ms: pin.ms, level: pin.lv, missions: pin.mi, notes: pin.nt, at: pin.at, version: pin.v, key_id: pin.k, sig: pin.sg })) === "", "a signed Pipeline Pinball game is taken");
    const org = { org: 1, sc: 9000, ms: 60000, lv: 2, gh: 3, at: Date.now() - 1000, v: "smoke", k: TALLY_SET };
    org.sg = await stampOrgman(org);
    expect((await reason({ player_id: me, board: "orgman", score: org.sc, play_ms: org.ms, level: org.lv, admins: org.gh, at: org.at, version: org.v, key_id: org.k, sig: org.sg })) === "", "a signed Org-Man game is taken");

    const board = await net.readBoard("w0", 200);
    const row = board && board.find((r) => r.name === name);
    expect(Boolean(row && row.score === 1500 && row.coat === "golden"), "the board of world 0 shows the score, the nickname and the guinea pig");
    const raw = await fetch(ONLINE_URL + "/rest/v1/guinea_board?select=*&limit=1", { headers: { apikey: ONLINE_KEY } }).then((r) => r.json());
    expect(Array.isArray(raw) && raw.length > 0 && !("player_id" in raw[0]), "the board never shows a player id");
    const totals = await net.readBoard("all", 200);
    expect(Boolean(totals && totals.find((r) => r.name === name && r.total === 1500 + 700)), "the general board adds up the worlds");
    const ranks = await net.ranks(me);
    expect(Boolean(ranks && ranks.w0 && ranks.w0.rank >= 1 && ranks.all), "the player gets their own ranks");
    expect(JSON.stringify(await net.ranks(third)) === "{}", "an unknown id has no rank");

    for (const table of ["guinea_scores", "guinea_names"]) {
      const response = await fetch(ONLINE_URL + `/rest/v1/${table}?select=*&limit=1`, { headers: { apikey: ONLINE_KEY } });
      expect(response.status === 401 || response.status === 403, `${table} cannot be read (${response.status})`);
    }
    const hidden = await fetch(ONLINE_URL + "/rest/v1/keys?select=*", { headers: { apikey: ONLINE_KEY, "Accept-Profile": "guinea_private" } });
    expect(!hidden.ok, `the private schema is not served (${hidden.status})`);
    const settingsRead = await fetch(ONLINE_URL + "/rest/v1/rpc/limit_of", { method: "POST", headers: { apikey: ONLINE_KEY, "Content-Type": "application/json", "Content-Profile": "guinea_private" }, body: "{}" });
    expect(!settingsRead.ok, `the private functions cannot be called (${settingsRead.status})`);

    console.log("Waiting 11 s for the throttle...");
    await new Promise((resolve) => setTimeout(resolve, 11000));
    expect((await net.send("guinea_scores", await signed({ player_id: me, w: 0, sc: 1200 }))) === "refused", "a score below the player's best is refused (not better)");
    expect((await net.send("guinea_names", { player_id: me, name: name + "r", coat: "snow" })) === "sent", "a new nickname is taken");
    const renamed = await net.readBoard("w0", 200);
    expect(Boolean(renamed && renamed.find((r) => r.name === name + "r" && r.coat === "snow" && r.score === 1500)), "a new nickname shows on the past scores");
  } finally {
    for (const id of ids) {
      await net.forget(id);
    }
    const left = await net.readBoard("w0", 200);
    expect(Boolean(left) && !left.some((r) => r.name.startsWith(name)), "forget removes every row of the player");
  }
  if (failures.length) {
    throw new Error(`${failures.length} check(s) failed.`);
  }
  console.log("The live database behaves as the game expects.");
}

function playerId(id) {
  if (!UUID.test(String(id || ""))) {
    throw new Error("A player id looks like 0b4f3c1e-....: find it with players <text>.");
  }
}
