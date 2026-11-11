/*
 * What a player has done, kept in their browser: which worlds are open, the
 * best score and stars of each (with the result the Hall of Fame receives),
 * the badges, Victor's notes found, the Hall of Fame profile (a random id, the
 * nickname, the guinea pig, what was sent already), the deployment actions plan declared
 * in world 3, which the runners read, and the best game of each bonus: Pipeline
 * Pinball (kept under "bonus", as before Org-Man existed) and Org-Man (under
 * "bonuses"). A pinball game in progress is saved apart, by core/checkpoint.js.
 *
 * Every access is wrapped: a browser that blocks storage still plays, it just
 * forgets between visits. With ?guinea-unlock=all every world is open and
 * nothing is written, so a check never changes a real player's progress.
 *
 * The game can be open twice (two tabs, two VS Code windows): each save reads
 * what is stored first and keeps the best of both (mergeProgress), so a world
 * won in one is never erased by the other, and a save written elsewhere is
 * merged in as soon as the browser says so. The first world won of a visit
 * asks the browser to keep the save when it cleans up storage.
 *
 * In VS Code each project has its own browser storage: core/host-save.js
 * shares the save between them through the extension (savedLocally).
 */
import { savedLocally } from "./save-signal.js";
import { BOARDS, COATS, NAME_MAX } from "./online.js";

const KEY = "guinea-run-progress-v1";
const PLAYER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function empty() {
  return { v: 1, unlocked: 0, worlds: {}, badges: [], notes: {}, plan: null, finished: false };
}

export function createProgress(options) {
  const volatile = Boolean(options && options.volatile);
  // Read even when volatile: a check can set a plan or a progress and play it,
  // without the game ever writing over it
  let state = readStored() || empty();
  // The choices this game made (mode, online profile, plan): they win over the stored ones
  const touched = new Set();
  let keepAsked = false;
  if (options && options.unlockAll) {
    state.unlocked = 99;
  }
  if (!volatile) {
    try {
      window.addEventListener("storage", (event) => {
        if (event.key === KEY && event.newValue) {
          const stored = parse(event.newValue);
          if (stored) {
            state = mergeProgress(stored, state, touched);
          }
        }
      });
    } catch {
      // No storage events: the next save merges anyway
    }
  }

  function store(id, bonus) {
    if (id === "pinball") {
      state.bonus = bonus;
    } else {
      state.bonuses = Object.assign({}, state.bonuses, { [id]: bonus });
    }
    save();
  }

  function save() {
    if (volatile) {
      return;
    }
    const stored = readStored();
    if (stored) {
      state = mergeProgress(stored, state, touched);
    }
    write(state);
  }

  /** The first world won of a visit: the browser is asked to keep the save when it cleans up (no prompt in most browsers). */
  function askToKeep() {
    if (keepAsked || volatile) {
      return;
    }
    keepAsked = true;
    try {
      const storage = navigator.storage;
      if (storage && storage.persist && storage.persisted) {
        storage
          .persisted()
          .then((kept) => kept || storage.persist())
          .catch(() => {});
      }
    } catch {
      // Not available: nothing changes
    }
  }

  return {
    get unlocked() {
      return state.unlocked;
    },
    get badges() {
      return state.badges.slice();
    },
    get plan() {
      return state.plan;
    },
    get finished() {
      return state.finished;
    },
    world(id) {
      return state.worlds[id] || { best: 0, stars: 0 };
    },
    hasNote(id) {
      return Boolean(state.notes[id]);
    },
    notesFound() {
      return Object.keys(state.notes).length;
    },
    /**
     * Records a finished world, opens the next one, and returns whether the
     * score is a new best. record: the result of this run for the Hall of
     * Fame, kept with a new best only (its signature comes later, setRecord).
     */
    complete(id, score, stars, next, record) {
      const previous = state.worlds[id] || { best: 0, stars: 0 };
      const newBest = score > previous.best;
      state.worlds[id] = { best: Math.max(previous.best, score), stars: Math.max(previous.stars, stars) };
      if (newBest && record) {
        state.worlds[id].record = record;
      } else if (previous.record) {
        state.worlds[id].record = previous.record;
      }
      if (next !== undefined) {
        state.unlocked = Math.max(state.unlocked, next);
      }
      save();
      askToKeep();
      return newBest;
    },
    /** The signed result of a world, once its signature is ready, if it is still the best. */
    setRecord(id, record) {
      const entry = state.worlds[id];
      if (entry && entry.best === record.sc) {
        entry.record = record;
        save();
      }
    },
    /** The mode the worlds are played in: easy, normal or hard. */
    get mode() {
      return state.mode || "easy";
    },
    setMode(mode) {
      state.mode = mode;
      touched.add("mode");
      save();
    },
    /**
     * The Hall of Fame profile: { id, name, coat, asked, named, refused, sent }.
     * id: the random player id, "" until the player joins. asked: the join
     * box was shown (it shows once). named: the "name|coat" the database
     * took last; refused: one it refused. sent: { board: score }, the best
     * already sent or refused of each board. left: the id of a player who
     * removed themself from the Hall of Fame, never taken back by a merge.
     */
    get online() {
      return onlineOf(state.online);
    },
    /** Changes some fields of the profile. A new id starts what was sent from zero. */
    setOnline(patch) {
      const current = onlineOf(state.online);
      const next = onlineOf(Object.assign({}, current, patch));
      if (patch.id !== undefined && patch.id !== current.id) {
        next.sent = {};
        next.named = "";
        next.refused = "";
      }
      state.online = next;
      touched.add("online");
      save();
    },
    /** A score of a board was sent (or refused): it is never sent again. */
    addOnlineSent(board, score) {
      const current = onlineOf(state.online);
      current.sent[board] = Math.max(current.sent[board] || 0, score);
      state.online = current;
      save();
    },
    addBadge(level) {
      if (!state.badges.includes(level)) {
        state.badges.push(level);
        state.badges.sort();
        save();
      }
    },
    addNote(id) {
      state.notes[id] = true;
      save();
    },
    setPlan(plan) {
      state.plan = plan;
      touched.add("plan");
      save();
    },
    setFinished() {
      state.finished = true;
      save();
    },
    /** Pipeline Pinball: its best score, the signed result of that game, whether its teaser was shown. */
    get bonus() {
      return this.bonusOf("pinball");
    },
    /** A bonus by its id: its best score, the signed result of that game, whether its teaser was shown. */
    bonusOf(id) {
      const stored = id === "pinball" ? state.bonus : (state.bonuses || {})[id];
      return Object.assign({ best: 0, record: null, teaserSeen: false }, stored || {});
    },
    /** Every world done: the bonus table is open. */
    bonusOpen(worlds) {
      return worlds.every((w) => (state.worlds[w.id] || { stars: 0 }).stars > 0);
    },
    /** Records a finished game of a bonus ("pinball" when not said), and returns whether it is a new best. record: as complete(). */
    completeBonus(score, record, id = "pinball") {
      const bonus = this.bonusOf(id);
      const newBest = score > bonus.best;
      if (newBest) {
        bonus.best = score;
        bonus.record = record || null;
      }
      store(id, bonus);
      askToKeep();
      return newBest;
    },
    setBonusRecord(record, id = "pinball") {
      const bonus = this.bonusOf(id);
      if (bonus.best === record.sc) {
        bonus.record = record;
        store(id, bonus);
      }
    },
    setTeaserSeen(id = "pinball") {
      store(id, Object.assign(this.bonusOf(id), { teaserSeen: true }));
    },
    reset() {
      // The Hall of Fame profile and the mode are who the player is, not what they did: they stay
      const { online, mode } = state;
      state = empty();
      if (online) {
        state.online = online;
      }
      if (mode) {
        state.mode = mode;
      }
      // Written as is: a reset is not merged with what it forgets
      if (!volatile) {
        write(state);
      }
    }
  };
}

/**
 * Two saves of the same player made one: the best of each world (with the
 * result of that best), every badge and note, the furthest world open, the
 * best game of each bonus. mode, the online profile and plan come from mine when this
 * game chose them (touched), from stored otherwise; the same player in both
 * keeps the higher score sent of each board.
 */
export function mergeProgress(stored, mine, touched) {
  const merged = Object.assign(empty(), stored, mine);
  // Before the Hall of Fame moved to its database: the GitHub handle and what was sent through issues
  delete merged.handle;
  delete merged.sent;
  delete merged.sentAt;
  merged.unlocked = Math.max(Number(stored.unlocked) || 0, Number(mine.unlocked) || 0);
  merged.worlds = {};
  for (const id of new Set(Object.keys(stored.worlds || {}).concat(Object.keys(mine.worlds || {})))) {
    merged.worlds[id] = mergeWorld((stored.worlds || {})[id], (mine.worlds || {})[id]);
  }
  merged.badges = Array.from(new Set((stored.badges || []).concat(mine.badges || []))).sort();
  merged.notes = Object.assign({}, stored.notes, mine.notes);
  merged.finished = Boolean(stored.finished || mine.finished);
  for (const key of ["mode", "plan"]) {
    const value = touched && touched.has(key) ? mine[key] : stored[key];
    if (value === undefined) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }
  if (stored.online || mine.online) {
    merged.online = mergeOnline(touched && touched.has("online") ? mine.online : stored.online, touched && touched.has("online") ? stored.online : mine.online);
  } else {
    delete merged.online;
  }
  if (stored.bonus || mine.bonus) {
    merged.bonus = mergeBonus(stored.bonus, mine.bonus);
  }
  // The other bonuses (Org-Man), one by one, the same way
  if (stored.bonuses || mine.bonuses) {
    merged.bonuses = {};
    for (const id of new Set(Object.keys(stored.bonuses || {}).concat(Object.keys(mine.bonuses || {})))) {
      merged.bonuses[id] = mergeBonus((stored.bonuses || {})[id], (mine.bonuses || {})[id]);
    }
  }
  return merged;
}

function readStored() {
  try {
    return parse(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function parse(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.v !== 1) {
      return null;
    }
    const state = Object.assign(empty(), parsed);
    // The GitHub handle and the issue sends of the old Hall of Fame are forgotten
    delete state.handle;
    delete state.sent;
    delete state.sentAt;
    if (state.online) {
      state.online = onlineOf(state.online);
    }
    return state;
  } catch {
    return null;
  }
}

function write(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage refused: the game goes on without remembering
    return;
  }
  savedLocally();
}

function mergeWorld(a, b) {
  if (!a || !b) {
    return a || b;
  }
  // The record that goes with the best score; on a tie, a signed one first, then mine
  const signed = (entry) => Boolean(entry.record && entry.record.sg);
  const winner = a.best > b.best || (a.best === b.best && signed(a) && !signed(b)) ? a : b;
  const world = { best: Math.max(a.best || 0, b.best || 0), stars: Math.max(a.stars || 0, b.stars || 0) };
  if (winner.record) {
    world.record = winner.record;
  }
  return world;
}

/**
 * The profile of the save that wins (chosen), completed by the other one: a
 * profile without an id takes the other's, unless it is the id the player
 * removed from the Hall of Fame; the same id keeps the higher score sent of
 * each board; once asked, never asked again.
 */
function mergeOnline(chosen, other) {
  const a = onlineOf(chosen);
  const b = onlineOf(other);
  // "Remove me" sticks: an older copy of the save never brings the removed id back
  if (a.id && a.id === b.left) {
    return Object.assign(b, { asked: a.asked || b.asked });
  }
  if (!a.id && b.id && b.id !== a.left) {
    return Object.assign(b, { asked: a.asked || b.asked, left: a.left || b.left });
  }
  a.left = a.left || b.left;
  if (a.id && a.id === b.id) {
    for (const [board, score] of Object.entries(b.sent)) {
      a.sent[board] = Math.max(a.sent[board] || 0, score);
    }
  }
  a.asked = a.asked || b.asked;
  return a;
}

/** A profile with every field in shape: anything missing or broken goes back to its default. */
function onlineOf(value) {
  const o = value && typeof value === "object" ? value : {};
  const name = typeof o.name === "string" ? o.name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";
  const sent = {};
  for (const board of BOARDS) {
    const score = o.sent && Number(o.sent[board]);
    if (Number.isFinite(score) && score > 0) {
      sent[board] = score;
    }
  }
  return {
    id: typeof o.id === "string" && PLAYER_ID.test(o.id) ? o.id.toLowerCase() : "",
    name,
    coat: COATS.includes(o.coat) ? o.coat : COATS[0],
    asked: o.asked === true,
    named: typeof o.named === "string" ? o.named : "",
    refused: typeof o.refused === "string" ? o.refused : "",
    left: typeof o.left === "string" && PLAYER_ID.test(o.left) ? o.left.toLowerCase() : "",
    sent
  };
}

function mergeBonus(a, b) {
  const one = Object.assign({ best: 0, record: null, teaserSeen: false }, a || {});
  const two = Object.assign({ best: 0, record: null, teaserSeen: false }, b || {});
  const winner = one.best > two.best || (one.best === two.best && one.record && one.record.sg && !(two.record && two.record.sg)) ? one : two;
  return Object.assign({}, one, two, { best: winner.best, record: winner.record, teaserSeen: one.teaserSeen || two.teaserSeen });
}
