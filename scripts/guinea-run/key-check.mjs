#!/usr/bin/env node
/**
 * Checks that the key the game rebuilds from its modules (core/tally.js) is the
 * key the Hall of Fame database holds under the same id (TALLY_SET): the game
 * signs a fixed probe, the database says whether the signature is right.
 *
 *   node scripts/guinea-run/key-check.mjs
 *
 * A mismatch means every score the published game sends is refused. It uses
 * the publishable key only, and the answer is a yes or a no: nothing about a
 * key is ever printed or sent but the probe's signature.
 */
import { TALLY_SET, stamp } from "../../site-theme/javascripts/guinea-run/core/tally.js";
import { ONLINE_URL, ONLINE_KEY } from "../../site-theme/javascripts/guinea-run/core/online-config.js";

// The same probe as guinea_key_ok in supabase.sql
const PROBE = { w: 0, sc: 1234, st: 2, bm: 45678, m: "easy", at: Date.UTC(2026, 0, 1), v: "key-check", k: TALLY_SET };

if (!ONLINE_URL || !ONLINE_KEY) {
  console.log("The Hall of Fame is off (online-config.js is empty): nothing to check.");
  process.exit(0);
}
const sig = await stamp(PROBE);
if (!sig) {
  console.error("The game could not sign the probe.");
  process.exit(1);
}
const response = await fetch(ONLINE_URL + "/rest/v1/rpc/guinea_key_ok", {
  method: "POST",
  headers: { apikey: ONLINE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ k: TALLY_SET, sig })
});
if (!response.ok) {
  console.error(`The Hall of Fame database answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  process.exit(1);
}
if ((await response.json()) !== true) {
  console.error(`The game's key pieces and the Hall of Fame database disagree on key ${TALLY_SET}: every score would be refused.`);
  process.exit(1);
}
console.log(`The game and the Hall of Fame database agree on key ${TALLY_SET}.`);
