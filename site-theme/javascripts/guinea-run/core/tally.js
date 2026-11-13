/*
 * The tally of a finished world, as the Hall of Fame receives it.
 *
 * recordText and submissionText are the exact strings both sides compute:
 * the game here, scripts/guinea-run/verify-submission.mjs on GitHub. Change
 * one and the other in the same commit, and bump the "r" or "s" prefix.
 */
import { WORLDS } from "./story.js";
import { SPARK_TINTS } from "./fx.js";
import { MOTIF } from "./themes.js";
import { SAMPLE_WEIGHTS } from "./quality.js";
import { SALTS } from "./random.js";

export const TALLY_SET = 1;

/** The text a world result stands for. bm is null for a world without a boss clock, m is the mode. */
export function recordText(r) {
  return ["r2", r.w, r.sc, r.st, r.bm === null || r.bm === undefined ? "" : r.bm, r.m, r.at, r.v, r.k].join("|");
}

/** The text a Pipeline Pinball game stands for: its score, its play time, its level, its missions and notes. */
export function pinballText(r) {
  return ["p1", r.sc, r.ms, r.lv, r.mi, r.nt, r.at, r.v, r.k].join("|");
}

/** The text an Org-Man game stands for: its score, its play time, the maze it reached, the admins caught. */
export function orgmanText(r) {
  return ["o1", r.sc, r.ms, r.lv, r.gh, r.at, r.v, r.k].join("|");
}

/** The text a submission stands for: the handle, the hour, and every result it carries. */
export function submissionText(s) {
  // Every result counts, so no number of the issue can be edited: a signed
  // result by its signature, an old unsigned best by its world, score and stars
  const parts = (s.r || []).filter(Boolean).map((r) => (r.legacy === true ? ["L", r.w, r.sc, r.st].join(":") : String(r.sg)));
  return ["s2", String(s.h).toLowerCase(), s.hr, s.k, parts.sort().join(",")].join("|");
}

/** HMAC-SHA256 of a text with raw key bytes, as base64url without padding. */
export async function hmac(keyBytes, text) {
  const key = await subtle().importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await subtle().sign("HMAC", key, new TextEncoder().encode(text))));
}

/** The signature of a world result, or "" when this browser cannot sign. */
export async function stamp(record) {
  return sign(recordText(record));
}

/** The signature of a submission, or "" when this browser cannot sign. */
export async function seal(submission) {
  return sign(submissionText(submission));
}

/** The signature of a Pipeline Pinball game, or "" when this browser cannot sign. */
export async function stampPinball(record) {
  return sign(pinballText(record));
}

/** The signature of an Org-Man game, or "" when this browser cannot sign. */
export async function stampOrgman(record) {
  return sign(orgmanText(record));
}

/** The signature of a saved Pipeline Pinball game, or "": the same key, its own prefix. */
export async function sealCheckpoint(text) {
  return sign("c1|" + text);
}

/** The signature of the save shared by every project in VS Code (core/host-save.js), or "": the same key, its own prefix. */
export async function sealSave(text) {
  return sign("g1|" + text);
}

let current = null;

async function sign(text) {
  try {
    if (!current) {
      const bytes = gather();
      current = await subtle().importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      bytes.fill(0);
    }
    return toBase64Url(new Uint8Array(await subtle().sign("HMAC", current, new TextEncoder().encode(text))));
  } catch {
    return "";
  }
}

function gather() {
  const glyphs = WORLDS.map((w) => w.glyph).join("");
  const a = [];
  for (const tint of SPARK_TINTS) {
    a.push((tint >> 16) & 255, (tint >> 8) & 255, tint & 255);
  }
  let n = 0n;
  for (const c of MOTIF) {
    n = n * 36n + BigInt(parseInt(c, 36));
  }
  const b = [];
  for (let i = 7; i >= 0; i--) {
    b.push(Number((n >> BigInt(i * 8)) & 255n));
  }
  const c = SAMPLE_WEIGHTS.slice().reverse();
  const d = [];
  for (const salt of SALTS) {
    d.push((salt >>> 24) & 255, (salt >>> 16) & 255, (salt >>> 8) & 255, salt & 255);
  }
  const rows = [a, c, b, d];
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = rows[i % 4][i >> 2] ^ ((glyphs.charCodeAt(i % glyphs.length) * 31 + i * 17 + 0x5b) & 255);
  }
  return out;
}

function subtle() {
  return globalThis.crypto.subtle;
}

function toBase64Url(bytes) {
  let s = "";
  for (const b of bytes) {
    s += String.fromCharCode(b);
  }
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
