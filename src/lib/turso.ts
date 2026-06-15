import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (client) return client;
  if (!process.env.TURSO_DATABASE_URL) return null;
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return client;
}

export async function initDb() {
  const c = getClient();
  if (!c) return;
  await c.execute(
    "CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
  );
}

export async function readJson(key: string, fsPath: string): Promise<any> {
  const c = getClient();
  if (c) {
    const row = await c.execute("SELECT value FROM app_data WHERE key = ?", [key]);
    if (row.rows.length > 0) {
      return JSON.parse(row.rows[0].value as string);
    }
    const empty = { events: [], users: [], userEvents: [], scans: {} };
    await c.execute("INSERT INTO app_data (key, value) VALUES (?, ?)", [
      key,
      JSON.stringify(empty),
    ]);
    return empty;
  }
  try {
    const raw = fs.readFileSync(fsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { events: [], users: [], userEvents: [], scans: {} };
  }
}

export async function writeJson(key: string, fsPath: string, data: any) {
  const c = getClient();
  if (c) {
    await c.execute("INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)", [
      key,
      JSON.stringify(data),
    ]);
    return;
  }
  fs.writeFileSync(fsPath, JSON.stringify(data, null, 2));
}
