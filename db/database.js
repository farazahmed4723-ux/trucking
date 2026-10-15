const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const isVercel = !!process.env.VERCEL;

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  console.warn('[DB_WARN] Native node:sqlite not available on this Node runtime:', e.message);
}

// In Vercel serverless functions, only /tmp is writable.
const DB_DIR = isVercel ? '/tmp' : (process.env.DB_DIR || path.join(__dirname, '..', 'data'));
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    console.warn('[DB_WARN] Could not create DB_DIR, falling back to /tmp:', err.message);
  }
}

const DB_FILE = isVercel ? path.join('/tmp', 'spn_trucking.db') : (process.env.DB_PATH || path.join(DB_DIR, 'spn_trucking.db'));

let db;
if (DatabaseSync) {
  db = new DatabaseSync(DB_FILE);
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // WAL mode pragma fallback for memory/restricted filesystems
  }
} else {
  // Resilient memory mock if running on older node without native sqlite
  const memoryStore = {
    settings: new Map(),
    services: [],
    fleet: [],
    promos: [],
    quotes: [],
    reviews: [],
    admin: null
  };
  db = {
    exec: (sql) => {},
    prepare: (sql) => ({
      get: (...args) => null,
      all: (...args) => [],
      run: (...args) => ({ changes: 1, lastInsertRowid: Date.now() })
    })
  };
}

// Initialize schema
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }
  seedDefaults();
}

// Seed initial default configurations and administrative accounts
function seedDefaults() {
  // Check if admin user exists
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASS || 'SPNAdmin2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);

    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `);
    insertAdmin.run('admin', hash, 'Abbas (Managing Director)', 'superadmin');
    console.log('[DB] Seeded default administrator account: admin');
  }

  // Seed default site settings if empty
  const defaultSettings = [
    { key: 'company_name', value: 'SPN Trucking Ltd.', desc: 'Official registered legal name' },
    { key: 'contact_person', value: 'Abbas', desc: 'Managing Director' },
    { key: 'contact_phone', value: '778-302-8803', desc: 'Primary dispatch and customer line' },
    { key: 'contact_email', value: 'stntruckingltd@gmail.com', desc: 'Official business inquiries email' },
    { key: 'target_market', value: 'Calgary, Alberta, Canada', desc: 'Primary core operational target' },
    { key: 'secondary_market', value: 'Lower Mainland & BC Corridor (Linehaul by inquiry)', desc: 'Secondary corridor connection' },
    { key: 'experience_years', value: '5+', desc: 'Industry experience of Managing Director Abbas' },
    { key: 'experience_verified', value: 'pending_owner_review', desc: 'Status of 5+ years claim verification' },
    { key: 'domain_name', value: 'https://spntrucking.ca', desc: 'Configurable production domain' },
    { key: 'hero_headline', value: 'Your Load. Your Destination. We Deliver.', desc: 'Exact hero headline' },
    { key: 'hero_supporting', value: 'From Small Loads to Long Hauls, We Handle Your Moving, Hauling and Transportation Needs Across Calgary and Beyond.', desc: 'Exact hero supporting copy' }
  ];

  const checkSetting = db.prepare('SELECT key FROM site_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO site_settings (key, value, description) VALUES (?, ?, ?)');

  for (const s of defaultSettings) {
    if (!checkSetting.get(s.key)) {
      insertSetting.run(s.key, s.value, s.desc);
    }
  }

  // Seed default core services
  const defaultServices = [
    { slug: 'residential-moving', title: 'Residential Moving', category: 'Moving', short_desc: 'Apartment, condo, and detached home moving across Calgary with protective blankets and floor guards.', icon: '🏠', order: 1 },
    { slug: 'commercial-moving', title: 'Commercial Moving', category: 'Moving', short_desc: 'Office and retail relocations in Calgary scheduled to minimize business downtime.', icon: '🏢', order: 2 },
    { slug: 'industrial-moving', title: 'Industrial Moving', category: 'Moving', short_desc: 'Heavy workshop tools, light industrial equipment, and warehouse relocation across Calgary.', icon: '⚙️', order: 3 },
    { slug: 'small-load-transportation', title: 'Small Load Transportation', category: 'Transportation', short_desc: 'Expedited small freight, pallet deliveries, and store pickups across Calgary metro.', icon: '📦', order: 4 },
    { slug: 'junk-removal', title: 'Junk Removal', category: 'Hauling', short_desc: 'Full-service household, estate, and garage junk clearance with eco-friendly disposal.', icon: '🗑️', order: 5 },
    { slug: 'garbage-removal', title: 'Garbage Removal', category: 'Hauling', short_desc: 'Prompt garbage carting and renovation debris hauling to certified Calgary facilities.', icon: '♻️', order: 6 },
    { slug: 'trucking', title: 'Long-Haul & Regional Trucking', category: 'Transportation', short_desc: 'Commercial freight and dedicated transport across Alberta and western corridors up to 53 ft.', icon: '🚛', order: 7 },
    { slug: 'flatbed-trucking', title: 'Flatbed Trucking', category: 'Transportation', short_desc: 'Open-deck transport for machinery, building supplies, and over-dimension cargo.', icon: '🚚', order: 8 },
    { slug: 'refrigerated-trucking', title: 'Refrigerated & Insulated', category: 'Transportation', short_desc: 'Temperature-monitored reefer freight and insulated dry-van protection (subject to confirmation).', icon: '❄️', order: 9 },
    { slug: 'beverage-transportation', title: 'Beverage Transportation', category: 'Transportation', short_desc: 'Palletized beverage and hospitality freight handling throughout Calgary and regional routes.', icon: '🥤', order: 10 },
    { slug: 'gardening', title: 'Gardening & Yard Cleanup', category: 'Property', short_desc: 'Seasonal property revitalization, hedge trimming, and green waste carting.', icon: '🌿', order: 11 },
    { slug: 'tool-services', title: 'Tools & Equipment Rental', category: 'Property', short_desc: 'Heavy-duty moving ramps, appliance dollies, and specialty equipment supply.', icon: '🔧', order: 12 }
  ];

  const checkService = db.prepare('SELECT id FROM services WHERE slug = ?');
  const insertService = db.prepare(`
    INSERT INTO services (slug, title, category, short_desc, icon, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const s of defaultServices) {
    if (!checkService.get(s.slug)) {
      insertService.run(s.slug, s.title, s.category, s.short_desc, s.icon, s.order);
    }
  }

  // Seed default truck fleet
  const defaultFleet = [
    {
      slug: 'light-cutaway-10-15',
      name: "10' – 15' Agile Urban Cutaway",
      size_range: "10' – 15' Box",
      payload_capacity: "2,500 – 4,000 lbs",
      dimensions: "10-15'L x 6.5'W x 7'H",
      description: "Nimble city cutaways perfect for 1-bedroom Calgary apartments, tight residential lanes, and fast junk hauls.",
      image_url: "assets/moving-service-city.jpg",
      order: 1
    },
    {
      slug: 'insulated-box-16-24',
      name: "16' – 24' Insulated Box Truck",
      size_range: "16' – 24' Box",
      payload_capacity: "5,000 – 10,000 lbs",
      dimensions: "16-24'L x 8'W x 8'H",
      description: "Insulated cargo body protecting household furniture and sensitive commercial merchandise from Alberta seasonal cold.",
      image_url: "assets/commercial-moving.jpg",
      order: 2
    },
    {
      slug: 'flatbed-transport',
      name: "Flatbed Truck & Trailer",
      size_range: "20' – 40' Deck",
      payload_capacity: "Up to 25,000 lbs",
      dimensions: "Open deck configuration",
      description: "Specialized open-deck platform for construction materials, crated machinery, palletized supplies, and side-loading cargo.",
      image_url: "assets/fleet-commercial.jpg",
      order: 3
    },
    {
      slug: 'highway-reefer-semi-53',
      name: "53' Highway Reefer & Dry Van",
      size_range: "53' Semi-Trailer",
      payload_capacity: "Up to 45,000 lbs",
      dimensions: "53'L x 8.5'W x 9'H",
      description: "Full truckload (FTL) highway linehaul between Alberta, British Columbia, and Western Canadian distribution corridors.",
      image_url: "assets/moving-truck-highway.jpg",
      order: 4
    }
  ];

  const checkFleet = db.prepare('SELECT id FROM truck_fleet WHERE slug = ?');
  const insertFleet = db.prepare(`
    INSERT INTO truck_fleet (slug, name, size_range, payload_capacity, dimensions, description, image_url, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of defaultFleet) {
    if (!checkFleet.get(f.slug)) {
      insertFleet.run(f.slug, f.name, f.size_range, f.payload_capacity, f.dimensions, f.description, f.image_url, f.order);
    }
  }

  // Seed promotions
  const defaultPromos = [
    {
      code: 'STUDENT10',
      name: '10% Calgary Student Discount',
      discount_percent: 10,
      description: '10% off residential moving and junk removal for enrolled students at U of C, MRU, SAIT, Bow Valley College with valid student card.',
      terms: 'Valid post-secondary student ID required upon booking confirmation. Cannot be combined with holiday promotional rates. One discount per job.'
    },
    {
      code: 'HOLIDAY10',
      name: '10% Canadian Statutory Holiday Discount',
      discount_percent: 10,
      description: '10% promotional rate on bookings scheduled during eligible Canadian and Alberta statutory holiday booking windows.',
      terms: 'Applies to qualifying residential and commercial moves. Single discount policy applies.'
    }
  ];

  const checkPromo = db.prepare('SELECT id FROM promotions WHERE code = ?');
  const insertPromo = db.prepare(`
    INSERT INTO promotions (code, name, discount_percent, description, terms)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const p of defaultPromos) {
    if (!checkPromo.get(p.code)) {
      insertPromo.run(p.code, p.name, p.discount_percent, p.description, p.terms);
    }
  }
}

// Generate unique sequential reference number: SPN-YEAR-XXXX
function generateQuoteRef() {
  const currentYear = new Date().getFullYear();
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM quotes 
    WHERE ref_id LIKE ?
  `).get(`SPN-${currentYear}-%`);

  const nextNum = (countRow ? countRow.count : 0) + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `SPN-${currentYear}-${padded}`;
}

// Helper: Log audit trail action
function logAudit(quoteId, action, performedBy, details) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (quote_id, action, performed_by, details)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(quoteId || null, action, performedBy || 'SYSTEM', details ? JSON.stringify(details) : null);
  } catch (err) {
    console.error('[AUDIT_ERROR]', err.message);
  }
}

// Initialize on require
initSchema();

module.exports = {
  db,
  generateQuoteRef,
  logAudit,
  initSchema
};
