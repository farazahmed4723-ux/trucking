require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db, generateQuoteRef, logAudit } = require('./db/database');
const { dispatchQuoteNotifications, TARGET_EMAIL, TARGET_SMS_PHONE } = require('./services/notifications');
global.CampaignsConfig = require('./js/campaigns-config');
const CampaignEngine = require('./js/campaigns');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'stn-trucking-secret-key-2026-production';

// Ensure uploads directory exists (use /tmp in Vercel serverless environment)
const isVercel = !!process.env.VERCEL;
const UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.warn('[UPLOAD_WARN] Could not create uploads dir:', err.message);
  }
}

// Multer storage for secure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ? ext : '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'spn-' + uniqueSuffix + cleanExt);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.'));
    }
  }
});

// Security & Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Asset Directories
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple In-Memory Rate Limiting for Quote Submissions
const quoteRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_QUOTES_PER_WINDOW = 6;

function quoteRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const timestamps = quoteRateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_QUOTES_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: 'Too many quote requests submitted from your connection. Please call us directly at 778-302-8803.'
    });
  }

  validTimestamps.push(now);
  quoteRateLimitMap.set(ip, validTimestamps);
  next();
}

// Authentication Middleware for Admin API
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
}

/* ===================================================================
   PUBLIC API ENDPOINTS
   =================================================================== */

// System Health
app.get('/api/health', (req, res) => {
  try {
    const test = db.prepare('SELECT 1 as healthy').get();
    res.json({
      status: 'UP',
      database: test.healthy === 1 ? 'CONNECTED' : 'UNKNOWN',
      time: new Date().toISOString(),
      company: 'STN Trucking Ltd.',
      market: 'Surrey & Vancouver, BC'
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Dynamic Public Configuration (Phone, Email, Services, Promos, Fleet, Gallery)
app.get('/api/config', (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC').all();
    const fleet = db.prepare('SELECT * FROM truck_fleet WHERE is_active = 1 ORDER BY display_order ASC').all();
    const promos = db.prepare('SELECT * FROM promotions WHERE is_active = 1').all();
    const gallery = db.prepare('SELECT * FROM gallery_images ORDER BY display_order ASC').all();

    res.json({
      success: true,
      settings,
      services,
      fleet,
      promos,
      gallery
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Public Gallery Endpoint
app.get('/api/gallery', (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM gallery_images';
    const params = [];
    if (category && category !== 'all' && category !== 'ALL') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY display_order ASC';
    const images = db.prepare(query).all(...params);
    res.json({ success: true, count: images.length, images });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Active Seasonal Campaign (America/Vancouver Timezone)
app.get('/api/campaigns/active', (req, res) => {
  try {
    const simDate = req.query.simulate_date || null;
    const active = simDate ? CampaignEngine.getActiveCampaign(simDate) : CampaignEngine.getActiveCampaign();
    const now = CampaignEngine.getCurrentDate();
    res.json({
      success: true,
      timezone: 'America/Vancouver',
      serverTime: now.toISOString(),
      active: !!active,
      campaign: active || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Full Campaign Calendar for Given Year (Dynamic Holiday Calculations)
app.get('/api/campaigns/calendar', (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const campaigns = CampaignEngine.getAllCampaignsForYear(year);
    res.json({
      success: true,
      year,
      timezone: 'America/Vancouver',
      count: campaigns.length,
      campaigns
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit a Quote Request
app.post('/api/quotes', upload.single('photo'), quoteRateLimiter, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      serviceCategory,
      jobType,
      pickupLocation,
      dropoffLocation,
      serviceDate,
      serviceTime,
      truckSize,
      loadDescription,
      additionalInstructions,
      discountCode,
      website_hp // Honeypot field
    } = req.body;

    // Spam Protection: Honeypot check
    if (website_hp && website_hp.trim().length > 0) {
      console.warn('[SPAM_BLOCKED] Honeypot triggered by IP:', req.ip);
      // Silently return fake success so bots do not retry
      return res.json({
        success: true,
        ref_id: 'STN-' + new Date().getFullYear() + '-0000',
        message: 'Your request has been received.'
      });
    }

    // Input Validation
    if (!fullName || !phone || !email || !serviceCategory || !loadDescription) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields (Name, Phone, Email, Service Category, and Load Description).'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    // Duplicate detection (Prevent duplicate requests within 3 minutes with identical email and service)
    const duplicateCheck = db.prepare(`
      SELECT id, ref_id FROM quotes
      WHERE email = ? AND service_category = ? AND created_at >= datetime('now', '-3 minutes')
    `).get(email.trim().toLowerCase(), serviceCategory);

    if (duplicateCheck) {
      return res.status(409).json({
        success: false,
        error: `A quote request was already received recently under reference ${duplicateCheck.ref_id}. Our dispatch team will follow up shortly.`
      });
    }

    // Generate unique reference ID
    const refId = generateQuoteRef();
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const ip = req.ip || req.connection.remoteAddress || null;

    // Insert quote record into SQL
    const insertStmt = db.prepare(`
      INSERT INTO quotes (
        ref_id, full_name, phone, email, service_category, job_type,
        pickup_location, dropoff_location, service_date, service_time,
        truck_size, load_description, additional_instructions,
        discount_code, photo_path, status, ip_address
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, 'PENDING', ?
      )
    `);

    const result = insertStmt.run(
      refId,
      fullName.trim(),
      phone.trim(),
      email.trim().toLowerCase(),
      serviceCategory,
      jobType || 'residential',
      pickupLocation ? pickupLocation.trim() : null,
      dropoffLocation ? dropoffLocation.trim() : null,
      serviceDate || null,
      serviceTime || null,
      truckSize || null,
      loadDescription.trim(),
      additionalInstructions ? additionalInstructions.trim() : null,
      discountCode ? discountCode.trim() : null,
      photoPath,
      ip
    );

    const quoteId = result.lastInsertRowid;

    // Log to Audit Log
    logAudit(quoteId, 'QUOTE_CREATED', 'CUSTOMER', {
      refId,
      fullName,
      phone,
      serviceCategory
    });

    // Fetch newly created quote object for notifications
    const newQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);

    // Asynchronously dispatch Email & SMS notifications (non-blocking)
    dispatchQuoteNotifications(newQuote).catch(err => {
      console.error('[NOTIF_DISPATCH_ERROR]', err.message);
    });

    res.status(201).json({
      success: true,
      ref_id: refId,
      quote: {
        id: quoteId,
        ref_id: refId,
        full_name: newQuote.full_name,
        service_category: newQuote.service_category,
        service_date: newQuote.service_date,
        status: newQuote.status,
        created_at: newQuote.created_at
      },
      message: `Quote request successfully registered under reference ${refId}. Abbas and the STN dispatch team will contact you shortly.`
    });
  } catch (err) {
    console.error('[QUOTE_SUBMISSION_ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'An unexpected system error occurred while recording your quote. Please call 778-302-8803 directly.'
    });
  }
});

// Get Public Approved Reviews
app.get('/api/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT id, customer_name, service_name, rating, review_text, review_date, verified
      FROM reviews
      WHERE is_approved = 1
      ORDER BY is_featured DESC, id DESC
    `).all();

    res.json({
      success: true,
      reviews,
      count: reviews.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit a Customer Review (Pending Moderation)
app.post('/api/reviews', (req, res) => {
  try {
    const { customerName, serviceName, rating, reviewText, website_hp } = req.body;

    if (website_hp && website_hp.trim().length > 0) {
      return res.json({ success: true, message: 'Thank you for your feedback.' });
    }

    if (!customerName || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your name, star rating (1-5), and review feedback.'
      });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    const todayDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });

    const insertStmt = db.prepare(`
      INSERT INTO reviews (customer_name, service_name, rating, review_text, review_date, is_approved)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    insertStmt.run(
      customerName.trim(),
      serviceName ? serviceName.trim() : 'General Transportation',
      ratingNum,
      reviewText.trim(),
      todayDate
    );

    logAudit(null, 'REVIEW_SUBMITTED', 'CUSTOMER', { customerName, rating: ratingNum });

    res.json({
      success: true,
      message: 'Thank you for your review! To preserve authenticity, customer reviews undergo verification before publication.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================================
   ADMINISTRATION & BACKOFFICE APIS (PROTECTED)
   =================================================================== */

// Admin Login
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required.' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Update last login
    db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit(null, 'ADMIN_LOGIN', user.username, { ip: req.ip });

    res.json({
      success: true,
      token,
      admin: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Dashboard Summary Metrics
app.get('/api/admin/metrics', authenticateAdmin, (req, res) => {
  try {
    const totalQuotes = db.prepare('SELECT COUNT(*) as c FROM quotes').get().c;
    const pendingQuotes = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status = 'PENDING'").get().c;
    const holdQuotes = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status = 'HOLD'").get().c;
    const approvedQuotes = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status = 'APPROVED'").get().c;
    const pendingReviews = db.prepare("SELECT COUNT(*) as c FROM reviews WHERE is_approved = 0").get().c;

    res.json({
      success: true,
      metrics: {
        totalQuotes,
        pendingQuotes,
        holdQuotes,
        approvedQuotes,
        pendingReviews
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List Quotes with Filtering & Search
app.get('/api/admin/quotes', authenticateAdmin, (req, res) => {
  try {
    const { status, search, service } = req.query;

    let query = 'SELECT * FROM quotes WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (service && service !== 'ALL') {
      query += ' AND service_category = ?';
      params.push(service);
    }

    if (search) {
      query += ' AND (ref_id LIKE ? OR full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const quotes = db.prepare(query).all(...params);
    res.json({ success: true, quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Quote Details with Audit Trail
app.get('/api/admin/quotes/:id', authenticateAdmin, (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found.' });
    }

    const auditTrail = db.prepare(`
      SELECT * FROM audit_logs WHERE quote_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    const notifications = db.prepare(`
      SELECT * FROM notifications_log WHERE quote_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      quote,
      auditTrail,
      notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Quote Status (Pending, Hold, Approved, Rejected, Released)
app.patch('/api/admin/quotes/:id/status', authenticateAdmin, (req, res) => {
  try {
    const { status, holdHours, notes } = req.body;
    const validStatuses = ['PENDING', 'HOLD', 'APPROVED', 'REJECTED', 'RELEASED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status code.' });
    }

    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found.' });
    }

    let holdExpiresAt = null;
    if (status === 'HOLD') {
      const hours = parseInt(holdHours || '24', 10);
      const d = new Date();
      d.setHours(d.getHours() + hours);
      holdExpiresAt = d.toISOString();
    }

    db.prepare(`
      UPDATE quotes 
      SET status = ?, hold_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, holdExpiresAt, req.params.id);

    logAudit(req.params.id, 'STATUS_CHANGE', req.admin.username, {
      oldStatus: quote.status,
      newStatus: status,
      holdExpiresAt,
      notes: notes || null
    });

    res.json({
      success: true,
      message: `Quote ${quote.ref_id} status updated to ${status}.`,
      status,
      holdExpiresAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Quote Internal Notes
app.patch('/api/admin/quotes/:id/notes', authenticateAdmin, (req, res) => {
  try {
    const { internalNotes } = req.body;
    db.prepare(`
      UPDATE quotes SET internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(internalNotes || null, req.params.id);

    logAudit(req.params.id, 'NOTES_UPDATED', req.admin.username, {});

    res.json({ success: true, message: 'Notes saved.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Review Management (Approve, Reject, Feature, Delete)
app.get('/api/admin/reviews', authenticateAdmin, (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/reviews/:id', authenticateAdmin, (req, res) => {
  try {
    const { isApproved, isFeatured, verified } = req.body;
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found.' });

    const newApproved = isApproved !== undefined ? (isApproved ? 1 : 0) : review.is_approved;
    const newFeatured = isFeatured !== undefined ? (isFeatured ? 1 : 0) : review.is_featured;
    const newVerified = verified !== undefined ? (verified ? 1 : 0) : review.verified;

    db.prepare(`
      UPDATE reviews
      SET is_approved = ?, is_featured = ?, verified = ?
      WHERE id = ?
    `).run(newApproved, newFeatured, newVerified, req.params.id);

    logAudit(null, 'REVIEW_MODERATED', req.admin.username, {
      reviewId: req.params.id,
      isApproved: newApproved
    });

    res.json({ success: true, message: 'Review updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/reviews', authenticateAdmin, (req, res) => {
  try {
    const { customerName, serviceName, rating, reviewText, reviewDate, isFeatured } = req.body;
    if (!customerName || !rating || !reviewText) {
      return res.status(400).json({ success: false, error: 'Name, rating and review text are required.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO reviews (customer_name, service_name, rating, review_text, review_date, verified, is_approved, is_featured)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?)
    `);

    insertStmt.run(
      customerName.trim(),
      serviceName ? serviceName.trim() : 'Transportation Service',
      parseInt(rating, 10),
      reviewText.trim(),
      reviewDate || new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short' }),
      isFeatured ? 1 : 0
    );

    logAudit(null, 'REVIEW_ADDED_DIRECT', req.admin.username, { customerName });

    res.json({ success: true, message: 'Verified review added and published.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/reviews/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    logAudit(null, 'REVIEW_DELETED', req.admin.username, { id: req.params.id });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Services Management
app.get('/api/admin/services', authenticateAdmin, (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY display_order ASC').all();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/services', authenticateAdmin, (req, res) => {
  try {
    const { slug, title, category, shortDesc, icon, imageUrl, serviceArea, confirmationNote, displayOrder } = req.body;
    if (!slug || !title || !category || !shortDesc) {
      return res.status(400).json({ success: false, error: 'Slug, title, category, and description are required.' });
    }
    const stmt = db.prepare(`
      INSERT INTO services (slug, title, category, short_desc, icon, image_url, service_area, confirmation_note, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      slug.trim(),
      title.trim(),
      category.trim(),
      shortDesc.trim(),
      icon || '🚚',
      imageUrl || null,
      serviceArea || 'Surrey, Vancouver & Lower Mainland',
      confirmationNote || null,
      parseInt(displayOrder || '0', 10)
    );
    logAudit(null, 'SERVICE_CREATED', req.admin.username, { slug, title });
    res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Service added successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/services/:id', authenticateAdmin, (req, res) => {
  try {
    const { title, category, shortDesc, icon, imageUrl, serviceArea, confirmationNote, isActive, displayOrder } = req.body;
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ success: false, error: 'Service not found.' });

    db.prepare(`
      UPDATE services
      SET title = ?, category = ?, short_desc = ?, icon = ?, image_url = ?, service_area = ?, confirmation_note = ?, is_active = ?, display_order = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title : service.title,
      category !== undefined ? category : service.category,
      shortDesc !== undefined ? shortDesc : service.short_desc,
      icon !== undefined ? icon : service.icon,
      imageUrl !== undefined ? imageUrl : service.image_url,
      serviceArea !== undefined ? serviceArea : service.service_area,
      confirmationNote !== undefined ? confirmationNote : service.confirmation_note,
      isActive !== undefined ? (isActive ? 1 : 0) : service.is_active,
      displayOrder !== undefined ? parseInt(displayOrder, 10) : service.display_order,
      req.params.id
    );

    logAudit(null, 'SERVICE_UPDATED', req.admin.username, { id: req.params.id, title });
    res.json({ success: true, message: 'Service updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/services/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    logAudit(null, 'SERVICE_DELETED', req.admin.username, { id: req.params.id });
    res.json({ success: true, message: 'Service removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Fleet Specifications Management
app.get('/api/admin/fleet', authenticateAdmin, (req, res) => {
  try {
    const fleet = db.prepare('SELECT * FROM truck_fleet ORDER BY display_order ASC').all();
    res.json({ success: true, fleet });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/fleet/:id', authenticateAdmin, (req, res) => {
  try {
    const { name, sizeRange, payloadCapacity, dimensions, description, imageUrl, isActive, displayOrder } = req.body;
    const vehicle = db.prepare('SELECT * FROM truck_fleet WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, error: 'Vehicle not found.' });

    db.prepare(`
      UPDATE truck_fleet
      SET name = ?, size_range = ?, payload_capacity = ?, dimensions = ?, description = ?, image_url = ?, is_active = ?, display_order = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : vehicle.name,
      sizeRange !== undefined ? sizeRange : vehicle.size_range,
      payloadCapacity !== undefined ? payloadCapacity : vehicle.payload_capacity,
      dimensions !== undefined ? dimensions : vehicle.dimensions,
      description !== undefined ? description : vehicle.description,
      imageUrl !== undefined ? imageUrl : vehicle.image_url,
      isActive !== undefined ? (isActive ? 1 : 0) : vehicle.is_active,
      displayOrder !== undefined ? parseInt(displayOrder, 10) : vehicle.display_order,
      req.params.id
    );

    logAudit(null, 'FLEET_UPDATED', req.admin.username, { id: req.params.id, name });
    res.json({ success: true, message: 'Fleet specs updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Gallery & Hero Management
app.get('/api/admin/gallery', authenticateAdmin, (req, res) => {
  try {
    const gallery = db.prepare('SELECT * FROM gallery_images ORDER BY display_order ASC').all();
    res.json({ success: true, gallery, images: gallery });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/gallery', authenticateAdmin, (req, res) => {
  try {
    const { title, category, imageUrl, imageType, caption, isHero, displayOrder } = req.body;
    if (!title || !category || !imageUrl) {
      return res.status(400).json({ success: false, error: 'Title, category, and imageUrl are required.' });
    }
    const stmt = db.prepare(`
      INSERT INTO gallery_images (title, category, image_url, image_type, caption, is_hero, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      title.trim(),
      category.trim(),
      imageUrl.trim(),
      imageType || 'verified_fleet',
      caption || null,
      isHero ? 1 : 0,
      parseInt(displayOrder || '0', 10)
    );
    logAudit(null, 'GALLERY_IMAGE_ADDED', req.admin.username, { title, category });
    res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Gallery image registered.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/gallery/:id/hero', authenticateAdmin, (req, res) => {
  try {
    const { isHero } = req.body;
    db.prepare('UPDATE gallery_images SET is_hero = ? WHERE id = ?').run(isHero ? 1 : 0, req.params.id);
    logAudit(null, 'GALLERY_HERO_TOGGLED', req.admin.username, { id: req.params.id, isHero });
    res.json({ success: true, message: 'Hero setting updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/gallery/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM gallery_images WHERE id = ?').run(req.params.id);
    logAudit(null, 'GALLERY_IMAGE_DELETED', req.admin.username, { id: req.params.id });
    res.json({ success: true, message: 'Gallery image removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Promotions Management
app.get('/api/admin/promotions', authenticateAdmin, (req, res) => {
  try {
    const promos = db.prepare('SELECT * FROM promotions ORDER BY id ASC').all();
    res.json({ success: true, promos, promotions: promos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/promotions/:id', authenticateAdmin, (req, res) => {
  try {
    const { name, discountPercent, description, terms, isActive } = req.body;
    const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id);
    if (!promo) return res.status(404).json({ success: false, error: 'Promotion not found.' });

    db.prepare(`
      UPDATE promotions
      SET name = ?, discount_percent = ?, description = ?, terms = ?, is_active = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : promo.name,
      discountPercent !== undefined ? parseInt(discountPercent, 10) : promo.discount_percent,
      description !== undefined ? description : promo.description,
      terms !== undefined ? terms : promo.terms,
      isActive !== undefined ? (isActive ? 1 : 0) : promo.is_active,
      req.params.id
    );

    logAudit(null, 'PROMOTION_UPDATED', req.admin.username, { id: req.params.id, code: promo.code });
    res.json({ success: true, message: 'Promotion updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Image Upload
app.post('/api/admin/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    logAudit(null, 'FILE_UPLOADED_BY_ADMIN', req.admin.username, { filename: req.file.filename });
    res.json({ success: true, url: publicUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Admin Site Settings Management
app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM site_settings').all();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object required.' });
    }

    const updateStmt = db.prepare(`
      INSERT INTO site_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    for (const [key, value] of Object.entries(settings)) {
      updateStmt.run(key, String(value));
    }

    logAudit(null, 'SETTINGS_UPDATED', req.admin.username, { updatedKeys: Object.keys(settings) });

    res.json({ success: true, message: 'Settings saved.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Notifications & Audit Logs Viewer
app.get('/api/admin/audit-logs', authenticateAdmin, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/notifications', authenticateAdmin, (req, res) => {
  try {
    const notifs = db.prepare('SELECT * FROM notifications_log ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, notifications: notifs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve sitemap.xml dynamically
app.get('/sitemap.xml', (req, res) => {
  const domain = process.env.APP_DOMAIN || 'https://spntrucking.ca';
  const urls = [
    '',
    '/services.html',
    '/services-residential-moving.html',
    '/services-commercial-moving.html',
    '/services-industrial-moving.html',
    '/services-trucking.html',
    '/services-small-load-transportation.html',
    '/services-flatbed-trucking.html',
    '/services-refrigerated-trucking.html',
    '/services-beverage-transportation.html',
    '/services-junk-removal.html',
    '/services-garbage-removal.html',
    '/services-gardening.html',
    '/services-tool-services.html',
    '/fleet.html',
    '/about.html',
    '/service-areas.html',
    '/contact.html'
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${domain}${u}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Serve robots.txt dynamically
app.get('/robots.txt', (req, res) => {
  const domain = process.env.APP_DOMAIN || 'https://spntrucking.ca';
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${domain}/sitemap.xml\n`);
});

// Fallback route for SPA or HTML pages
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});

app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

// Periodic Campaign Automation Monitor (Checks active BC campaigns in America/Vancouver timezone)
function runCampaignAutomationCheck() {
  try {
    const nowVancouver = CampaignEngine.getCurrentDate();
    const active = CampaignEngine.getActiveCampaign();
    if (active) {
      console.log(`[CAMPAIGN_SCHEDULER] ${nowVancouver.toISOString()} (PT) — Active Campaign: "${active.name}" (${active.code}) - 10% OFF`);
    } else {
      console.log(`[CAMPAIGN_SCHEDULER] ${nowVancouver.toISOString()} (PT) — No statutory/seasonal campaign active. Banner hidden.`);
    }
  } catch (err) {
    console.warn('[CAMPAIGN_SCHEDULER_WARN]', err.message);
  }
}
runCampaignAutomationCheck();
setInterval(runCampaignAutomationCheck, 60 * 60 * 1000).unref(); // Hourly scheduled check (unref to avoid hanging test suite)

// Start Server if invoked directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`STN TRUCKING LTD. — FULL-STACK PLATFORM RUNNING`);
    console.log(`Address: http://localhost:${PORT}`);
    console.log(`Admin Portal: http://localhost:${PORT}/admin`);
    console.log(`Contact Phone: 778-302-8803`);
    console.log(`Dispatch Email: ${TARGET_EMAIL}`);
    console.log(`SMS Alert Line: ${TARGET_SMS_PHONE}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
