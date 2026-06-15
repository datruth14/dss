import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { initDb, readJson, writeJson } from "@/lib/turso";

const KEY = "inventify-db";
const FS_PATH = path.join(process.cwd(), "inventify-database.json");

export async function GET() {
  await initDb();
  return NextResponse.json(await readJson(KEY, FS_PATH));
}

export async function POST(request: NextRequest) {
  await initDb();
  const body = await request.json();
  const db: any = await readJson(KEY, FS_PATH);

  switch (body.action) {
    case "createProduct":
      db.products.push(body.data);
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "updateProduct":
      db.products = db.products.map((p: any) =>
        p.id === body.data.id ? body.data : p
      );
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "deleteProduct":
      db.products = db.products.filter((p: any) => p.id !== body.data.id);
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "createUser":
      db.users.push(body.data);
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "deleteUser":
      db.users = db.users.filter((u: any) => u.id !== body.data.id);
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "submitRequest":
      db.requests.push(body.data);
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "updateRequest":
      db.requests = db.requests.map((r: any) =>
        r.id === body.data.id ? body.data : r
      );
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    case "saveSubscription":
      db.oneSignalSubscriptions = db.oneSignalSubscriptions || [];
      if (!db.oneSignalSubscriptions.find((s: any) => s.id === body.data.id)) {
        db.oneSignalSubscriptions.push(body.data);
      }
      await writeJson(KEY, FS_PATH, db);
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
