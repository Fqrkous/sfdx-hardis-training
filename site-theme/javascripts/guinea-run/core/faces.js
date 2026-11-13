/*
 * The admins who play the bosses: twenty-one cartoon portraits in images/bosses/
 * (boss-1.svg to boss-21.svg). final-boss.svg is the Sales Manager of world 9
 * and is never drawn here.
 *
 * A boss is a different admin at each play: the admins a world showed last
 * time are remembered in this browser and not drawn again, so playing a world
 * twice never shows the same face twice in a row. Without browser storage it
 * is a plain random draw.
 */
import { savedLocally } from "./save-signal.js";

export const ADMIN_FACES = 21;

const STORAGE_KEY = "guinea-run-last-admins";

/**
 * Picks `count` different admins (numbers from 1 to ADMIN_FACES) for a world,
 * none of those it showed last time, with the world's random so a seeded
 * check replays the same draw.
 */
export function pickAdmins(world, random, count = 1) {
  const last = readLast()[world] || [];
  let pool = [];
  for (let n = 1; n <= ADMIN_FACES; n++) {
    if (!last.includes(n)) {
      pool.push(n);
    }
  }
  if (pool.length < count) {
    pool = Array.from({ length: ADMIN_FACES }, (_, i) => i + 1);
  }
  const picked = [];
  for (let k = 0; k < count; k++) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  remember(world, picked);
  return picked;
}

/** The address of an admin's portrait. */
export function adminFaceUrl(n) {
  return new URL("../../../images/bosses/boss-" + n + ".svg", import.meta.url).href;
}

function readLast() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function remember(world, picked) {
  try {
    const saved = readLast();
    saved[world] = picked;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    savedLocally();
  } catch {
    // Only a nicety: without storage the next draw may repeat
  }
}
