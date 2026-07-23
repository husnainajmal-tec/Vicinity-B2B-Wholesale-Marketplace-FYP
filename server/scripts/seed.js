/**
 * Vicinity Trade — full marketplace seed for FYP demos & screenshots.
 *
 *   cd server
 *   npm run seed            # abort if Users already exist
 *   npm run seed -- --reset # wipe relevant collections, then seed
 *
 * All demo accounts share password: Demo@1234
 * (hashed by the User model's pre-save bcrypt hook — same as registration)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const connectDB = require("../config/db");

const User = require("../models/User");
const CompanyProfile = require("../models/CompanyProfile");
const Product = require("../models/Product");
const { PRODUCT_CATEGORIES } = require("../models/Product");
const RFQ = require("../models/RFQ");
const Quote = require("../models/Quote");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Favorite = require("../models/Favorite");

const DEMO_PASSWORD = "Demo@1234";
const RESET = process.argv.includes("--reset");

const CITIES = [
  { city: "Lahore", region: "Punjab" },
  { city: "Karachi", region: "Sindh" },
  { city: "Islamabad", region: "Islamabad Capital Territory" },
  { city: "Faisalabad", region: "Punjab" },
  { city: "Sialkot", region: "Punjab" },
  { city: "Gujranwala", region: "Punjab" },
  { city: "Multan", region: "Punjab" },
  { city: "Peshawar", region: "Khyber Pakhtunkhwa" },
];

const FIRST_NAMES = [
  "Ahmed", "Ali", "Ayesha", "Bilal", "Fatima", "Hassan", "Hina", "Imran",
  "Iqra", "Javed", "Kamran", "Khadija", "Mahnoor", "Maria", "Nabeel", "Nadia",
  "Omar", "Rabia", "Sana", "Sara", "Shahid", "Sohail", "Tariq", "Usman",
  "Waqas", "Zainab", "Zubair", "Asma", "Farhan", "Mehwish", "Hamza", "Noor",
  "Saad", "Amina", "Danish", "Saima", "Rizwan", "Bushra", "Fahad", "Hira",
  "Adnan", "Lubna",
];

const LAST_NAMES = [
  "Khan", "Ahmed", "Ali", "Malik", "Hussain", "Raza", "Sheikh", "Butt",
  "Chaudhry", "Qureshi", "Siddiqui", "Mirza", "Awan", "Bhatti", "Hashmi",
  "Iqbal", "Javed", "Nawaz", "Rehman", "Shah", "Tariq", "Yousaf", "Zaidi",
];

const BUSINESS_TYPES = ["Manufacturer", "Trader", "Distributor"];

const CERT_POOL = [
  "ISO 9001", "ISO 14001", "ISO 13485", "OEKO-TEX", "GOTS", "HALAL",
  "CE Mark", "FDA Registered", "BSCI", "SEDEX",
];

const COMPANY_SUFFIXES = [
  "Industries", "Trading Co.", "Manufacturers", "Enterprises", "Exports",
  "Pvt Ltd", "International", "Wholesale", "Supply Co.", "Group",
];

/** Category → sample product templates (title, description, pexels query, moq range, base price). */
const PRODUCT_TEMPLATES = {
  "Textiles & Apparel": [
    { title: "Combed Cotton T-Shirts (Blank)", desc: "180 GSM combed cotton crew-neck blanks, sizes S–XXL. Ideal for screen printing and private label.", query: "cotton t-shirt bulk", moq: [100, 500], price: [3.5, 6] },
    { title: "Ring-Spun Cotton Yarn Cones (30s)", desc: "Consistent-count 30s ring-spun cotton yarn on 1.25 kg cones for knitting and weaving mills.", query: "cotton yarn industrial", moq: [50, 200], price: [5, 8] },
    { title: "Polyester Fleece Hoodies (Unbranded)", desc: "350 GSM fleece hoodies, kangaroo pocket, unbranded. Bulk cartons ready for embroidery.", query: "hoodie apparel manufacturing", moq: [200, 800], price: [6, 11] },
    { title: "Denim Fabric Rolls (12 oz)", desc: "Indigo denim fabric in 50-metre rolls. Suitable for jeans and jackets.", query: "denim fabric roll", moq: [20, 100], price: [4, 9] },
    { title: "Terry Towel Sets (Hotel Grade)", desc: "100% cotton terry towels, 500 GSM. White and coloured sets for hospitality supply.", query: "cotton towels hotel", moq: [100, 400], price: [2.5, 5] },
    { title: "Knitted Polo Shirts (Bulk)", desc: "Piqué knit polos with collar and placket. Available in standard colourways.", query: "polo shirt wholesale", moq: [150, 600], price: [4, 7.5] },
  ],
  Electronics: [
    { title: "USB-C Fast Charging Cables (1m)", desc: "60W braided USB-C to USB-C cables, retail-boxed. Cartons of 50.", query: "usb c cable product", moq: [200, 1000], price: [1.2, 2.5] },
    { title: "10000mAh Power Banks", desc: "Slim aluminium power banks with dual output. OEM branding on large orders.", query: "power bank electronics", moq: [100, 500], price: [6, 12] },
    { title: "Wireless Earbuds (TWS)", desc: "Bluetooth 5.3 TWS earbuds with charging case. Bulk OEM packaging available.", query: "wireless earbuds product", moq: [100, 400], price: [8, 18] },
    { title: "LED Strip Lights (5m Rolls)", desc: "12V RGB LED strips, IP65. Suitable for retail display and architectural lighting.", query: "led strip lights", moq: [50, 300], price: [3, 7] },
    { title: "Phone Screen Protectors (Tempered)", desc: "9H tempered glass protectors, multi-model assortments. Retail packs of 10.", query: "phone screen protector", moq: [500, 2000], price: [0.4, 1.2] },
    { title: "USB Wall Chargers (Dual Port)", desc: "18W dual-port USB wall chargers with surge protection. Mixed colour cartons.", query: "phone charger adapter", moq: [200, 800], price: [1.5, 3.5] },
  ],
  "Food & Beverage": [
    { title: "Basmati Rice 25kg Sacks (Premium)", desc: "Aged long-grain basmati in 25 kg woven sacks. Export-grade aroma and length.", query: "basmati rice sack", moq: [40, 200], price: [18, 28] },
    { title: "Assorted Spice Powders (200g Packs)", desc: "Turmeric, chilli, coriander, and cumin in 200g retail pouches. Mixed cartons.", query: "spice powder packaging", moq: [60, 300], price: [0.8, 1.8] },
    { title: "Himalayan Pink Salt (Fine)", desc: "Food-grade fine pink salt in 25 kg bags. Ideal for retail repacking.", query: "himalayan pink salt", moq: [50, 250], price: [4, 9] },
    { title: "Cooking Oil Cartons (5L)", desc: "Refined sunflower cooking oil in 5L PET bottles, 4 per carton.", query: "cooking oil bottles", moq: [40, 160], price: [8, 14] },
    { title: "Herbal Green Tea (Bulk Leaves)", desc: "Orthodox green tea leaves in vacuum-sealed 5 kg packs for blending houses.", query: "green tea leaves", moq: [20, 100], price: [6, 12] },
    { title: "Dates — Deglet Nour (Cartons)", desc: "Export-grade Deglet Nour dates in 5 kg cartons. Soft texture, low moisture.", query: "dates fruit packaging", moq: [30, 150], price: [5, 11] },
  ],
  "Industrial & Machinery": [
    { title: "Industrial Sewing Machines (Single Needle)", desc: "Heavy-duty lockstitch machines for garment factories. Includes spare needles kit.", query: "industrial sewing machine", moq: [2, 10], price: [180, 350] },
    { title: "Hydraulic Pallet Jacks (2.5T)", desc: "Manual hydraulic pallet trucks, 2.5 tonne capacity. Warehouse-ready.", query: "pallet jack warehouse", moq: [5, 20], price: [120, 220] },
    { title: "CNC Cutting Blades (Assorted)", desc: "HSS and carbide cutting blades for CNC routers. Assorted diameters.", query: "cnc cutting tools", moq: [50, 200], price: [2, 8] },
    { title: "Electric Motors (3-Phase 2HP)", desc: "IE2 efficiency 3-phase motors for pumps and conveyors. Foot-mounted.", query: "industrial electric motor", moq: [4, 20], price: [90, 180] },
    { title: "Air Compressors (50L)", desc: "Oil-lubricated 50L air compressors for workshops. 8 bar max pressure.", query: "air compressor workshop", moq: [3, 15], price: [150, 280] },
    { title: "Ball Bearings Assortment Kits", desc: "Chrome steel deep-groove ball bearings, multi-size kits for maintenance shops.", query: "ball bearings industrial", moq: [20, 100], price: [15, 40] },
  ],
  Packaging: [
    { title: "Corrugated Carton Boxes (Mixed Sizes)", desc: "3-ply and 5-ply corrugated shipping cartons. Custom print available above MOQ.", query: "corrugated cardboard boxes", moq: [500, 2000], price: [0.3, 1.2] },
    { title: "Kraft Paper Bags (Brown)", desc: "Food-grade kraft paper bags with twist handles. Sizes S–L.", query: "kraft paper bags", moq: [1000, 5000], price: [0.08, 0.25] },
    { title: "Stretch Wrap Film Rolls", desc: "Industrial stretch wrap, 500 mm width. High cling for palletising.", query: "stretch wrap film", moq: [20, 100], price: [8, 18] },
    { title: "PET Bottles (500ml Clear)", desc: "Food-grade clear PET bottles with caps. Suitable for beverages and oils.", query: "pet plastic bottles", moq: [2000, 10000], price: [0.05, 0.15] },
    { title: "Bubble Wrap Rolls (Wide)", desc: "Protective bubble wrap rolls, 1.2 m wide × 100 m. Anti-static option available.", query: "bubble wrap packaging", moq: [10, 50], price: [12, 28] },
    { title: "Printed Flexible Pouches (Stand-up)", desc: "Custom-print stand-up pouches with zip lock. Ideal for snacks and spices.", query: "stand up pouch packaging", moq: [3000, 15000], price: [0.12, 0.4] },
  ],
  "Construction Materials": [
    { title: "Portland Cement Bags (50kg)", desc: "OPC 53-grade cement in 50 kg bags. Consistent setting time for commercial builds.", query: "cement bags construction", moq: [100, 500], price: [5, 8] },
    { title: "Ceramic Floor Tiles (60×60)", desc: "Polished porcelain floor tiles, 60×60 cm. Matt and glossy finishes.", query: "ceramic floor tiles", moq: [200, 1000], price: [3, 7] },
    { title: "PVC Pipes (4-inch Schedule 40)", desc: "Pressure-rated PVC pipes in 6 m lengths. Suitable for plumbing and irrigation.", query: "pvc pipes construction", moq: [50, 300], price: [4, 10] },
    { title: "Steel Rebar Bundles (Grade 60)", desc: "Deformed steel reinforcement bars, Grade 60. Bundled for site delivery.", query: "steel rebar construction", moq: [5, 30], price: [80, 150] },
    { title: "Emulsion Paint (20L Drums)", desc: "Interior emulsion paint in 20L drums. Low-VOC formula, standard white base.", query: "paint buckets construction", moq: [20, 100], price: [18, 35] },
    { title: "Gypsum Board Sheets (12mm)", desc: "Fire-rated gypsum plasterboard 12 mm. Standard and moisture-resistant grades.", query: "gypsum board drywall", moq: [50, 250], price: [4, 9] },
  ],
  "Health & Beauty": [
    { title: "Surgical Scissors (Stainless Steel)", desc: "ISO 13485-grade surgical scissors. Straight and curved tips. Autoclavable.", query: "surgical scissors medical", moq: [100, 500], price: [2, 6] },
    { title: "Disposable Surgical Gloves (Nitrile)", desc: "Powder-free nitrile examination gloves. Box of 100. Sizes S–XL.", query: "nitrile medical gloves", moq: [50, 300], price: [4, 9] },
    { title: "Forceps & Hemostat Sets", desc: "Stainless steel forceps and hemostat sets for clinics and training labs.", query: "surgical forceps instruments", moq: [50, 200], price: [5, 15] },
    { title: "Herbal Face Cream (Private Label)", desc: "Natural herbal moisturising cream in 50 ml jars. Ready for private-label branding.", query: "face cream skincare jar", moq: [500, 2000], price: [1.2, 3] },
    { title: "Dental Mirrors & Explorers Kit", desc: "Basic dental examination kits — mirrors, explorers, and tweezers. Sterilisable.", query: "dental instruments tools", moq: [100, 400], price: [3, 8] },
    { title: "Hand Sanitiser Gel (5L Refill)", desc: "70% alcohol hand sanitiser gel in 5L refill jugs. Hospital and retail grade.", query: "hand sanitizer bottle", moq: [40, 200], price: [6, 14] },
  ],
  Agriculture: [
    { title: "Hybrid Wheat Seed (Certified)", desc: "Certified hybrid wheat seed in 40 kg bags. High germination rate.", query: "wheat seeds agriculture", moq: [20, 100], price: [25, 45] },
    { title: "NPK Fertilizer Granules (50kg)", desc: "Balanced NPK fertilizer granules for field crops. Moisture-resistant packaging.", query: "fertilizer bags agriculture", moq: [40, 200], price: [12, 22] },
    { title: "Drip Irrigation Pipe Kits", desc: "Complete drip irrigation kits for smallholdings — pipes, emitters, and fittings.", query: "drip irrigation system", moq: [10, 50], price: [30, 70] },
    { title: "Organic Compost (Bulk Bags)", desc: "Fully composted organic soil conditioner in 25 kg bags for nurseries.", query: "compost soil agriculture", moq: [50, 250], price: [3, 7] },
    { title: "Poultry Feed Pellets (40kg)", desc: "Balanced broiler and layer feed pellets. Protein-fortified formulations.", query: "poultry feed bags", moq: [30, 150], price: [15, 28] },
    { title: "Agricultural Sprayers (16L)", desc: "Manual backpack sprayers, 16L capacity. Brass nozzle, adjustable straps.", query: "backpack sprayer agriculture", moq: [20, 80], price: [12, 25] },
  ],
  "Home & Furniture": [
    { title: "Wooden Dining Chairs (Unfinished)", desc: "Solid wood dining chairs, unfinished for custom finishing. Stackable design.", query: "wooden dining chairs", moq: [20, 100], price: [18, 40] },
    { title: "Stainless Steel Cookware Sets", desc: "5-piece stainless steel cookware sets with lids. Induction-compatible bases.", query: "stainless steel cookware", moq: [30, 150], price: [25, 55] },
    { title: "Ceramic Dinnerware Sets (12-pc)", desc: "Stoneware dinner sets for 4. Microwave and dishwasher safe. Neutral glazes.", query: "ceramic dinnerware set", moq: [40, 200], price: [15, 35] },
    { title: "Office Desk Frames (Metal)", desc: "Powder-coated steel desk frames, height-adjustable. Flat-packed.", query: "office desk furniture", moq: [10, 50], price: [40, 90] },
    { title: "Kitchen Knife Sets (6-pc)", desc: "Forged stainless kitchen knife sets with wooden block. Sharpened ready.", query: "kitchen knife set", moq: [50, 200], price: [12, 28] },
    { title: "Cotton Bed Sheet Sets (Queen)", desc: "200-thread-count cotton sheet sets. Fitted sheet, flat sheet, and pillowcases.", query: "bed sheets folded", moq: [50, 250], price: [8, 18] },
  ],
  Other: [
    { title: "Football Match Balls (FIFA Inspected)", desc: "Hand-stitched match footballs. PU cover, butyl bladder. Sialkot craftsmanship.", query: "soccer football product", moq: [50, 300], price: [8, 18] },
    { title: "Cricket Bats (English Willow)", desc: "Grade 1 English willow cricket bats. Knocked-in and ready for play.", query: "cricket bat sports", moq: [20, 100], price: [35, 80] },
    { title: "Genuine Leather Belts (Wholesale)", desc: "Full-grain cowhide belts with alloy buckles. Assorted sizes and colours.", query: "leather belts product", moq: [100, 500], price: [4, 10] },
    { title: "Leather Wallets (Bifold)", desc: "Hand-finished bifold wallets in genuine leather. RFID-blocking option.", query: "leather wallet product", moq: [100, 400], price: [5, 12] },
    { title: "Hockey Sticks (Composite)", desc: "Field hockey sticks, mid-bow composite. Junior and senior lengths.", query: "field hockey stick", moq: [30, 150], price: [15, 40] },
    { title: "Sports Team Uniform Kits", desc: "Sublimated polyester team kits — jersey and shorts. Custom colourways.", query: "sports team jersey", moq: [50, 250], price: [6, 14] },
  ],
};

const RFQ_TITLES = {
  "Textiles & Apparel": [
    "Bulk blank hoodies for winter retail line",
    "Cotton yarn supply for knitting unit",
    "Unbranded polo shirts — quarterly reorder",
  ],
  Electronics: [
    "USB-C cables for electronics retail chain",
    "Power banks for corporate gifting",
    "TWS earbuds — private label opportunity",
  ],
  "Food & Beverage": [
    "Monthly basmati rice supply contract",
    "Spice powders for supermarket private label",
    "Cooking oil cartons for wholesaler network",
  ],
  "Industrial & Machinery": [
    "Industrial sewing machines for new factory line",
    "Pallet jacks for warehouse expansion",
    "Spare bearings kit for maintenance inventory",
  ],
  Packaging: [
    "Corrugated cartons for e-commerce fulfilment",
    "Stand-up pouches for snack brand launch",
    "Stretch wrap for logistics hub",
  ],
  "Construction Materials": [
    "Ceramic tiles for residential project",
    "PVC pipes for housing society plumbing",
    "Emulsion paint for commercial renovation",
  ],
  "Health & Beauty": [
    "Surgical scissors for hospital tender",
    "Nitrile gloves — recurring clinic supply",
    "Private-label face cream manufacturing",
  ],
  Agriculture: [
    "Certified wheat seed for upcoming season",
    "NPK fertilizer for cooperative farms",
    "Drip irrigation kits for orchard conversion",
  ],
  "Home & Furniture": [
    "Cookware sets for homeware retailer",
    "Wooden dining chairs — unfinished stock",
    "Bed sheet sets for hotel procurement",
  ],
  Other: [
    "Match footballs for sports retailer",
    "Leather belts wholesale assortment",
    "Team uniform kits for school sports league",
  ],
};

const REVIEW_COMMENTS = {
  good: [
    "Quality matched the sample. Packaging was solid and delivery on time.",
    "Reliable supplier — will reorder. Communication was clear throughout.",
    "Goods arrived in good condition. Pricing was competitive for the volume.",
    "Smooth transaction. Product specs were accurate as described.",
    "Happy with the batch quality. Would recommend to other buyers.",
  ],
  ok: [
    "Decent product overall, but a few units had minor finishing issues.",
    "Delivery was a couple of days late, though quality was acceptable.",
    "Fair value. Communication could be a bit faster on status updates.",
  ],
};

const CHAT_OPENERS = [
  "Hi, are you able to supply this at the MOQ listed?",
  "Interested in placing a bulk order — can you share lead time?",
  "Do you offer custom branding on larger quantities?",
  "Looking for a long-term supplier. Can we discuss pricing?",
];

const CHAT_REPLIES = [
  "Yes, we can fulfil that quantity. Lead time is typically 2–3 weeks.",
  "Thanks for reaching out. Happy to quote and send a sample if needed.",
  "We can do custom branding above 500 units. I'll send a formal offer.",
  "Absolutely — let me prepare a volume offer for you.",
];

const OFFER_NOTES = [
  "Includes free sample pack with first order.",
  "Price locked for 30 days. Freight extra.",
  "Volume discount applied for this quantity.",
  "Ex-works pricing; shipping can be arranged.",
];

const SHIPPING_ADDRESSES = [
  "Shop 12, Anarkali Bazaar, Lahore, Punjab",
  "Warehouse 3, SITE Area, Karachi, Sindh",
  "Plot 18, I-9 Industrial Area, Islamabad",
  "Unit 5, Small Industrial Estate, Sialkot, Punjab",
  "Gulberg III, Main Boulevard, Lahore, Punjab",
  "Saddar Bazaar, Retail Plaza, Karachi, Sindh",
  "Hall Road Electronics Market, Lahore, Punjab",
  "GT Road, Gujranwala Industrial Area, Punjab",
  "Multan Industrial Estate, Multan, Punjab",
  "Hayatabad Industrial Zone, Peshawar, KP",
  "Model Town Link Road, Lahore, Punjab",
  "Clifton Block 5, Karachi, Sindh",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const now = Date.now();
const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000);
const daysAhead = (d) => new Date(now + d * 24 * 60 * 60 * 1000);
const hoursAfter = (date, h) => new Date(new Date(date).getTime() + h * 60 * 60 * 1000);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const round2 = (n) => Math.round(n * 100) / 100;

function pakistaniName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function pakistaniPhone() {
  const prefix = pick(["300", "301", "302", "303", "311", "312", "313", "321", "333", "345"]);
  return `+92 ${prefix} ${randInt(1000000, 9999999)}`;
}

function emailFromName(name, role, index) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${slug}.${role}${index}@demo.vicinity.trade`;
}

function companyNameFromPerson(name, city) {
  const parts = name.split(" ");
  const family = parts[parts.length - 1];
  return `${family} ${pick(COMPANY_SUFFIXES)} — ${city}`;
}

function initialsAvatar(companyName) {
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1e3a5f&color=fff&size=128&bold=true`;
}

/** Build 2–3 decreasing pricing tiers starting at MOQ. */
function buildPricingTiers(moq, basePrice) {
  const tierCount = Math.random() < 0.5 ? 2 : 3;
  const tiers = [];
  let minQty = moq;
  let price = basePrice;

  for (let i = 0; i < tierCount; i++) {
    const isLast = i === tierCount - 1;
    const span = moq * (i === 0 ? 4 : 8);
    const maxQty = isLast ? null : minQty + span - 1;
    tiers.push({
      minQty,
      maxQty,
      pricePerUnit: round2(price),
    });
    if (!isLast) {
      minQty = maxQty + 1;
      price = round2(price * (0.82 + Math.random() * 0.1));
    }
  }
  return tiers;
}

function buildStatusHistory(finalStatus, placedAt) {
  if (finalStatus === "cancelled") {
    return [
      { status: "pending_payment", timestamp: placedAt },
      { status: "cancelled", timestamp: hoursAfter(placedAt, randInt(2, 18)) },
    ];
  }
  const flow = ["pending_payment", "processing", "shipped", "delivered"];
  const end = flow.indexOf(finalStatus);
  return flow.slice(0, end + 1).map((status, i) => ({
    status,
    timestamp: hoursAfter(placedAt, i * randInt(18, 36) + randInt(1, 6)),
  }));
}

/** Preferred categories for sellers by city (Sialkot weighted to sports + surgical). */
function categoriesForCity(city) {
  if (city === "Sialkot") {
    return shuffle(["Health & Beauty", "Other", "Other", "Health & Beauty", "Textiles & Apparel"]);
  }
  if (city === "Faisalabad") {
    return shuffle(["Textiles & Apparel", "Textiles & Apparel", "Packaging", "Home & Furniture"]);
  }
  if (city === "Karachi") {
    return shuffle(["Electronics", "Food & Beverage", "Packaging", "Industrial & Machinery"]);
  }
  if (city === "Lahore") {
    return shuffle(["Home & Furniture", "Electronics", "Food & Beverage", "Packaging", "Textiles & Apparel"]);
  }
  return shuffle([...PRODUCT_CATEGORIES]);
}

async function fetchPexelsImages(query, count = 2) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.warn("  ⚠ PEXELS_API_KEY missing — skipping image fetch");
    return [];
  }
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) {
      console.warn(`  ⚠ Pexels ${res.status} for "${query}" — continuing without images`);
      return [];
    }
    const data = await res.json();
    const photos = Array.isArray(data.photos) ? data.photos : [];
    return photos
      .slice(0, count)
      .map((p) => p.src?.large || p.src?.medium || p.src?.original)
      .filter(Boolean);
  } catch (err) {
    console.warn(`  ⚠ Pexels error for "${query}": ${err.message}`);
    return [];
  }
}

async function clearCollections() {
  console.log("🧹 --reset: clearing all relevant collections…");
  await Promise.all([
    User.deleteMany({}),
    CompanyProfile.deleteMany({}),
    Product.deleteMany({}),
    RFQ.deleteMany({}),
    Quote.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Favorite.deleteMany({}),
  ]);
  console.log("   Cleared.\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  const mongoUri = process.env.MONGO_URI || "";
  if (!mongoUri.includes("localhost") && !mongoUri.includes("127.0.0.1")) {
    console.error(
      "❌ SAFETY ABORT: MONGO_URI must contain 'localhost' or '127.0.0.1'.\n" +
        "   This seed script must never run against a non-local database."
    );
    process.exit(1);
  }

  await connectDB();

  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && !RESET) {
      console.error(
        `❌ User collection already has ${existingUsers} document(s).\n` +
          "   Re-run with --reset to clear and re-seed:\n" +
          "     npm run seed -- --reset\n" +
          "     node scripts/seed.js --reset"
      );
      process.exit(1);
    }

    if (RESET) {
      await clearCollections();
    }

    // =====================================================================
    // 1. USERS — 1 admin, 20 sellers, 20 buyers
    // =====================================================================
    console.log("👤 Creating users (1 admin + 20 sellers + 20 buyers)…");
    const admin = await User.create({
      name: "Platform Admin",
      email: "admin@vicinity.trade",
      password: DEMO_PASSWORD,
      role: "admin",
      phone: "+92 300 0000001",
    });

    const sellers = [];
    const buyers = [];
    const usedEmails = new Set([admin.email]);

    for (let i = 1; i <= 20; i++) {
      let name = pakistaniName();
      let email = emailFromName(name, "seller", i);
      while (usedEmails.has(email)) {
        name = pakistaniName();
        email = emailFromName(name, "seller", i);
      }
      usedEmails.add(email);
      sellers.push(
        await User.create({
          name,
          email,
          password: DEMO_PASSWORD,
          role: "seller",
          phone: pakistaniPhone(),
        })
      );
    }

    for (let i = 1; i <= 20; i++) {
      let name = pakistaniName();
      let email = emailFromName(name, "buyer", i);
      while (usedEmails.has(email)) {
        name = pakistaniName();
        email = emailFromName(name, "buyer", i);
      }
      usedEmails.add(email);
      buyers.push(
        await User.create({
          name,
          email,
          password: DEMO_PASSWORD,
          role: "buyer",
          phone: pakistaniPhone(),
        })
      );
    }

    const userCount = await User.countDocuments();
    console.log(`   ✓ Users saved: ${userCount} (expected 41)\n`);

    // =====================================================================
    // 2. COMPANY PROFILES — one per buyer + seller
    // =====================================================================
    console.log("🏢 Creating company profiles…");
    const sellerCompanies = [];
    const buyerCompanies = [];
    const sellerCategoryMap = new Map(); // sellerId -> preferred categories

    // Verification mix: ~70% approved, ~20% pending, ~10% rejected
    const verifPlan = [
      ...Array(28).fill("approved"),
      ...Array(8).fill("pending"),
      ...Array(4).fill("rejected"),
    ];
    shuffle(verifPlan);

    const allTradeUsers = [
      ...sellers.map((u) => ({ user: u, role: "seller" })),
      ...buyers.map((u) => ({ user: u, role: "buyer" })),
    ];

    for (let i = 0; i < allTradeUsers.length; i++) {
      const { user, role } = allTradeUsers[i];
      const loc = pick(CITIES);
      const status = verifPlan[i];
      const isVerified = status === "approved";
      const preferredCats = categoriesForCity(loc.city);
      if (role === "seller") {
        sellerCategoryMap.set(user._id.toString(), preferredCats);
      }

      const cName = companyNameFromPerson(user.name, loc.city);
      const profile = await CompanyProfile.create({
        userRef: user._id,
        companyName: cName,
        businessType: pick(BUSINESS_TYPES),
        description: faker.lorem.paragraph({ min: 2, max: 4 }).slice(0, 1990),
        location: { city: loc.city, region: loc.region },
        certifications: shuffle(CERT_POOL).slice(0, randInt(1, 3)),
        logoUrl: initialsAvatar(cName),
        isVerified,
        verificationStatus: status,
        verificationDocs:
          status === "pending"
            ? [`/uploads/seed-verification-${user._id}.pdf`]
            : [],
      });

      if (role === "seller") sellerCompanies.push(profile);
      else buyerCompanies.push(profile);
    }

    const companyCount = await CompanyProfile.countDocuments();
    console.log(`   ✓ Company profiles saved: ${companyCount} (expected 40)\n`);

    // =====================================================================
    // 3. PRODUCTS — 60 across sellers & categories
    // =====================================================================
    console.log("📦 Creating products (60) with Pexels images…");
    const products = [];
    const templatesFlat = [];
    for (const cat of PRODUCT_CATEGORIES) {
      for (const t of PRODUCT_TEMPLATES[cat]) {
        templatesFlat.push({ ...t, category: cat });
      }
    }
    // 60 templates available (10 cats × 6); use all
    const productPlan = templatesFlat.slice(0, 60);

    for (let i = 0; i < productPlan.length; i++) {
      const tmpl = productPlan[i];
      // Prefer sellers whose city weights match this category
      let sellerPool = sellers.filter((s) => {
        const cats = sellerCategoryMap.get(s._id.toString()) || [];
        return cats.includes(tmpl.category);
      });
      if (sellerPool.length === 0) sellerPool = sellers;
      const seller = sellerPool[i % sellerPool.length];

      const moq = randInt(tmpl.moq[0], tmpl.moq[1]);
      const basePrice = round2(
        tmpl.price[0] + Math.random() * (tmpl.price[1] - tmpl.price[0])
      );

      const imageCount = Math.random() < 0.55 ? 2 : 1;
      const images = await fetchPexelsImages(tmpl.query, imageCount);
      await sleep(250); // rate-limit courtesy delay

      const product = await Product.create({
        sellerRef: seller._id,
        title: tmpl.title,
        description: tmpl.desc,
        category: tmpl.category,
        images,
        moq,
        pricingTiers: buildPricingTiers(moq, basePrice),
        stockStatus: pick(["in_stock", "in_stock", "in_stock", "low_stock", "out_of_stock"]),
        isActive: true,
      });
      products.push(product);

      if ((i + 1) % 10 === 0) {
        console.log(`   … ${i + 1}/60 products`);
      }
    }

    const productCount = await Product.countDocuments();
    console.log(`   ✓ Products saved: ${productCount} (expected 60)\n`);

    // =====================================================================
    // 4. RFQs — 25 from buyers
    // =====================================================================
    console.log("📝 Creating RFQs (25)…");
    const rfqs = [];
    const rfqCategories = [];
    for (let i = 0; i < 25; i++) {
      rfqCategories.push(PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length]);
    }
    shuffle(rfqCategories);

    for (let i = 0; i < 25; i++) {
      const category = rfqCategories[i];
      const buyer = buyers[i % buyers.length];
      const titles = RFQ_TITLES[category];
      const title = titles[i % titles.length];
      const isClosed = i < 8; // first 8 closed (past deadline); rest open
      const quantityNeeded = randInt(50, 5000);
      const targetPrice = round2(randInt(1, 80) + Math.random());

      const rfq = await RFQ.create({
        buyerRef: buyer._id,
        title,
        description: `Seeking reliable suppliers for: ${title}. ${faker.lorem.sentence()} Specs and packaging requirements can be shared after initial quotes.`,
        category,
        quantityNeeded,
        targetPrice,
        deadline: isClosed ? daysAgo(randInt(1, 20)) : daysAhead(randInt(5, 45)),
        status: isClosed ? "closed" : "open",
      });
      rfqs.push(rfq);
    }

    const rfqCount = await RFQ.countDocuments();
    console.log(`   ✓ RFQs saved: ${rfqCount} (expected 25)\n`);

    // =====================================================================
    // 5. QUOTES — 2–4 per RFQ; ~half of RFQs get one accepted
    // =====================================================================
    console.log("💬 Creating quotes…");
    const quotes = [];
    const acceptedQuoteByRfq = new Map();
    const rfqsToAccept = new Set(
      shuffle(rfqs.map((r) => r._id.toString())).slice(0, 13)
    );

    for (const rfq of rfqs) {
      const quoteCount = randInt(2, 4);
      const sellerCandidates = shuffle(
        sellers.filter((s) => {
          const cats = sellerCategoryMap.get(s._id.toString()) || [];
          return cats.includes(rfq.category);
        })
      );
      const pool = (sellerCandidates.length >= quoteCount
        ? sellerCandidates
        : shuffle(sellers)
      ).slice(0, quoteCount);

      let acceptedIdx = -1;
      if (rfqsToAccept.has(rfq._id.toString())) {
        acceptedIdx = 0;
        // Ensure RFQ is closed when a quote is accepted (marketplace flow)
        if (rfq.status !== "closed") {
          rfq.status = "closed";
          await rfq.save();
        }
      }

      for (let qi = 0; qi < pool.length; qi++) {
        const seller = pool[qi];
        let status = "submitted";
        if (qi === acceptedIdx) status = "accepted";
        else if (acceptedIdx >= 0 && qi === 1 && Math.random() < 0.4) {
          status = "rejected";
        }

        const base = rfq.targetPrice || randInt(2, 50);
        const pricePerUnit = round2(base * (0.85 + Math.random() * 0.35));

        const quote = await Quote.create({
          rfqRef: rfq._id,
          sellerRef: seller._id,
          pricePerUnit,
          message: pick([
            "We can meet your specs and timeline. Sample available on request.",
            "Competitive pricing for this volume. Happy to discuss MOQ flexibility.",
            "Ready to ship from our warehouse. Quality guaranteed.",
            "Long-term supply agreement possible if volumes are consistent.",
          ]),
          deliveryEstimate: pick([
            "1 week",
            "2 weeks",
            "3 weeks",
            "4 weeks",
            "10–14 days",
            "Monthly supply",
          ]),
          status,
        });
        quotes.push(quote);
        if (status === "accepted") {
          acceptedQuoteByRfq.set(rfq._id.toString(), quote);
        }
      }
    }

    const quoteCount = await Quote.countDocuments();
    console.log(
      `   ✓ Quotes saved: ${quoteCount} (${acceptedQuoteByRfq.size} accepted)\n`
    );

    // =====================================================================
    // 6. ORDERS — 30 across lifecycle; ≥12–15 delivered
    // =====================================================================
    console.log("🧾 Creating orders (30)…");
    const statusPlan = [
      ...Array(4).fill("pending_payment"),
      ...Array(5).fill("processing"),
      ...Array(5).fill("shipped"),
      ...Array(14).fill("delivered"),
      ...Array(2).fill("cancelled"),
    ];
    shuffle(statusPlan);

    const acceptedEntries = [...acceptedQuoteByRfq.entries()];
    const orderDocs = [];

    for (let i = 0; i < 30; i++) {
      const status = statusPlan[i];
      const placedAt = daysAgo(randInt(1, 45));
      const fromQuote = i < 12 && acceptedEntries[i];

      let buyer;
      let seller;
      let productRef = null;
      let rfqRef = null;
      let quantity;
      let price;

      if (fromQuote) {
        const [rfqId, quote] = fromQuote;
        const rfq = rfqs.find((r) => r._id.toString() === rfqId);
        buyer = buyers.find((b) => b._id.toString() === rfq.buyerRef.toString());
        seller = sellers.find((s) => s._id.toString() === quote.sellerRef.toString());
        rfqRef = rfq._id;
        quantity = rfq.quantityNeeded;
        price = quote.pricePerUnit;
      } else {
        const product = products[i % products.length];
        seller = sellers.find((s) => s._id.toString() === product.sellerRef.toString());
        buyer = buyers[i % buyers.length];
        // Avoid buyer ordering from themselves (N/A) — just pick another if same
        if (buyer._id.toString() === seller._id.toString()) {
          buyer = buyers[(i + 1) % buyers.length];
        }
        productRef = product._id;
        const tier = product.pricingTiers[0];
        quantity = tier.minQty * randInt(1, 3);
        price = tier.pricePerUnit;
      }

      const paymentStatus =
        status === "delivered"
          ? pick(["paid", "paid", "pending"])
          : status === "cancelled"
            ? "pending"
            : "pending";

      orderDocs.push({
        buyerRef: buyer._id,
        sellerRef: seller._id,
        productRef,
        rfqRef,
        quantity,
        agreedPricePerUnit: price,
        totalAmount: round2(price * quantity),
        status,
        paymentMethod: "cod",
        paymentStatus,
        shippingAddress: pick(SHIPPING_ADDRESSES),
        statusHistory: buildStatusHistory(status, placedAt),
        createdAt: placedAt,
        updatedAt: hoursAfter(placedAt, randInt(1, 72)),
      });
    }

    const orders = await Order.insertMany(orderDocs, { timestamps: false });
    const orderCount = await Order.countDocuments();
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    console.log(
      `   ✓ Orders saved: ${orderCount} (${deliveredOrders.length} delivered)\n`
    );

    // =====================================================================
    // 7. REVIEWS — one per delivered order
    // =====================================================================
    console.log("⭐ Creating reviews for delivered orders…");
    const reviewDocs = deliveredOrders.map((order, idx) => {
      const isOk = idx < 3; // a couple of 3-star-ish reviews
      const ratings = isOk
        ? {
            productQuality: 3,
            onTimeDelivery: pick([3, 4]),
            communication: pick([3, 4]),
          }
        : {
            productQuality: pick([4, 5, 5]),
            onTimeDelivery: pick([4, 5, 5]),
            communication: pick([4, 5]),
          };
      return {
        orderRef: order._id,
        buyerRef: order.buyerRef,
        sellerRef: order.sellerRef,
        ratings,
        comment: isOk ? pick(REVIEW_COMMENTS.ok) : pick(REVIEW_COMMENTS.good),
      };
    });

    await Review.insertMany(reviewDocs);
    const reviewCount = await Review.countDocuments();
    console.log(`   ✓ Reviews saved: ${reviewCount}\n`);

    // =====================================================================
    // 8. CONVERSATIONS + MESSAGES — 15 threads, 4–8 msgs, ≥1 offer each
    // =====================================================================
    console.log("🗨️  Creating conversations & messages…");
    let messageTotal = 0;
    const conversations = [];

    for (let i = 0; i < 15; i++) {
      const useProduct = i % 2 === 0;
      let buyer;
      let seller;
      let contextType;
      let contextRef;

      if (useProduct) {
        const product = products[i % products.length];
        seller = sellers.find((s) => s._id.toString() === product.sellerRef.toString());
        buyer = buyers[i % buyers.length];
        contextType = "product";
        contextRef = product._id;
      } else {
        const rfq = rfqs[i % rfqs.length];
        buyer = buyers.find((b) => b._id.toString() === rfq.buyerRef.toString());
        const matchingQuote = quotes.find(
          (q) => q.rfqRef.toString() === rfq._id.toString()
        );
        seller = matchingQuote
          ? sellers.find((s) => s._id.toString() === matchingQuote.sellerRef.toString())
          : sellers[i % sellers.length];
        contextType = "rfq";
        contextRef = rfq._id;
      }

      const msgCount = randInt(4, 8);
      const startAt = daysAgo(randInt(2, 20));
      const convo = await Conversation.create({
        participants: [buyer._id, seller._id],
        contextType,
        contextRef,
        lastMessageAt: hoursAfter(startAt, msgCount * 3),
      });
      conversations.push(convo);

      const msgs = [];
      // Opening exchange
      msgs.push({
        conversationRef: convo._id,
        senderRef: buyer._id,
        text: pick(CHAT_OPENERS),
        type: "text",
        readBy: [buyer._id, seller._id],
        createdAt: startAt,
      });
      msgs.push({
        conversationRef: convo._id,
        senderRef: seller._id,
        text: pick(CHAT_REPLIES),
        type: "text",
        readBy: [seller._id, buyer._id],
        createdAt: hoursAfter(startAt, 2),
      });

      // Extra text turns
      const extraTexts = msgCount - 3; // reserve 1 for offer
      for (let m = 0; m < Math.max(0, extraTexts); m++) {
        const fromBuyer = m % 2 === 0;
        msgs.push({
          conversationRef: convo._id,
          senderRef: fromBuyer ? buyer._id : seller._id,
          text: fromBuyer
            ? pick([
                "What is your best price for a larger quantity?",
                "Can you confirm stock availability this month?",
                "Please share payment and shipping terms.",
              ])
            : pick([
                "Yes, stock is available. We can ship within the week.",
                "COD is supported nationwide via our logistics partners.",
                "I'll prepare a custom offer with the volume discount.",
              ]),
          type: "text",
          readBy: fromBuyer ? [buyer._id] : [seller._id, buyer._id],
          createdAt: hoursAfter(startAt, 4 + m * 3),
        });
      }

      // Custom offer from seller
      const relatedProduct = useProduct
        ? products[i % products.length]
        : products.find((p) => p.category === (rfqs[i % rfqs.length]?.category)) ||
          products[0];
      const offerQty = relatedProduct.moq * randInt(1, 4);
      const offerPrice = round2(
        relatedProduct.pricingTiers[0].pricePerUnit * (0.9 + Math.random() * 0.1)
      );

      msgs.push({
        conversationRef: convo._id,
        senderRef: seller._id,
        text: "Here's a formal offer for your consideration.",
        type: "offer",
        offerDetails: {
          pricePerUnit: offerPrice,
          quantity: offerQty,
          notes: pick(OFFER_NOTES),
        },
        readBy: [seller._id],
        createdAt: hoursAfter(startAt, msgCount * 3),
      });

      await Message.insertMany(msgs, { timestamps: false });
      messageTotal += msgs.length;
    }

    const convoCount = await Conversation.countDocuments();
    const msgCountDb = await Message.countDocuments();
    console.log(
      `   ✓ Conversations: ${convoCount}, Messages: ${msgCountDb} (offers included)\n`
    );

    // =====================================================================
    // 9. NOTIFICATIONS — activity-based mix of read/unread
    // =====================================================================
    console.log("🔔 Creating notifications…");
    const notifDocs = [];

    for (const quote of quotes.slice(0, 40)) {
      const rfq = rfqs.find((r) => r._id.toString() === quote.rfqRef.toString());
      if (!rfq) continue;
      notifDocs.push({
        userRef: rfq.buyerRef,
        type: "new_quote",
        message: `New quote received on "${rfq.title}"`,
        linkTo: `/rfqs/${rfq._id}`,
        isRead: Math.random() < 0.45,
        createdAt: daysAgo(randInt(0, 15)),
      });
    }

    for (const order of orders) {
      notifDocs.push({
        userRef: order.buyerRef,
        type: "order_status_change",
        message: `Your order is now ${order.status.replace(/_/g, " ")}`,
        linkTo: `/orders/${order._id}`,
        isRead: order.status === "delivered" ? Math.random() < 0.7 : Math.random() < 0.35,
        createdAt: order.statusHistory?.[order.statusHistory.length - 1]?.timestamp || order.createdAt,
      });
      notifDocs.push({
        userRef: order.sellerRef,
        type: "order_status_change",
        message: `Order updated to ${order.status.replace(/_/g, " ")}`,
        linkTo: `/orders/${order._id}`,
        isRead: Math.random() < 0.5,
        createdAt: order.createdAt,
      });
    }

    for (const convo of conversations) {
      const recipient = convo.participants[0];
      notifDocs.push({
        userRef: recipient,
        type: "new_message",
        message: "You have a new message in your inbox",
        linkTo: `/chat/${convo._id}`,
        isRead: Math.random() < 0.4,
        createdAt: convo.lastMessageAt,
      });
    }

    for (const rfq of rfqs.filter((r) => r.status === "open").slice(0, 15)) {
      const seller = sellers[randInt(0, sellers.length - 1)];
      notifDocs.push({
        userRef: seller._id,
        type: "rfq_response",
        message: `New RFQ in your category: "${rfq.title}"`,
        linkTo: `/rfqs/${rfq._id}`,
        isRead: Math.random() < 0.3,
        createdAt: rfq.createdAt,
      });
    }

    await Notification.insertMany(notifDocs, { timestamps: false });
    const notifCount = await Notification.countDocuments();
    console.log(`   ✓ Notifications saved: ${notifCount}\n`);

    // =====================================================================
    // 10. FAVORITES — each buyer favorites 2–5 products/companies
    // =====================================================================
    console.log("❤️  Creating favorites…");
    const favDocs = [];
    const favKeys = new Set();

    for (const buyer of buyers) {
      const count = randInt(2, 5);
      for (let f = 0; f < count; f++) {
        const asProduct = Math.random() < 0.6;
        if (asProduct) {
          const product = pick(products);
          const key = `${buyer._id}-product-${product._id}`;
          if (favKeys.has(key)) continue;
          favKeys.add(key);
          favDocs.push({
            userRef: buyer._id,
            itemType: "product",
            itemRef: product._id,
          });
        } else {
          const company = pick(sellerCompanies);
          const key = `${buyer._id}-company-${company._id}`;
          if (favKeys.has(key)) continue;
          favKeys.add(key);
          favDocs.push({
            userRef: buyer._id,
            itemType: "company",
            itemRef: company._id,
          });
        }
      }
    }

    await Favorite.insertMany(favDocs);
    const favCount = await Favorite.countDocuments();
    console.log(`   ✓ Favorites saved: ${favCount}\n`);

    // =====================================================================
    // Summary
    // =====================================================================
    const counts = {
      users: await User.countDocuments(),
      companies: await CompanyProfile.countDocuments(),
      products: await Product.countDocuments(),
      rfqs: await RFQ.countDocuments(),
      quotes: await Quote.countDocuments(),
      orders: await Order.countDocuments(),
      reviews: await Review.countDocuments(),
      conversations: await Conversation.countDocuments(),
      messages: await Message.countDocuments(),
      notifications: await Notification.countDocuments(),
      favorites: await Favorite.countDocuments(),
    };

    console.log("✅ Seed complete — collection counts:");
    console.table(counts);

    console.log("\n🔑 Demo login credentials (password for ALL: Demo@1234)\n");
    console.log("  Admin:");
    console.log(`    ${admin.email}`);
    console.log("\n  Sample buyers:");
    buyers.slice(0, 3).forEach((b) => console.log(`    ${b.email}  (${b.name})`));
    console.log("\n  Sample sellers:");
    sellers.slice(0, 3).forEach((s) => console.log(`    ${s.email}  (${s.name})`));
    console.log(
      "\n  Note: categories use the schema enum in Product.js\n" +
        `  (${PRODUCT_CATEGORIES.join(", ")}).\n` +
        "  Sialkot sellers are weighted toward Health & Beauty (surgical)\n" +
        "  and Other (sports/leather goods).\n"
    );
  } catch (error) {
    console.error(`❌ Seed failed: ${error.message}`);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

seed();
