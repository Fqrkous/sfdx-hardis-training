/**
 * Runs SQL on the Guinea Run Hall of Fame database through the Supabase
 * Management API. Used by supabase.mjs and by the key rotation script.
 *
 * The access token lives outside the repository, in
 * ~/.config/sfdx-hardis-training/supabase.json: { "ref": "<project ref>", "token": "sbp_..." }.
 * Create it in the Supabase dashboard (Account, Access Tokens), scoped to the
 * project with Database read-write. It is never printed.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const CONFIG_DIR = path.join(os.homedir(), ".config", "sfdx-hardis-training");
const ACCESS_FILE = path.join(CONFIG_DIR, "supabase.json");

/** Runs one SQL text (several statements allowed) and returns the rows of the last one. */
export async function runSql(query) {
  const { ref, token } = readAccess();
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  const text = await response.text();
  if (!response.ok) {
    // The message of the database, never the query: it may hold a key
    let message = text;
    try {
      message = JSON.parse(text).message || text;
    } catch {
      // Not JSON: the raw answer
    }
    throw new Error(`Supabase answered ${response.status}: ${String(message).slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : [];
}

/**
 * Makes the database hold exactly these signing keys: { id: base64 key }.
 * The keys travel in the SQL text over HTTPS and are never printed; an error
 * shows the database's message, never the query.
 */
export async function pushKeys(store) {
  const ids = Object.keys(store).filter((id) => /^\d+$/.test(id));
  const values = ids.map((id) => `(${Number(id)}, decode(${literal(String(store[id]))}, 'base64'))`);
  const keep = ids.length ? ids.map(Number).join(", ") : "-1";
  await runSql(
    (values.length ? `insert into guinea_private.keys (id, secret) values ${values.join(", ")} on conflict (id) do update set secret = excluded.secret;\n` : "") +
      `delete from guinea_private.keys where id not in (${keep});`
  );
}

/** A text as a SQL literal. */
export function literal(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function readAccess() {
  let access;
  try {
    access = JSON.parse(fs.readFileSync(ACCESS_FILE, "utf8"));
  } catch {
    throw new Error(`No Supabase access in ${ACCESS_FILE}: create a token in the dashboard (Account, Access Tokens) and write { "ref", "token" } there.`);
  }
  if (!access.ref || !access.token) {
    throw new Error(`${ACCESS_FILE} needs "ref" and "token".`);
  }
  return access;
}
