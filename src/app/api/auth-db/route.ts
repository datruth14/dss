import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { initDb, readJson, writeJson } from "@/lib/turso";

const KV_KEY = "auth-scanner-db";
const FS_PATH = path.join(process.env.VERCEL ? "/tmp" : process.cwd(), "auth-database.json");

interface DbData {
  events: any[];
  users: any[];
  userEvents: any[];
  scans: Record<string, any[]>;
}

export async function GET() {
  await initDb();
  return NextResponse.json(await readJson(KV_KEY, FS_PATH));
}

export async function POST(request: NextRequest) {
  await initDb();
  const body = await request.json();
  const db: DbData = await readJson(KV_KEY, FS_PATH);

  switch (body.action) {
    case "createEvent":
      db.events.push(body.data);
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "createUser":
      db.users.push(body.data);
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "createUserEvent":
      db.userEvents.push(body.data);
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "saveScan":
      if (!db.scans[body.userId]) db.scans[body.userId] = [];
      db.scans[body.userId].unshift(body.data);
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "clearScans":
      db.scans[body.userId] = [];
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "deleteEvent":
      db.events = db.events.filter((e: any) => e.id !== body.data.id);
      db.userEvents = db.userEvents.filter((ue: any) => ue.eventId !== body.data.id);
      for (const uid of Object.keys(db.scans)) {
        db.scans[uid] = db.scans[uid].filter((s: any) => s.eventId !== body.data.id);
      }
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "deleteUser":
      db.users = db.users.filter((u: any) => u.id !== body.data.id);
      db.userEvents = db.userEvents.filter((ue: any) => ue.userId !== body.data.id);
      delete db.scans[body.data.id];
      await writeJson(KV_KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
