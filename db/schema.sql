-- SPN Trucking Ltd. Database Schema
-- Calgary, Alberta, Canada
-- Built for SQLite with WAL mode and strict type adherence

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    service_category TEXT NOT NULL,
    job_type TEXT DEFAULT 'residential',
    pickup_location TEXT,
    dropoff_location TEXT,
    service_date TEXT,
    service_time TEXT,
    truck_size TEXT,
    load_description TEXT NOT NULL,
    additional_instructions TEXT,
    discount_code TEXT,
    photo_path TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, HOLD, APPROVED, REJECTED, RELEASED
    hold_expires_at DATETIME,
    internal_notes TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_ref_id ON quotes(ref_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    channel TEXT NOT NULL, -- EMAIL, SMS
    recipient TEXT NOT NULL,
    status TEXT NOT NULL, -- DELIVERED, FAILED, PENDING_CONFIGURATION
    provider TEXT NOT NULL, -- SMTP, TWILIO, SIMULATOR
    response_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    review_date TEXT,
    verified INTEGER DEFAULT 0, -- 1 = verified customer
    is_approved INTEGER DEFAULT 0, -- 1 = approved for public display
    is_featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Moving, Trucking, Hauling, Property
    short_desc TEXT NOT NULL,
    icon TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS truck_fleet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    size_range TEXT NOT NULL,
    payload_capacity TEXT NOT NULL,
    dimensions TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 10,
    description TEXT NOT NULL,
    terms TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
