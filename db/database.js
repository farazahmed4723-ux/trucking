const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const isVercel = !!process.env.VERCEL;

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  throw new Error('[DB_FATAL] Native node:sqlite is required. Please ensure Node.js is set to v22.x or later.');
}

// In Vercel serverless functions, only /tmp is writable. In local/container environments, use data/ directory.
const DB_DIR = isVercel ? '/tmp' : (process.env.DB_DIR || path.join(__dirname, '..', 'data'));
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = isVercel ? path.join('/tmp', 'spn_trucking.db') : (process.env.DB_PATH || path.join(DB_DIR, 'spn_trucking.db'));
const db = new DatabaseSync(DB_FILE);

try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  // WAL mode fallback for environments that disallow WAL on /tmp
}

// Safe schema migration helper
function applyMigrations() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Ensure newer columns exist in services table if migrating from previous version
  try {
    db.exec('ALTER TABLE services ADD COLUMN image_url TEXT;');
  } catch (e) { /* column already exists */ }
  try {
    db.exec('ALTER TABLE services ADD COLUMN service_area TEXT;');
  } catch (e) { /* column already exists */ }
  try {
    db.exec('ALTER TABLE services ADD COLUMN confirmation_note TEXT;');
  } catch (e) { /* column already exists */ }
}

// Initialize schema
function initSchema() {
  applyMigrations();
  seedDefaults();
}

// Seed initial default configurations and administrative accounts
function seedDefaults() {
  // Check if admin user exists
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASS || 'STNAdmin2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);

    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `);
    insertAdmin.run('admin', hash, 'Abbas (Managing Director)', 'superadmin');
    console.log('[DB] Seeded default administrator account: admin');
  }

  // Seed / update verified British Columbia site settings
  const bcSettings = [
    { key: 'company_name', value: 'STN Trucking Ltd.', desc: 'Official registered legal name' },
    { key: 'contact_person', value: 'Abbas', desc: 'Managing Director' },
    { key: 'contact_phone', value: '778-302-8803', desc: 'Primary dispatch and customer line' },
    { key: 'contact_email', value: 'stntruckingltd@gmail.com', desc: 'Official business inquiries email' },
    { key: 'target_market', value: 'Surrey & Vancouver, British Columbia, Canada', desc: 'Primary core operational target' },
    { key: 'secondary_market', value: 'Lower Mainland & BC Corridor (Linehaul by confirmed inquiry)', desc: 'Secondary corridor connection' },
    { key: 'experience_years', value: '5+', desc: 'Industry experience of Managing Director Abbas' },
    { key: 'experience_verified', value: 'verified', desc: 'Status of 5+ years claim verification' },
    { key: 'domain_name', value: 'https://spntrucking.ca', desc: 'Configurable production domain' },
    { key: 'hero_headline', value: 'Your Load. Your Destination. We Deliver.', desc: 'Exact hero headline' },
    { key: 'hero_supporting', value: 'From Small Loads to Long Hauls, We Handle Your Moving, Hauling and Transportation Needs Across Surrey, Vancouver, the Lower Mainland and Beyond.', desc: 'Exact hero supporting copy' },
    { key: 'primary_cities', value: 'Surrey, Vancouver, Burnaby, Richmond, Langley, Delta, Coquitlam, New Westminster, Abbotsford', desc: 'Active Lower Mainland service municipalities' }
  ];

  const upsertSetting = db.prepare(`
    INSERT INTO site_settings (key, value, description, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = excluded.description, updated_at = CURRENT_TIMESTAMP
  `);

  for (const s of bcSettings) {
    upsertSetting.run(s.key, s.value, s.desc);
  }

  // Seed verified services with Surrey, Vancouver, Lower Mainland service descriptions and images
  const defaultServices = [
    {
      slug: 'flatbed-trucking',
      title: 'Flatbed Trucking',
      category: 'Transportation',
      short_desc: 'Medium & heavy-duty flatbed transport for construction materials, equipment, and jobsite freight across Surrey, Vancouver, and the Lower Mainland.',
      icon: '🚚',
      image_url: 'assets/fleet/fleet_flatbed_truck.jpg',
      service_area: 'Surrey, Vancouver, Lower Mainland & Highway Corridors',
      confirmation_note: 'Standard dispatch; over-dimension loads confirmed with dispatch.',
      order: 1
    },
    {
      slug: 'small-load-transportation',
      title: 'Small Load Transportation',
      category: 'Transportation',
      short_desc: 'Compact 10 ft to 15 ft trucks for furniture, appliances, store deliveries, and small residential and commercial deliveries across Surrey & Vancouver metro.',
      icon: '📦',
      image_url: 'assets/fleet/fleet_10ft_truck.jpg',
      service_area: 'Surrey, Vancouver, Burnaby, Richmond, Langley, Delta',
      confirmation_note: 'Daily dispatch available.',
      order: 2
    },
    {
      slug: 'trucking',
      title: 'Long-Haul Transportation (53\')',
      category: 'Transportation',
      short_desc: 'Highway tractor-trailers and dry van box trailers up to 53 ft for long-distance regional and inter-provincial freight transport across BC and beyond.',
      icon: '🚛',
      image_url: 'assets/fleet/fleet_53ft_long_haul.jpg',
      service_area: 'British Columbia Highway Corridors & Beyond',
      confirmation_note: 'Scheduled linehaul based on equipment availability.',
      order: 3
    },
    {
      slug: 'refrigerated-trucking',
      title: 'Insulated & Refrigerated Transportation',
      category: 'Transportation',
      short_desc: 'Insulated box trucks and refrigerated units for temperature-sensitive cargo, produce, and specialty cold-chain freight.',
      icon: '❄️',
      image_url: 'assets/fleet/fleet_refrigerated_truck.jpg',
      service_area: 'Lower Mainland & Dedicated BC Corridors',
      confirmation_note: 'Only scheduled upon direct business confirmation of unit availability.',
      order: 4
    },
    {
      slug: 'beverage-transportation',
      title: 'Beverage Transportation',
      category: 'Transportation',
      short_desc: 'Palletized beverage deliveries, wholesale distribution, and commercial keg/can transportation for Lower Mainland producers.',
      icon: '🥤',
      image_url: 'assets/fleet/fleet_beverage_transport.jpg',
      service_area: 'Surrey, Vancouver & Fraser Valley Distribution Routes',
      confirmation_note: 'Commercial freight scheduled after business route confirmation.',
      order: 5
    },
    {
      slug: 'junk-removal',
      title: 'Junk Removal',
      category: 'Hauling',
      short_desc: 'Full-service pickup and dump-body collection for household junk, furniture, mattresses, renovation debris, and garage or estate cleanouts.',
      icon: '🗑️',
      image_url: 'assets/fleet/fleet_junk_removal_truck.jpg',
      service_area: 'Surrey, Vancouver, Langley, Delta, Richmond & Metro Area',
      confirmation_note: 'Prompt dispatch with eco-friendly recycling & donation sorting.',
      order: 6
    },
    {
      slug: 'garbage-removal',
      title: 'Garbage Removal',
      category: 'Hauling',
      short_desc: 'Authorized residential and commercial waste collection, renovation scrap, and construction disposal carting to certified Lower Mainland facilities.',
      icon: '♻️',
      image_url: 'assets/fleet/fleet_garbage_removal.jpg',
      service_area: 'Surrey, Vancouver & Lower Mainland Approved Facilities',
      confirmation_note: 'Provided strictly within authorized municipal disposal categories.',
      order: 7
    },
    {
      slug: 'residential-moving',
      title: 'Residential Moving',
      category: 'Moving',
      short_desc: 'Full-service house, apartment, and condo moving with moving blankets, dollies, cargo straps, and careful loading across Surrey and Vancouver.',
      icon: '🏠',
      image_url: 'assets/fleet/fleet_residential_moving.jpg',
      service_area: 'Surrey, Vancouver, Burnaby, Richmond, Langley, Delta & Tri-Cities',
      confirmation_note: 'Transparent hourly or flat rates; 10% student discount eligible.',
      order: 8
    },
    {
      slug: 'commercial-moving',
      title: 'Commercial Moving',
      category: 'Moving',
      short_desc: 'Office relocations, retail store transfers, workstation transport, and systematic setup scheduled to minimize downtime for BC businesses.',
      icon: '🏢',
      image_url: 'assets/fleet/fleet_commercial_moving.jpg',
      service_area: 'Surrey, Vancouver, Burnaby & Lower Mainland Business Hubs',
      confirmation_note: 'Flexible evening and weekend scheduling available.',
      order: 9
    },
    {
      slug: 'industrial-moving',
      title: 'Industrial Moving',
      category: 'Moving',
      short_desc: 'Flatbed equipment transportation, workshop tool transfers, warehouse machinery, and light industrial equipment logistics across BC.',
      icon: '⚙️',
      image_url: 'assets/fleet/fleet_industrial_moving.jpg',
      service_area: 'Lower Mainland Industrial Parks & BC Corridors',
      confirmation_note: 'Scheduled subject to rigging & heavy equipment confirmation.',
      order: 10
    },
    {
      slug: 'gardening',
      title: 'Gardening & Yard Cleanup',
      category: 'Property',
      short_desc: 'Seasonal cleanup, yard waste collection, fallen tree branches, hedge trimmings, leaves, and green waste property clearing in Surrey & Vancouver.',
      icon: '🌿',
      image_url: 'assets/fleet/fleet_gardening_yard_cleanup.jpg',
      service_area: 'Surrey, Vancouver, Delta, Langley & Lower Mainland',
      confirmation_note: 'Prompt carting to organic green waste composting facilities.',
      order: 11
    },
    {
      slug: 'tool-services',
      title: 'Tools & Equipment Supply',
      category: 'Property',
      short_desc: 'Professional equipment supply including heavy-duty dollies, moving ramps, straps, and project maintenance gear.',
      icon: '🔧',
      image_url: 'assets/fleet/fleet_tools_equipment.jpg',
      service_area: 'Surrey, Vancouver & Lower Mainland Dispatch',
      confirmation_note: 'Supplied with move/cleanup services; standalone rental subject to confirmation.',
      order: 12
    }
  ];

  const upsertService = db.prepare(`
    INSERT INTO services (slug, title, category, short_desc, icon, image_url, service_area, confirmation_note, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET 
      title = excluded.title,
      category = excluded.category,
      short_desc = excluded.short_desc,
      icon = excluded.icon,
      image_url = excluded.image_url,
      service_area = excluded.service_area,
      confirmation_note = excluded.confirmation_note,
      display_order = excluded.display_order
  `);

  for (const s of defaultServices) {
    upsertService.run(s.slug, s.title, s.category, s.short_desc, s.icon, s.image_url, s.service_area, s.confirmation_note, s.order);
  }

  // Seed default truck fleet
  const defaultFleet = [
    {
      slug: 'light-cutaway-10-15',
      name: "10' – 15' Agile Urban Cutaway",
      size_range: "10' – 15' Box",
      payload_capacity: "2,500 – 4,000 lbs",
      dimensions: "10-15'L x 6.5'W x 7'H",
      description: "Nimble city cutaways ideal for Surrey and Vancouver apartments, tight residential lanes, furniture pickups, and small junk hauls.",
      image_url: "assets/fleet/fleet_10ft_truck.jpg",
      order: 1
    },
    {
      slug: 'insulated-box-16-24',
      name: "16' – 24' Insulated Box Truck",
      size_range: "16' – 24' Box",
      payload_capacity: "5,000 – 10,000 lbs",
      dimensions: "16-24'L x 8'W x 8'H",
      description: "Medium-duty box truck with protective moving blankets, cargo bars, and weather-insulated cargo body for Lower Mainland homes and offices.",
      image_url: "assets/fleet/fleet_15ft_truck.jpg",
      order: 2
    },
    {
      slug: 'flatbed-transport',
      name: "Flatbed Truck & Equipment Deck",
      size_range: "20' – 40' Deck",
      payload_capacity: "Up to 25,000 lbs",
      dimensions: "Open deck configuration",
      description: "Specialized open-deck platform for construction materials, building supplies, crated machinery, and side-loading cargo across BC.",
      image_url: "assets/fleet/fleet_flatbed_truck.jpg",
      order: 3
    },
    {
      slug: 'highway-reefer-semi-53',
      name: "53' Highway Tractor-Trailer & Reefer",
      size_range: "53' Semi-Trailer",
      payload_capacity: "Up to 45,000 lbs",
      dimensions: "53'L x 8.5'W x 9'H",
      description: "Full truckload (FTL) highway linehaul connecting Surrey, Vancouver, the Lower Mainland, and western commercial transportation corridors.",
      image_url: "assets/fleet/fleet_53ft_long_haul.jpg",
      order: 4
    }
  ];

  const upsertFleet = db.prepare(`
    INSERT INTO truck_fleet (slug, name, size_range, payload_capacity, dimensions, description, image_url, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      size_range = excluded.size_range,
      payload_capacity = excluded.payload_capacity,
      dimensions = excluded.dimensions,
      description = excluded.description,
      image_url = excluded.image_url,
      display_order = excluded.display_order
  `);

  for (const f of defaultFleet) {
    upsertFleet.run(f.slug, f.name, f.size_range, f.payload_capacity, f.dimensions, f.description, f.image_url, f.order);
  }

  // Seed gallery images
  const galleryCount = db.prepare('SELECT count(*) as c FROM gallery_images').get().c;
  if (galleryCount === 0) {
    const defaultGallery = [
      { title: '10 FT Urban Delivery Truck', category: 'small-trucks', image_url: 'assets/fleet/fleet_10ft_truck.jpg', type: 'verified_fleet', caption: 'Compact cutaway truck for small loads & local delivery in Surrey & Vancouver', is_hero: 0, order: 1 },
      { title: '15 FT Medium Moving Truck', category: 'small-trucks', image_url: 'assets/fleet/fleet_15ft_truck.jpg', type: 'verified_fleet', caption: 'Medium load moving and equipment transport vehicle', is_hero: 0, order: 2 },
      { title: '20-26 FT Commercial Flatbed', category: 'flatbed', image_url: 'assets/fleet/fleet_20_26ft_truck.jpg', type: 'verified_fleet', caption: 'Heavy-duty flatbed for commercial cargo and industrial supplies', is_hero: 0, order: 3 },
      { title: '53 FT Long-Haul Tractor-Trailer', category: 'long-haul', image_url: 'assets/fleet/fleet_53ft_long_haul.jpg', type: 'verified_fleet', caption: 'Highway linehaul transport on BC highways and corridors', is_hero: 0, order: 4 },
      { title: 'Heavy Flatbed Construction Haul', category: 'flatbed', image_url: 'assets/fleet/fleet_flatbed_truck.jpg', type: 'verified_fleet', caption: 'Open deck flatbed carrying construction supplies & machinery', is_hero: 0, order: 5 },
      { title: 'Refrigerated Transport Truck', category: 'long-haul', image_url: 'assets/fleet/fleet_refrigerated_truck.jpg', type: 'verified_fleet', caption: 'Temperature-controlled freight vehicle (subject to confirmation)', is_hero: 0, order: 6 },
      { title: 'Insulated Cargo Box Truck', category: 'small-trucks', image_url: 'assets/fleet/fleet_insulated_truck.jpg', type: 'verified_fleet', caption: 'Insulated dry cargo transport protecting goods from weather', is_hero: 0, order: 7 },
      { title: 'Beverage & Palletized Freight', category: 'long-haul', image_url: 'assets/fleet/fleet_beverage_transport.jpg', type: 'verified_fleet', caption: 'Palletized commercial beverage hauling across Lower Mainland', is_hero: 0, order: 8 },
      { title: 'Junk Removal Heavy Truck', category: 'junk-removal', image_url: 'assets/fleet/fleet_junk_removal_truck.jpg', type: 'verified_fleet', caption: 'Dedicated truck for furniture, renovation scrap, and property decluttering', is_hero: 0, order: 9 },
      { title: 'Garbage & Waste Removal Vehicle', category: 'garbage-removal', image_url: 'assets/fleet/fleet_garbage_removal.jpg', type: 'verified_fleet', caption: 'Commercial and residential debris carting to certified facilities', is_hero: 0, order: 10 },
      { title: 'Residential Furniture Moving Crew', category: 'moving', image_url: 'assets/fleet/fleet_residential_moving.jpg', type: 'verified_fleet', caption: 'Professional movers securing household goods with blankets and dollies', is_hero: 0, order: 11 },
      { title: 'Commercial Office Relocation', category: 'moving', image_url: 'assets/fleet/fleet_commercial_moving.jpg', type: 'verified_fleet', caption: 'Commercial moving crew handling office computers and files', is_hero: 0, order: 12 },
      { title: 'Industrial Heavy Machinery Hauling', category: 'moving', image_url: 'assets/fleet/fleet_industrial_moving.jpg', type: 'verified_fleet', caption: 'Forklift loading industrial equipment for transport in BC', is_hero: 0, order: 13 },
      { title: 'Gardening & Yard Cleanup Trailer', category: 'yard-cleanup', image_url: 'assets/fleet/fleet_gardening_yard_cleanup.jpg', type: 'verified_fleet', caption: 'Yard waste, branches, and seasonal property clearing collection', is_hero: 0, order: 14 },
      { title: 'Project Tools & Moving Equipment', category: 'tools', image_url: 'assets/fleet/fleet_tools_equipment.jpg', type: 'verified_fleet', caption: 'Lawn care tools, generators, ramps, and heavy-duty dollies', is_hero: 0, order: 15 },
      { title: 'BC Highway Commercial Linehaul Dusk', category: 'long-haul', image_url: 'assets/surrey-vancouver-skyline-hero.jpg', type: 'illustrative', caption: 'Cinematic representation of freight transport near Surrey & Vancouver at dusk', is_hero: 1, order: 16 }
    ];

    const insertGallery = db.prepare(`
      INSERT INTO gallery_images (title, category, image_url, image_type, caption, is_hero, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const g of defaultGallery) {
      insertGallery.run(g.title, g.category, g.image_url, g.type, g.caption, g.is_hero, g.order);
    }
  }

  // Seed / update BC promotions
  const bcPromos = [
    {
      code: 'STUDENT10',
      name: '10% BC Student Discount',
      discount_percent: 10,
      description: '10% off residential moving, small load delivery, and junk removal for enrolled post-secondary students across BC (UBC, SFU, BCIT, KPU, Langara, Douglas College, etc.).',
      terms: 'Valid post-secondary student ID required upon booking confirmation. Cannot be combined with statutory holiday promotional rates. One discount per job.'
    },
    {
      code: 'HOLIDAY10',
      name: '10% BC & Canadian Statutory Holiday Discount',
      discount_percent: 10,
      description: '10% promotional rate on bookings scheduled during eligible Canadian and British Columbia statutory holiday booking windows.',
      terms: 'Applies to qualifying residential and commercial moves across Surrey, Vancouver, and the Lower Mainland. Subject to crew and truck scheduling.'
    }
  ];

  const upsertPromo = db.prepare(`
    INSERT INTO promotions (code, name, discount_percent, description, terms)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      discount_percent = excluded.discount_percent,
      description = excluded.description,
      terms = excluded.terms
  `);

  for (const p of bcPromos) {
    upsertPromo.run(p.code, p.name, p.discount_percent, p.description, p.terms);
  }
}

// Generate unique sequential reference number: STN-YEAR-XXXX
function generateQuoteRef() {
  const currentYear = new Date().getFullYear();
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM quotes 
    WHERE ref_id LIKE ?
  `).get(`STN-${currentYear}-%`);

  const nextNum = (countRow ? countRow.count : 0) + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `STN-${currentYear}-${padded}`;
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
