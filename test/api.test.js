const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { db } = require('../db/database');

test('SPN Trucking API Suite', async (t) => {
  let adminToken = '';
  let createdQuoteId = null;
  let createdRefId = '';

  await t.test('1. Health Check Endpoint', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'UP');
    assert.equal(res.body.company, 'SPN Trucking Ltd.');
    assert.equal(res.body.market, 'Calgary, AB');
  });

  await t.test('2. Public Site Configuration', async () => {
    const res = await request(app).get('/api/config');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.settings.company_name, 'SPN Trucking Ltd.');
    assert.equal(res.body.settings.contact_phone, '778-302-8803');
    assert.equal(res.body.settings.contact_email, 'stntruckingltd@gmail.com');
    assert.ok(Array.isArray(res.body.services));
    assert.ok(res.body.services.length >= 10);
    assert.ok(Array.isArray(res.body.fleet));
  });

  await t.test('3. Quote Validation - Missing Required Fields', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Test User'
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /fill in all required fields/i);
  });

  await t.test('4. Quote Validation - Invalid Email', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Test User',
        phone: '403-555-0199',
        email: 'invalid-email-string',
        serviceCategory: 'residential-moving',
        loadDescription: '3-bedroom townhouse moving to SW Calgary'
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /valid email address/i);
  });

  await t.test('5. Quote Submission - Successful Registration', async () => {
    const uniqueEmail = `test.client.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Alexander Smith',
        phone: '403-555-1234',
        email: uniqueEmail,
        serviceCategory: 'residential-moving',
        jobType: 'residential',
        pickupLocation: 'Downtown Calgary, 4th Ave SW',
        dropoffLocation: 'Killarney, Calgary',
        serviceDate: '2026-11-01',
        serviceTime: '09:00',
        truckSize: '16-24ft',
        loadDescription: '2-bedroom condo relocation with living room set and dining table.',
        additionalInstructions: 'Freight elevator is booked from 9am to 12pm.',
        discountCode: 'STUDENT10'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.ref_id, /^SPN-\d{4}-\d{4}$/);
    assert.equal(res.body.quote.status, 'PENDING');

    createdQuoteId = res.body.quote.id;
    createdRefId = res.body.ref_id;
  });

  await t.test('6. Spam Protection - Honeypot Check', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Spam Bot',
        phone: '555-0000',
        email: 'bot@spammer.org',
        serviceCategory: 'junk-removal',
        loadDescription: 'Spam text',
        website_hp: 'http://spam-link.com'
      });

    assert.equal(res.status, 200);
    // Silent mitigation returns fake ref
    assert.match(res.body.ref_id, /SPN-\d{4}-0000/);
  });

  await t.test('7. Customer Review Submission & Public Filtering', async () => {
    // Submit a review
    const resSubmit = await request(app)
      .post('/api/reviews')
      .send({
        customerName: 'Marcus Tremblay',
        serviceName: 'Residential Moving',
        rating: 5,
        reviewText: 'Abbas and his crew arrived promptly in Calgary and handled our fragile furniture with utmost care!'
      });
    assert.equal(resSubmit.status, 200);
    assert.equal(resSubmit.body.success, true);

    // Verify unapproved reviews are NOT displayed publicly
    const resPublic = await request(app).get('/api/reviews');
    assert.equal(resPublic.status, 200);
    const unapproved = resPublic.body.reviews.find(r => r.customer_name === 'Marcus Tremblay');
    assert.equal(unapproved, undefined, 'Unapproved review should not appear publicly');
  });

  await t.test('8. Admin Authentication - Invalid Password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: 'WrongPassword123!'
      });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('9. Admin Authentication - Valid Login', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: process.env.ADMIN_DEFAULT_PASS || 'SPNAdmin2026!'
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    adminToken = res.body.token;
  });

  await t.test('10. Admin Metrics & Quotes List Access', async () => {
    const resMetrics = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resMetrics.status, 200);
    assert.ok(resMetrics.body.metrics.totalQuotes >= 1);

    const resQuotes = await request(app)
      .get('/api/admin/quotes')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resQuotes.status, 200);
    assert.ok(Array.isArray(resQuotes.body.quotes));
  });

  await t.test('11. Admin Quote Status Workflow - Temporary Hold & Approval', async () => {
    assert.ok(createdQuoteId, 'createdQuoteId must exist');

    // 1. Place temporary hold for 48 hours
    const resHold = await request(app)
      .patch(`/api/admin/quotes/${createdQuoteId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'HOLD',
        holdHours: 48,
        notes: 'Temporary dispatch hold reserved for customer consultation'
      });
    assert.equal(resHold.status, 200);
    assert.equal(resHold.body.status, 'HOLD');
    assert.ok(resHold.body.holdExpiresAt);

    // 2. Approve quote
    const resApprove = await request(app)
      .patch(`/api/admin/quotes/${createdQuoteId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        notes: 'Deposit confirmed. Scheduled on dispatch board.'
      });
    assert.equal(resApprove.status, 200);
    assert.equal(resApprove.body.status, 'APPROVED');

    // 3. Inspect audit trail for quote
    const resDetails = await request(app)
      .get(`/api/admin/quotes/${createdQuoteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resDetails.status, 200);
    assert.equal(resDetails.body.quote.status, 'APPROVED');
    assert.ok(resDetails.body.auditTrail.length >= 3);
  });

  await t.test('12. SEO Dynamic Endpoints', async () => {
    const resSitemap = await request(app).get('/sitemap.xml');
    assert.equal(resSitemap.status, 200);
    assert.match(resSitemap.text, /<urlset/);
    assert.match(resSitemap.text, /services-residential-moving\.html/);

    const resRobots = await request(app).get('/robots.txt');
    assert.equal(resRobots.status, 200);
    assert.match(resRobots.text, /Disallow: \/admin/);
  });
});
