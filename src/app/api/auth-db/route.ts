import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KV_KEY = "auth-scanner-db";
const FS_PATH = path.join(process.cwd(), "auth-database.json");

interface DbData {
  events: any[];
  users: any[];
  userEvents: any[];
  scans: Record<string, any[]>;
}

const defaultDb: DbData = { events: [], users: [], userEvents: [], scans: {} };

async function readDb(): Promise<DbData> {
  if (process.env.KV_URL) {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get<DbData>(KV_KEY);
    return data || defaultDb;
  }
  try {
    const raw = fs.readFileSync(FS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return defaultDb;
  }
}

async function writeDb(data: DbData) {
  if (process.env.KV_URL) {
    const { kv } = await import("@vercel/kv");
    await kv.set(KV_KEY, data);
    return;
  }
  fs.writeFileSync(FS_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(await readDb());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = await readDb();

  switch (body.action) {
    case "createEvent":
      db.events.push(body.data);
      await writeDb(db);
      return NextResponse.json({ ok: true });

    case "createUser":
      db.users.push(body.data);
      await writeDb(db);
      return NextResponse.json({ ok: true });

    case "createUserEvent":
      db.userEvents.push(body.data);
      await writeDb(db);
      return NextResponse.json({ ok: true });

    case "saveScan":
      if (!db.scans[body.userId]) db.scans[body.userId] = [];
      db.scans[body.userId].unshift(body.data);
      await writeDb(db);
      return NextResponse.json({ ok: true });

    case "clearScans":
      db.scans[body.userId] = [];
      await writeDb(db);
      return NextResponse.json({ ok: true });

    case "deleteEvent":
      db.events = db.events.filter((e: any) => e.id !== body.data.id);
      db.userEvents = db.userEvents.filter((ue: any) => ue.eventId !== body.data.id);
      for (const uid of Object.keys(db.scans)) {
        db.scans[uid] = db.scans[uid].filter((s: any) => s.eventId !== body.data.id);
      }
      await writeDb(db);
      return NextResponse.json({ ok: true });

    case "deleteUser":
      db.users = db.users.filter((u: any) => u.id !== body.data.id);
      db.userEvents = db.userEvents.filter((ue: any) => ue.userId !== body.data.id);
      delete db.scans[body.data.id];
      await writeDb(db);
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
