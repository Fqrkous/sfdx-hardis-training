/*
 * The Hall of Fame online: the player's nickname and guinea pig, and every new
 * personal best, sent on their own to the database (scripts/guinea-run/supabase.sql).
 *
 * No account and no login. A player is a random id drawn on this device the
 * day they join; it never leaves this device but in the rows it sends, and
 * the boards never show it. Plain fetch, no SDK, the publishable key only.
 *
 * A send ends one of three ways:
 *   sent     the database took it
 *   later    no network, a timeout, the server busy, or too soon after the
 *            last one: tried again a few seconds later
 *   refused  the database said no (not a new best, a limit, a bad signature):
 *            never sent again
 */

export const BOARDS = ["w0", "w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "pinball", "orgman"];
// The guinea pigs a player can pick (guinea-run.css .gr-coat--<code>, and the database list)
export const COATS = ["agouti", "golden", "chocolate", "snow", "slate", "ginger"];
// How each coat tints the guinea pig picture (site-theme/images/guinea-pig-small.webp, an agouti):
// the game's rows and the site's Hall of Fame page use the same picture and the same tints
export const COAT_FILTERS = {
  agouti: "none",
  golden: "sepia(0.7) saturate(1.8) brightness(1.3)",
  chocolate: "sepia(0.4) brightness(0.62) saturate(1.3)",
  snow: "grayscale(1) brightness(1.75) contrast(0.8)",
  slate: "grayscale(1) brightness(0.85) contrast(1.15)",
  ginger: "sepia(0.6) saturate(3) hue-rotate(-15deg) brightness(1.05)"
};
export const NAME_MAX = 20;
// How long before a "later" is tried again, and how long a request may take
export const RETRY_MS = 12000;
const TIMEOUT_MS = 7000;
const ROW_FIELDS = "name,coat,score,stars,boss_ms,mode,level,missions,admins,play_ms,played_at";
const TOTAL_FIELDS = "name,coat,total,stars,worlds,since";
// The order of each kind of board, the same as the database ranks them
const ORDER = {
  world: "score.desc,stars.desc,boss_ms.asc.nullslast,played_at.asc",
  bonus: "score.desc,level.desc,played_at.asc",
  all: "total.desc,stars.desc,since.asc"
};

/** A nickname as it is sent: trimmed, inner spaces collapsed. */
export function cleanName(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Why a nickname cannot be used, or "" when it can. The database checks the same. */
export function nameProblem(name) {
  const clean = cleanName(name);
  // eslint-disable-next-line no-control-regex
  if (clean.length < 1 || clean.length > NAME_MAX || /[\u0000-\u001f\u007f]/.test(clean) || clean.includes("@") || /:\/\/|www\./i.test(clean)) {
    return "hofNameBad";
  }
  return "";
}

/** The board of a signed result: "w3", "pinball" or "orgman". */
export function boardOf(result) {
  if (result.pin === 1) {
    return "pinball";
  }
  if (result.org === 1) {
    return "orgman";
  }
  return "w" + result.w;
}

/** The row a signed result becomes, for this player. */
export function rowOf(result, playerId) {
  const row = { player_id: playerId, board: boardOf(result), score: result.sc, at: result.at, version: result.v, key_id: result.k, sig: result.sg };
  if (result.pin === 1) {
    return Object.assign(row, { play_ms: result.ms, level: result.lv, missions: result.mi, notes: result.nt });
  }
  if (result.org === 1) {
    return Object.assign(row, { play_ms: result.ms, level: result.lv, admins: result.gh });
  }
  return Object.assign(row, { stars: result.st, boss_ms: result.bm === undefined ? null : result.bm, mode: result.m });
}

/** Whether a row is worth sending: the public rules of the database. The private limits are its own business. */
export function plausible(row) {
  const whole = (n) => Number.isInteger(n) && n >= 0;
  if (!row || !BOARDS.includes(row.board) || !whole(row.score) || row.score <= 0 || !whole(row.at) || row.at <= 0) {
    return false;
  }
  if (typeof row.sig !== "string" || !row.sig || !Number.isInteger(row.key_id) || typeof row.version !== "string") {
    return false;
  }
  if (row.board === "pinball" || row.board === "orgman") {
    return whole(row.play_ms) && whole(row.level) && row.level >= 1;
  }
  return Number.isInteger(row.stars) && row.stars >= 1 && row.stars <= 3 && ["easy", "normal", "hard"].includes(row.mode);
}

/**
 * The calls to the database. config: { url, key, fetch? }. An empty url or key
 * gives a network that is off: nothing is sent, the boards read empty.
 */
export function createNet(config) {
  const url = String((config && config.url) || "").replace(/\/+$/, "");
  const key = String((config && config.key) || "");
  const doFetch = (config && config.fetch) || ((...args) => globalThis.fetch(...args));
  const enabled = Boolean(url && key);
  const headers = (extra) => {
    const out = Object.assign({ apikey: key }, extra);
    // Only a legacy JWT key goes as a Bearer: a publishable key must not
    if (key.startsWith("eyJ")) {
      out.Authorization = "Bearer " + key;
    }
    return out;
  };

  async function call(path, init) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
    try {
      return await doFetch(url + path, Object.assign({ cache: "no-store", signal: controller ? controller.signal : undefined }, init));
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  async function post(path, body, prefer) {
    if (!enabled) {
      return { outcome: "later" };
    }
    try {
      const response = await call(path, {
        method: "POST",
        headers: headers(Object.assign({ "Content-Type": "application/json" }, prefer ? { Prefer: prefer } : {})),
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const text = await response.text();
        return { outcome: "sent", value: text ? JSON.parse(text) : null };
      }
      const message = await messageOf(response);
      if (response.status === 408 || response.status === 429 || response.status >= 500 || /too soon/i.test(message)) {
        return { outcome: "later", message };
      }
      return { outcome: "refused", message };
    } catch {
      return { outcome: "later" };
    }
  }

  async function get(path) {
    if (!enabled) {
      return null;
    }
    try {
      const response = await call(path, { headers: headers({ Accept: "application/json" }) });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }

  return {
    enabled,
    /** Sends a row: "sent", "later" or "refused". table: "guinea_names" or "guinea_scores". */
    async send(table, row) {
      return (await post("/rest/v1/" + table, row, "return=minimal")).outcome;
    },
    /** The board of a world ("w3"), a bonus ("pinball", "orgman") or "all": the list, best first, or null when it cannot be read. */
    async readBoard(board, limit) {
      const n = Math.max(1, Math.min(200, limit || 50));
      if (board === "all") {
        const rows = await get("/rest/v1/guinea_totals?select=" + TOTAL_FIELDS + "&order=" + ORDER.all + "&limit=" + n);
        return rows ? rows.map(totalEntry) : null;
      }
      const order = board === "pinball" || board === "orgman" ? ORDER.bonus : ORDER.world;
      const rows = await get("/rest/v1/guinea_board?select=" + ROW_FIELDS + "&board=eq." + encodeURIComponent(board) + "&order=" + order + "&limit=" + n);
      return rows ? rows.map(boardEntry) : null;
    },
    /** This player's rank on each board they are on: { board: { rank, players } }, or null when it cannot be read. */
    async ranks(playerId) {
      if (!playerId) {
        return {};
      }
      const answer = await post("/rest/v1/rpc/guinea_ranks", { pid: playerId });
      if (answer.outcome !== "sent" || !Array.isArray(answer.value)) {
        return null;
      }
      const out = {};
      for (const r of answer.value) {
        out[r.board] = { rank: r.rank, players: r.players };
      }
      return out;
    },
    /** Removes every row of this player from the database. true when done. */
    async forget(playerId) {
      return (await post("/rest/v1/rpc/guinea_forget", { pid: playerId })).outcome === "sent";
    }
  };
}

/**
 * Keeps the database up to date with this device: the nickname when it
 * changed, then every signed best above what was already sent.
 *
 * progress: the progress store (its online profile). results(): the signed
 * results of this device (core/hof.js collectResults). onStatus(summary):
 * called after a run with { sent: [boards], later, nameRefused }. timers: a
 * stand-in for setTimeout in the tests. Only one run at a time: a call while one
 * runs gets the same promise. A "later" tries again RETRY_MS later.
 */
export function createSync({ progress, net, results, onStatus, timers }) {
  const clock = timers || { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) };
  let running = null;
  let again = false;
  let retry = null;
  let waiting = false;

  async function once() {
    const profile = progress.online;
    if (!net.enabled || !profile.id || !profile.name) {
      return { sent: [], later: false };
    }
    const named = profile.name + "|" + profile.coat;
    if (profile.refused === named) {
      // The database refused this nickname: nothing more until it changes
      return { sent: [], later: false, nameRefused: true };
    }
    if (profile.named !== named) {
      const outcome = await net.send("guinea_names", { player_id: profile.id, name: profile.name, coat: profile.coat });
      if (outcome === "later") {
        return { sent: [], later: true };
      }
      if (outcome === "refused") {
        progress.setOnline({ refused: named });
        return { sent: [], later: false, nameRefused: true };
      }
      progress.setOnline({ named, refused: "" });
    }
    const sent = [];
    for (const result of results()) {
      const row = rowOf(result, profile.id);
      if (row.score <= (progress.online.sent[row.board] || 0) || !plausible(row)) {
        continue;
      }
      const outcome = await net.send("guinea_scores", row);
      if (outcome === "later") {
        return { sent, later: true };
      }
      // Sent or refused: never sent again
      progress.addOnlineSent(row.board, row.score);
      if (outcome === "sent") {
        sent.push(row.board);
      }
    }
    return { sent, later: false };
  }

  async function loop() {
    let summary = { sent: [], later: false };
    do {
      again = false;
      const one = await once();
      summary = { sent: summary.sent.concat(one.sent), later: one.later, nameRefused: Boolean(one.nameRefused) };
    } while (again && !summary.later);
    waiting = summary.later;
    if (summary.later && !retry) {
      retry = clock.set(() => {
        retry = null;
        run();
      }, RETRY_MS);
    }
    if (onStatus) {
      onStatus(summary);
    }
    return summary;
  }

  /** Runs a sync now, or once more right after the one that runs. Never throws. */
  function run() {
    if (running) {
      again = true;
      return running;
    }
    running = loop()
      .catch(() => ({ sent: [], later: true }))
      .finally(() => {
        running = null;
      });
    return running;
  }

  return {
    run,
    /** Whether something waits for the network. */
    get waiting() {
      return waiting;
    },
    stop() {
      if (retry) {
        clock.clear(retry);
        retry = null;
      }
    }
  };
}

function boardEntry(r) {
  return {
    name: String(r.name || ""),
    coat: COATS.includes(r.coat) ? r.coat : COATS[0],
    score: Number(r.score) || 0,
    stars: r.stars === null || r.stars === undefined ? 0 : Number(r.stars),
    bossMs: typeof r.boss_ms === "number" ? r.boss_ms : null,
    mode: r.mode || "easy",
    level: Number(r.level) || 1,
    missions: Number(r.missions) || 0,
    admins: Number(r.admins) || 0,
    ms: Number(r.play_ms) || 0,
    at: String(r.played_at || "")
  };
}

function totalEntry(r) {
  return {
    name: String(r.name || ""),
    coat: COATS.includes(r.coat) ? r.coat : COATS[0],
    total: Number(r.total) || 0,
    stars: Number(r.stars) || 0,
    worlds: Number(r.worlds) || 0,
    at: String(r.since || "")
  };
}

async function messageOf(response) {
  try {
    const text = await response.text();
    try {
      const body = JSON.parse(text);
      return String(body.message || body.hint || text);
    } catch {
      return text;
    }
  } catch {
    return "";
  }
}
