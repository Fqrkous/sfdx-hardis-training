/*
 * A Hall of Fame database in memory, with the rules of the real one
 * (scripts/guinea-run/supabase.sql): the nickname rules, one send per player
 * and board every 10 seconds, only a new personal best, no score before a
 * nickname, the boards and the ranks. It cannot check a signature (the key
 * never leaves the game), only that there is one, nor the private limits.
 *
 * fakeFetch(db) answers the calls core/online.js makes, so the unit tests and
 * the test link (?guinea-online=fake) play the real code against it.
 */
import { COATS, nameProblem } from "./online.js";

/** A new empty database. now(): the clock in ms, for the tests. */
export function createFakeDb(now) {
  return { names: [], scores: [], banned: new Set(), now: now || (() => Date.now()) };
}

/** Adds rival players: [{ name, coat, board, score, stars?, bossMs?, mode?, level? }]. Each gets an id of its own. */
export function seedFakeDb(db, players) {
  let n = db.names.length;
  for (const p of players) {
    const id = "seed-" + ++n;
    db.names.push({ player_id: id, name: p.name, coat: p.coat || COATS[0], created_at: db.now() - 60000 });
    const boards = p.boards || [{ board: p.board, score: p.score, stars: p.stars, bossMs: p.bossMs, mode: p.mode, level: p.level }];
    for (const b of boards) {
      db.scores.push({ player_id: id, board: b.board, score: b.score, stars: b.stars ?? (b.board.startsWith("w") ? 1 : null), boss_ms: b.bossMs ?? null, mode: b.mode || (b.board.startsWith("w") ? "easy" : null), level: b.level ?? null, at: db.now() - 60000, created_at: db.now() - 60000 });
    }
  }
}

/** A fetch that answers as the database would. */
export function fakeFetch(db) {
  return async (url, init) => {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/rest\/v1\//, "");
    const method = (init && init.method) || "GET";
    const body = init && init.body ? JSON.parse(init.body) : null;
    try {
      if (method === "POST" && path === "guinea_names") {
        insertName(db, body);
        return reply(201, "");
      }
      if (method === "POST" && path === "guinea_scores") {
        insertScore(db, body);
        return reply(201, "");
      }
      if (method === "POST" && path === "rpc/guinea_ranks") {
        return reply(200, JSON.stringify(ranks(db, body.pid)));
      }
      if (method === "POST" && path === "rpc/guinea_forget") {
        const before = db.names.length + db.scores.length;
        db.names = db.names.filter((r) => r.player_id !== body.pid);
        db.scores = db.scores.filter((r) => r.player_id !== body.pid);
        return reply(200, String(before - db.names.length - db.scores.length));
      }
      if (method === "GET" && path === "guinea_board") {
        const board = (u.searchParams.get("board") || "").replace(/^eq\./, "");
        const limit = Number(u.searchParams.get("limit")) || 50;
        return reply(200, JSON.stringify(boardRows(db, board).slice(0, limit)));
      }
      if (method === "GET" && path === "guinea_totals") {
        const limit = Number(u.searchParams.get("limit")) || 50;
        return reply(200, JSON.stringify(totals(db).slice(0, limit).map(({ player_id, ...rest }) => rest)));
      }
      return reply(404, JSON.stringify({ message: "not found" }));
    } catch (error) {
      return reply(400, JSON.stringify({ code: "P0001", message: error.message }));
    }
  };
}

function insertName(db, row) {
  if (db.banned.has(row.player_id)) {
    throw new Error("banned");
  }
  const name = String(row.name || "").trim();
  if (nameProblem(name) || name !== row.name.replace(/\s+/g, " ").trim()) {
    throw new Error("bad name");
  }
  if (!COATS.includes(row.coat)) {
    throw new Error("bad coat");
  }
  if (db.names.some((r) => r.player_id === row.player_id && r.created_at > db.now() - 10000)) {
    throw new Error("too soon");
  }
  db.names.push({ player_id: row.player_id, name, coat: row.coat, created_at: db.now() });
}

function insertScore(db, row) {
  if (db.banned.has(row.player_id)) {
    throw new Error("banned");
  }
  if (!db.names.some((r) => r.player_id === row.player_id)) {
    throw new Error("no name");
  }
  if (db.scores.some((r) => r.player_id === row.player_id && r.board === row.board && r.created_at > db.now() - 10000)) {
    throw new Error("too soon");
  }
  if (typeof row.sig !== "string" || !row.sig) {
    throw new Error("bad sig");
  }
  if (!(row.score > 0)) {
    throw new Error("bad score");
  }
  if (db.scores.some((r) => r.player_id === row.player_id && r.board === row.board && r.score >= row.score)) {
    throw new Error("not better");
  }
  db.scores.push(Object.assign({}, row, { created_at: db.now() }));
}

function latestName(db, id) {
  let found = null;
  for (const r of db.names) {
    if (r.player_id === id && (!found || r.created_at >= found.created_at)) {
      found = r;
    }
  }
  return found;
}

function best(db, board) {
  const byPlayer = new Map();
  for (const r of db.scores) {
    if (r.board !== board || db.banned.has(r.player_id)) {
      continue;
    }
    const held = byPlayer.get(r.player_id);
    if (!held || compareRows(r, held) < 0) {
      byPlayer.set(r.player_id, r);
    }
  }
  return Array.from(byPlayer.values())
    .filter((r) => latestName(db, r.player_id))
    .sort(compareRows);
}

function compareRows(a, b) {
  return b.score - a.score || (b.stars || 0) - (a.stars || 0) || (a.boss_ms ?? Infinity) - (b.boss_ms ?? Infinity) || (b.level || 0) - (a.level || 0) || a.at - b.at;
}

function boardRows(db, board) {
  return best(db, board).map((r) => {
    const n = latestName(db, r.player_id);
    return {
      name: n.name,
      coat: n.coat,
      score: r.score,
      stars: r.stars ?? null,
      boss_ms: r.boss_ms ?? null,
      mode: r.mode ?? null,
      level: r.level ?? null,
      missions: r.missions ?? null,
      admins: r.admins ?? null,
      play_ms: r.play_ms ?? null,
      played_at: new Date(r.at).toISOString()
    };
  });
}

function totals(db) {
  const sums = new Map();
  for (let w = 0; w < 10; w++) {
    for (const r of best(db, "w" + w)) {
      const t = sums.get(r.player_id) || { player_id: r.player_id, total: 0, stars: 0, worlds: 0, since: r.created_at };
      t.total += r.score;
      t.stars += r.stars || 0;
      t.worlds += 1;
      t.since = Math.min(t.since, r.created_at);
      sums.set(r.player_id, t);
    }
  }
  return Array.from(sums.values())
    .sort((a, b) => b.total - a.total || b.stars - a.stars || a.since - b.since)
    .map((t) => {
      const n = latestName(db, t.player_id);
      return { player_id: t.player_id, name: n.name, coat: n.coat, total: t.total, stars: t.stars, worlds: t.worlds, since: new Date(t.since).toISOString() };
    });
}

function ranks(db, pid) {
  const out = [];
  const boards = new Set(db.scores.map((r) => r.board));
  for (const board of boards) {
    const list = best(db, board);
    const i = list.findIndex((r) => r.player_id === pid);
    if (i >= 0) {
      out.push({ board, rank: i + 1, players: list.length });
    }
  }
  const all = totals(db);
  const i = all.findIndex((t) => t.player_id === pid);
  if (i >= 0) {
    out.push({ board: "all", rank: i + 1, players: all.length });
  }
  return out;
}

function reply(status, text) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => JSON.parse(text)
  };
}
