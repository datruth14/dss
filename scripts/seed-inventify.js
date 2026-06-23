const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const DB_PATH = path.join(__dirname, "..", "inventify-database.json");

const raw = fs.readFileSync(DB_PATH, "utf-8");
const db = JSON.parse(raw);

if (!db.categories) db.categories = [];
if (!db.products) db.products = [];

const catId = (name) => {
  const existing = db.categories.find((c) => c.name === name);
  if (existing) return existing.id;
  const id = randomUUID();
  db.categories.push({ id, name });
  return id;
};

const prod = (description, totalCountStr, location, categoryName) => {
  const num = parseInt(totalCountStr.replace(/,/g, ""), 10);
  const isText = isNaN(num) && totalCountStr.trim().length > 0;
  const totalCount = isText ? 0 : num;
  const p = {
    id: randomUUID(),
    name: description,
    description,
    category: catId(categoryName),
    location: location || undefined,
    totalCount,
    availableCount: totalCount,
    createdAt: new Date().toISOString(),
  };
  if (isText) {
    p.description = `${description} (${totalCountStr.trim()})`;
    p.name = p.description;
  }
  db.products.push(p);
};

// ---- Table and Chairs Dressing ----
prod("White Chair Covers", "4121", "Programs Office Store 1 (2,121 at the dry cleaners)", "Table and Chairs Dressing");
prod("Gold Chair Covers", "850", "Programs Office Store 1 (350 at the dry cleaners)", "Table and Chairs Dressing");
prod("Padded Chairs", "500", "Programs Office Store 1", "Table and Chairs Dressing");
prod("Green chair Pad Cover", "850", "Programs Office Store 1", "Table and Chairs Dressing");
prod("Gold Chair sashes/cap", "850", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Pink/Peach Sashes", "500", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Lilac", "285", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Margenta", "88", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Gold", "285", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Nude", "140", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Wine", "480", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Green Damask", "84", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins - Green Satin", "260", "Programs Office Store 3", "Table and Chairs Dressing");
prod("Napkins at the dry Cleaners (Different colors)", "870", "Programs Office Store 3", "Table and Chairs Dressing");

// ---- Candles ----
prod("Long Slim LED Candles", "120", "Programs Office Store 2 (Shelves)", "Candles");
prod("Long Fat LED Candles", "22", "Programs Office Store 2 (Shelves)", "Candles");
prod("LED Medium length", "25", "Programs Office Store 2 (Shelves)", "Candles");
prod("LED Short length", "92", "Programs Office Store 2 (Shelves)", "Candles");
prod("Electronic Swing Candles", "42", "Programs Office Store 2 (Shelves)", "Candles");
prod("Grey LCD Candle 9 Packs (Set of 3)", "27", "Programs Office Store 2 (Shelves)", "Candles");
prod("Real Touch serrated Candles (3 Lengths)", "33", "Programs Office Store 2 (Shelves)", "Candles");
prod("8.5X22CM Candles (Long and Fat) 20 pair", "40", "Programs Office Store 2 (Shelves)", "Candles");
prod("Long candle sticks - Gold", "113", "Programs Office Store 2 (Shelves)", "Candles");
prod("Long candle sticks - White", "36", "Programs Office Store 2 (Shelves)", "Candles");

// ---- Tableware ----
prod("Crystal Candelabras", "24", "Programs Office Store 2 (Shelves)", "Tableware");
prod("Silver and stone Candelabra", "20", "Programs Office Store 2 (Shelves)", "Tableware");
prod("Gold Square Plate Chargers", "120", "Programs Office Store 2 (Shelves)", "Tableware");
prod("Rubber Plate Chargers", "20", "To be retrieved from Sister Omoh", "Tableware");
prod("Flower Napkin Rings", "120", "Programs Office Store 2 (Shelves)", "Tableware");
prod("Round Napkin Rings", "210", "Programs Office Store 2 (Shelves)", "Tableware");
prod("Heavy Dangling Crystals", "121", "Programs Office Store 2 (Shelves)", "Tableware");

// ---- Lights ----
prod("Pipe Lights - New", "35", "Programs Office Store 3", "Lights");
prod("20 Bulbs string light - New", "20", "Programs Office Store 3", "Lights");
prod("String Lights - New", "20", "Programs Office Store 3", "Lights");

// ---- Accreditation & Lanyards ----
prod("Accreditation Desks", "20", "Programs Office Corridor", "Accreditation & Lanyards");
prod("Accreditation Center Backdrop", "1", "Programs Office Corridor", "Accreditation & Lanyards");
prod("Backdrop and Banner Frames", "10", "Programs Office Corridor", "Accreditation & Lanyards");
prod("Pouches - New", "40000", "DSS Container", "Accreditation & Lanyards");
prod("Ministry Programs Lanyards - Blue", "0", "DSS Container (2 Big Sacks)", "Accreditation & Lanyards");
prod("Ministry Programs Lanyards - Purple", "0", "DSS Container (1 Bag)", "Accreditation & Lanyards");
prod("Ministry Programs Lanyards - Other Colors", "0", "DSS Container (1 Sack)", "Accreditation & Lanyards");
prod("Unbranded Purple Lanyards", "0", "DSS Container (1 Carton)", "Accreditation & Lanyards");
prod("December 24 Christmas Eve Service Lanyards", "0", "DSS Container (1 Sack)", "Accreditation & Lanyards");
prod("IPPC 2024 Lanyards - Different colors", "0", "DSS Container (2 Sacks)", "Accreditation & Lanyards");
prod("LLC Lanyards - No Date", "0", "DSS Container (1 Small Sack)", "Accreditation & Lanyards");

// ---- Furniture ----
prod("New Tables", "50", "Programs Office Store 1", "Furniture");
prod("Wooden Detachable Stands with Cupboards", "15", "Programs Office Store 1", "Furniture");
prod("Gold Board Food Stands", "12", "Programs Office Store 1", "Furniture");
prod("Snack Bars with Shelves", "20", "Ware House", "Furniture");
prod("Sitouts", "12", "Ware House", "Furniture");
prod("Directors Carrier Bags", "3000", "Programs Office Store 1 (Over 3,000)", "Furniture");
prod("HOP's Carrier Bags", "300", "Programs Office Store 1", "Furniture");
prod("Programs Branded Draw String Bags", "5000", "Programs Office Store 2 (Over 5,000)", "Furniture");
prod("Gold Disposable cutleries (Spoon, knives & forks)", "0", "Programs Office Store 2 (2 Cartons)", "Furniture");
prod("Dental Floss", "0", "Programs Office Store 2 (1/2 Carton)", "Furniture");

// ---- Water Station ----
prod("Water Station Stand", "1", "Bay 2 Welcome Area", "Water Station");
prod("Single Water Station Unit", "20", "Programs Office Store 1", "Water Station");
prod("Water Dispensers Machine", "17", "Programs Office Store 1", "Water Station");
prod("Water Dispenser Stand", "20", "Programs Office Store 1", "Water Station");
prod("Refill Bottles", "165", "Programs Office Store 1", "Water Station");
prod("Giant Coolers", "2", "Ware House", "Water Station");
prod("Disposable Cups", "165", "Programs Office Store 2", "Water Station");

// ---- Signage ----
prod("Barricades", "97", "", "Signage");
prod("Stanchions", "0", "", "Signage");
prod("Serpentines", "0", "3 Sets", "Signage");
prod("Flags", "329", "", "Signage");
prod("Flag Poles", "0", "3 Sets", "Signage");
prod("Pop Up Banner", "28", "", "Signage");
prod("Flying Banners", "0", "", "Signage");
prod("Signages", "120", "", "Signage");
prod("Signages - Double", "6", "", "Signage");
prod("Signage Stand", "9", "", "Signage");

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(`Seeded ${db.products.length} products in ${db.categories.length} categories`);
