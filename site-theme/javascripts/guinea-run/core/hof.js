/*
 * The Hall of Fame: who leads, world by world, overall and on each bonus.
 *
 * The boards live in a database (core/online.js, scripts/guinea-run/supabase.sql),
 * which ranks them. A player who joined sends every new best on their own; the
 * game reads a board when its card opens and never waits for it. The course
 * site's Hall of Fame page reads the same boards with the same code.
 */
export const WORLD_COUNT = 10;
// Written into every result, so a board entry says which game earned it
export const GAME_VERSION = "2026.10.22";
// The rows a board shows: the card of the game, the page of the site
export const GAME_ROWS = 10;
export const PAGE_ROWS = 50;
// A score that would enter this top of a bonus board flashes on its display
export const INVITE_TOP = 5;

/** The board id of a Hall of Fame tab: "all", a world number, "pinball" or "orgman". */
export function boardId(tab) {
  if (tab === "all" || tab === "pinball" || tab === "orgman") {
    return tab;
  }
  return "w" + Number(tab);
}

/** Reads one board. Never throws: { list, ok }, an empty list at worst. */
export async function loadList(net, tab, limit) {
  if (!net || !net.enabled) {
    return { list: [], ok: false };
  }
  const list = await net.readBoard(boardId(tab), limit || GAME_ROWS);
  return list ? { list, ok: true } : { list: [], ok: false };
}

/**
 * The score a bonus must pass to flash TOP 5, and beat what the player already
 * has there: 0 while the board has fewer than 5 other players (any score
 * enters it then). list: the board, best first; rank: the player's (0 when
 * not on it); best: their best on this device.
 */
export function bonusTarget(list, rank, best) {
  const others = rank > 0 ? list.filter((_, i) => i !== rank - 1) : list;
  if (others.length < INVITE_TOP) {
    return 0;
  }
  return Math.max(others[INVITE_TOP - 1].score, best || 0);
}

/** The signed results of this device: the best run of each world, of Pipeline Pinball and of Org-Man. */
export function collectResults(progress) {
  const results = [];
  for (let w = 0; w < WORLD_COUNT; w++) {
    const e = progress.world(w);
    if (e.best > 0 && e.record && e.record.sg && e.record.sc === e.best) {
      results.push(e.record);
    }
  }
  const bonus = progress.bonus;
  if (bonus && bonus.record && bonus.record.sg && bonus.record.pin === 1) {
    results.push(bonus.record);
  }
  const maze = progress.bonusOf ? progress.bonusOf("orgman") : null;
  if (maze && maze.record && maze.record.sg && maze.record.org === 1) {
    results.push(maze.record);
  }
  return results;
}
