import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { initDb, readJson, writeJson } from "@/lib/turso";

const KEY = "inventify-db";
const FS_PATH = path.join(process.env.VERCEL ? "/tmp" : process.cwd(), "inventify-database.json");

const SEED_CATEGORIES = [
  "Table and Chairs Dressing", "Candles", "Tableware", "Lights",
  "Accreditation & Lanyards", "Furniture", "Water Station", "Signage",
  "Table Covers", "Flower Vases & Stands", "Flowers & Foliage", "Fillers",
  "Christmas Decor", "Equipment",
];

const SEED_PRODUCTS: { desc: string; unit: string; loc: string; cat: string }[] = [
  { desc: "White Chair Covers", unit: "4121", loc: "Programs Office Store 1 (2,121 at the dry cleaners)", cat: "Table and Chairs Dressing" },
  { desc: "Gold Chair Covers", unit: "850", loc: "Programs Office Store 1 (350 at the dry cleaners)", cat: "Table and Chairs Dressing" },
  { desc: "Padded Chairs", unit: "500", loc: "Programs Office Store 1", cat: "Table and Chairs Dressing" },
  { desc: "Green chair Pad Cover", unit: "850", loc: "Programs Office Store 1", cat: "Table and Chairs Dressing" },
  { desc: "Gold Chair sashes/cap", unit: "850", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Pink/Peach Sashes", unit: "500", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Lilac", unit: "285", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Margenta", unit: "88", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Gold", unit: "285", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Nude", unit: "140", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Wine", unit: "480", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Green Damask", unit: "84", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins - Green Satin", unit: "260", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Napkins at the dry Cleaners (Different colors)", unit: "870", loc: "Programs Office Store 3", cat: "Table and Chairs Dressing" },
  { desc: "Long Slim LED Candles", unit: "120", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Long Fat LED Candles", unit: "22", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "LED Medium length", unit: "25", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "LED Short length", unit: "92", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Electronic Swing Candles", unit: "42", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Grey LCD Candle 9 Packs (Set of 3)", unit: "27", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Real Touch serrated Candles (3 Lengths)", unit: "33", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "8.5X22CM Candles (Long and Fat) 20 pair", unit: "40", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Long candle sticks - Gold", unit: "113", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Long candle sticks - White", unit: "36", loc: "Programs Office Store 2 (Shelves)", cat: "Candles" },
  { desc: "Crystal Candelabras", unit: "24", loc: "Programs Office Store 2 (Shelves)", cat: "Tableware" },
  { desc: "Silver and stone Candelabra", unit: "20", loc: "Programs Office Store 2 (Shelves)", cat: "Tableware" },
  { desc: "Gold Square Plate Chargers", unit: "120", loc: "Programs Office Store 2 (Shelves)", cat: "Tableware" },
  { desc: "Rubber Plate Chargers", unit: "20", loc: "To be retrieved from Sister Omoh", cat: "Tableware" },
  { desc: "Flower Napkin Rings", unit: "120", loc: "Programs Office Store 2 (Shelves)", cat: "Tableware" },
  { desc: "Round Napkin Rings", unit: "210", loc: "Programs Office Store 2 (Shelves)", cat: "Tableware" },
  { desc: "Heavy Dangling Crystals", unit: "121", loc: "Programs Office Store 2 (Shelves)", cat: "Tableware" },
  { desc: "Pipe Lights - New", unit: "35", loc: "Programs Office Store 3", cat: "Lights" },
  { desc: "20 Bulbs string light - New", unit: "20", loc: "Programs Office Store 3", cat: "Lights" },
  { desc: "String Lights - New", unit: "20", loc: "Programs Office Store 3", cat: "Lights" },
  { desc: "Accreditation Desks", unit: "20", loc: "Programs Office Corridor", cat: "Accreditation & Lanyards" },
  { desc: "Accreditation Center Backdrop", unit: "1", loc: "Programs Office Corridor", cat: "Accreditation & Lanyards" },
  { desc: "Backdrop and Banner Frames", unit: "10", loc: "Programs Office Corridor", cat: "Accreditation & Lanyards" },
  { desc: "Pouches - New", unit: "40000", loc: "DSS Container", cat: "Accreditation & Lanyards" },
  { desc: "Ministry Programs Lanyards - Blue", unit: "0", loc: "DSS Container (2 Big Sacks)", cat: "Accreditation & Lanyards" },
  { desc: "Ministry Programs Lanyards - Purple", unit: "0", loc: "DSS Container (1 Bag)", cat: "Accreditation & Lanyards" },
  { desc: "Ministry Programs Lanyards - Other Colors", unit: "0", loc: "DSS Container (1 Sack)", cat: "Accreditation & Lanyards" },
  { desc: "Unbranded Purple Lanyards", unit: "0", loc: "DSS Container (1 Carton)", cat: "Accreditation & Lanyards" },
  { desc: "December 24 Christmas Eve Service Lanyards", unit: "0", loc: "DSS Container (1 Sack)", cat: "Accreditation & Lanyards" },
  { desc: "IPPC 2024 Lanyards - Different colors", unit: "0", loc: "DSS Container (2 Sacks)", cat: "Accreditation & Lanyards" },
  { desc: "LLC Lanyards - No Date", unit: "0", loc: "DSS Container (1 Small Sack)", cat: "Accreditation & Lanyards" },
  { desc: "New Tables", unit: "50", loc: "Programs Office Store 1", cat: "Furniture" },
  { desc: "Wooden Detachable Stands with Cupboards", unit: "15", loc: "Programs Office Store 1", cat: "Furniture" },
  { desc: "Gold Board Food Stands", unit: "12", loc: "Programs Office Store 1", cat: "Furniture" },
  { desc: "Snack Bars with Shelves", unit: "20", loc: "Ware House", cat: "Furniture" },
  { desc: "Sitouts", unit: "12", loc: "Ware House", cat: "Furniture" },
  { desc: "Directors Carrier Bags", unit: "3000", loc: "Programs Office Store 1", cat: "Furniture" },
  { desc: "HOP's Carrier Bags", unit: "300", loc: "Programs Office Store 1", cat: "Furniture" },
  { desc: "Programs Branded Draw String Bags", unit: "5000", loc: "Programs Office Store 2", cat: "Furniture" },
  { desc: "Gold Disposable cutleries (Spoon, knives & forks)", unit: "0", loc: "Programs Office Store 2 (2 Cartons)", cat: "Furniture" },
  { desc: "Dental Floss", unit: "0", loc: "Programs Office Store 2 (1/2 Carton)", cat: "Furniture" },
  { desc: "Water Station Stand", unit: "1", loc: "Bay 2 Welcome Area", cat: "Water Station" },
  { desc: "Single Water Station Unit", unit: "20", loc: "Programs Office Store 1", cat: "Water Station" },
  { desc: "Water Dispensers Machine", unit: "17", loc: "Programs Office Store 1", cat: "Water Station" },
  { desc: "Water Dispenser Stand", unit: "20", loc: "Programs Office Store 1", cat: "Water Station" },
  { desc: "Refill Bottles", unit: "165", loc: "Programs Office Store 1", cat: "Water Station" },
  { desc: "Giant Coolers", unit: "2", loc: "Ware House", cat: "Water Station" },
  { desc: "Disposable Cups", unit: "165", loc: "Programs Office Store 2", cat: "Water Station" },
  { desc: "Barricades", unit: "97", loc: "", cat: "Signage" },
  { desc: "Stanchions", unit: "0", loc: "", cat: "Signage" },
  { desc: "Serpentines", unit: "0", loc: "3 Sets", cat: "Signage" },
  { desc: "Flags", unit: "329", loc: "", cat: "Signage" },
  { desc: "Flag Poles", unit: "0", loc: "3 Sets", cat: "Signage" },
  { desc: "Pop Up Banner", unit: "28", loc: "", cat: "Signage" },
  { desc: "Flying Banners", unit: "0", loc: "", cat: "Signage" },
  { desc: "Signages", unit: "120", loc: "", cat: "Signage" },
  { desc: "Signages - Double", unit: "6", loc: "", cat: "Signage" },
  { desc: "Signage Stand", unit: "9", loc: "", cat: "Signage" },

  // ---- Table Covers ----
  { desc: "Gold Table Covers (Food Court)", unit: "150", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Blue Table Covers", unit: "180", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Black Table Covers", unit: "30", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "White Table Covers", unit: "300", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Champagne Table Covers", unit: "150", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Green Table Covers", unit: "60", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Purple Table Covers", unit: "40", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Lace Gold Overlay", unit: "70", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "Nude Table Covers", unit: "150", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },
  { desc: "White Table Covers With Pleating", unit: "121", loc: "Decor Container Beside Programs' Office", cat: "Table Covers" },

  // ---- Flower Vases & Stands ----
  { desc: "Acrylic Flower Vases (Long)", unit: "200", loc: "Decor Container Beside Programs' Office", cat: "Flower Vases & Stands" },
  { desc: "Metal Flower Stands", unit: "60", loc: "Decor Container Beside Programs' Office", cat: "Flower Vases & Stands" },
  { desc: "Gold Flower Stands (Alucobond Made)", unit: "50", loc: "Bay 1", cat: "Flower Vases & Stands" },
  { desc: "Silver Flower Stands (Alucobond Made)", unit: "40", loc: "Bay 1", cat: "Flower Vases & Stands" },
  { desc: "Glass Table Vase For Flowers - Table Decor (Short)", unit: "120", loc: "Decor Container Beside Programs' Office", cat: "Flower Vases & Stands" },
  { desc: "Flower Vases (Tall & Short Vases)", unit: "100", loc: "Decor Container Beside Programs' Office", cat: "Flower Vases & Stands" },
  { desc: "Flowers Vases", unit: "30", loc: "Oasis Ballroom", cat: "Flower Vases & Stands" },

  // ---- Flowers & Foliage ----
  { desc: "Cherry Blossom Flowers (White)", unit: "1022", loc: "Programs' Office", cat: "Flowers & Foliage" },
  { desc: "Cherry Blossom Flowers (Yellow)", unit: "28", loc: "Programs Office", cat: "Flowers & Foliage" },
  { desc: "Lilac Roses", unit: "92", loc: "Programs Office", cat: "Flowers & Foliage" },
  { desc: "Gold Roses", unit: "76", loc: "Programs Office", cat: "Flowers & Foliage" },
  { desc: "Green Big Roses", unit: "80", loc: "Decor Container Beside Programs' Office", cat: "Flowers & Foliage" },
  { desc: "White Big Roses", unit: "200", loc: "On Bleachers In Bay 1 & 2", cat: "Flowers & Foliage" },
  { desc: "Burnt Orange Flowers", unit: "10", loc: "Decor Container Beside Programs' Office", cat: "Flowers & Foliage" },
  { desc: "Rose Brushes (Champagne)", unit: "0", loc: "Decor Container Beside Programs' Office (1 Carton)", cat: "Flowers & Foliage" },
  { desc: "Gold Flowers (Long)", unit: "50", loc: "Decor Container Beside Programs' Office", cat: "Flowers & Foliage" },
  { desc: "Silver Flowers (Long)", unit: "50", loc: "Decor Container Beside Programs' Office", cat: "Flowers & Foliage" },
  { desc: "Sunflowers (Small)", unit: "0", loc: "Decor Container (1 Bag)", cat: "Flowers & Foliage" },
  { desc: "Wisteria Hanging Flowers (Pink)", unit: "0", loc: "Pinnacle Warehouse (1/2 Bag)", cat: "Flowers & Foliage" },
  { desc: "Sunflowers (Big)", unit: "0", loc: "Decor Container (1 Bag)", cat: "Flowers & Foliage" },
  { desc: "Wisteria Hanging Flowers (Purple)", unit: "0", loc: "In The Ceiling In The Hall In Bay 1 & 2", cat: "Flowers & Foliage" },
  { desc: "Wisteria Hanging Flowers (White)", unit: "0", loc: "In The Ceiling In Bay 1 & 2", cat: "Flowers & Foliage" },

  // ---- Fillers ----
  { desc: "Purple Fillers (Small)", unit: "153", loc: "Programs Office", cat: "Fillers" },
  { desc: "Green Fillers (Medium Size)", unit: "178", loc: "Programs Office", cat: "Fillers" },
  { desc: "Green And White Fillers", unit: "171", loc: "Programs Office", cat: "Fillers" },
  { desc: "Only Green (Very Small)", unit: "440", loc: "Programs Office", cat: "Fillers" },
  { desc: "Five Branch Persia (Cream) For Table Flowers Meetings", unit: "300", loc: "Decor Container Beside Programs' Office", cat: "Fillers" },
  { desc: "Green Fillers With Red Tip On Top", unit: "17", loc: "Programs Office", cat: "Fillers" },

  // ---- Christmas Decor ----
  { desc: "Christmas Trees", unit: "16", loc: "Bay 1", cat: "Christmas Decor" },
  { desc: "Christmas Tree (Longest)", unit: "1", loc: "Bay 1", cat: "Christmas Decor" },
  { desc: "Merry Christmas Wreath", unit: "25", loc: "Programs Office", cat: "Christmas Decor" },
  { desc: "Merry Christmas Ornaments", unit: "30", loc: "Programs Office", cat: "Christmas Decor" },
  { desc: "Xmas Bow Tie", unit: "3", loc: "Programs Office", cat: "Christmas Decor" },
  { desc: "Christmas Garland", unit: "0", loc: "Bay 1", cat: "Christmas Decor" },

  // ---- Equipment ----
  { desc: "Morphy Richards Iron", unit: "1", loc: "Programs Office", cat: "Equipment" },
  { desc: "Garment Steamer", unit: "1", loc: "Programs Office", cat: "Equipment" },
  { desc: "Power Extension", unit: "1", loc: "Programs Office", cat: "Equipment" },
];

async function getDb(): Promise<any> {
  const raw = await readJson(KEY, FS_PATH);
  return {
    products: raw.products || [],
    users: raw.users || [],
    requests: raw.requests || [],
    categories: raw.categories || [],
    oneSignalSubscriptions: raw.oneSignalSubscriptions || [],
  };
}

export async function GET() {
  try {
    await initDb();
    return NextResponse.json(await getDb());
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e), stack: e.stack }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();
    const db: any = await getDb();

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

      case "updateUser":
        db.users = db.users.map((u: any) =>
          u.id === body.data.id ? body.data : u
        );
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

      case "createCategory":
        db.categories.push(body.data);
        await writeJson(KEY, FS_PATH, db);
        return NextResponse.json({ ok: true });

      case "deleteCategory":
        db.categories = db.categories.filter((c: any) => c.id !== body.data.id);
        await writeJson(KEY, FS_PATH, db);
        return NextResponse.json({ ok: true });

      case "seed": {
        const catMap: Record<string, string> = {};
        for (const name of SEED_CATEGORIES) {
          const existing = db.categories.find((c: any) => c.name === name);
          if (existing) catMap[name] = existing.id;
          else { const id = crypto.randomUUID(); db.categories.push({ id, name }); catMap[name] = id; }
        }
        const existingDescs = new Set(db.products.map((p: any) => (p.description || p.name).toLowerCase().trim()));
        const now = new Date().toISOString();
        let added = 0;
        for (const s of SEED_PRODUCTS) {
          const desc = (s.unit.trim().length > 0 && isNaN(parseInt(s.unit.replace(/,/g, ""), 10)))
            ? `${s.desc} (${s.unit.trim()})` : s.desc;
          if (existingDescs.has(desc.toLowerCase().trim())) continue;
          const num = parseInt(s.unit.replace(/,/g, ""), 10);
          const total = isNaN(num) ? 0 : num;
          db.products.push({
            id: crypto.randomUUID(), name: desc, description: desc,
            category: catMap[s.cat], location: s.loc || undefined,
            totalCount: total, availableCount: total,
            createdAt: now,
          });
          added++;
        }
        await writeJson(KEY, FS_PATH, db);
        return NextResponse.json({ ok: true, count: added });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e), stack: e.stack }, { status: 500 });
  }
}
