const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { db } = require('../db/database');

test('STN Trucking API Suite', async (t) => {
  let adminToken = '';
  let createdQuoteId = null;
  let createdRefId = '';

  await t.test('1. Health Check Endpoint', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'UP');
    assert.equal(res.body.company, 'STN Trucking Ltd.');
    assert.equal(res.body.market, 'Surrey & Vancouver, BC');
  });

  await t.test('2. Public Site Configuration', async () => {
    const res = await request(app).get('/api/config');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.settings.company_name, 'STN Trucking Ltd.');
    assert.equal(res.body.settings.contact_phone, '778-302-8803');
    assert.equal(res.body.settings.contact_email, 'stntruckingltd@gmail.com');
    assert.ok(Array.isArray(res.body.services));
    assert.ok(res.body.services.length >= 10);
    assert.ok(Array.isArray(res.body.fleet));
  });

  await t.test('3. Public Gallery Endpoint', async () => {
    const res = await request(app).get('/api/gallery');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.images));
    assert.ok(res.body.images.length >= 10);
    const flatbeds = res.body.images.filter(img => img.category === 'flatbed');
    assert.ok(flatbeds.length >= 1);
  });

  await t.test('4. Quote Validation - Missing Required Fields', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Test User'
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /fill in all required fields/i);
  });

  await t.test('5. Quote Validation - Invalid Email', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Test User',
        phone: '778-555-0199',
        email: 'invalid-email-string',
        serviceCategory: 'residential-moving',
        loadDescription: '3-bedroom townhouse moving to Surrey, BC'
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /valid email address/i);
  });

  await t.test('6. Quote Submission - Successful Registration', async () => {
    const uniqueEmail = `test.client.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/quotes')
      .send({
        fullName: 'Alexander Smith',
        phone: '778-302-8803',
        email: uniqueEmail,
        serviceCategory: 'residential-moving',
        jobType: 'residential',
        pickupLocation: 'Surrey Central, 104 Ave',
        dropoffLocation: 'Downtown Vancouver, Robson St',
        serviceDate: '2026-11-01',
        serviceTime: '09:00',
        truckSize: '16-24ft',
        loadDescription: '2-bedroom condo relocation with living room set and dining table.',
        additionalInstructions: 'Freight elevator is booked from 9am to 12pm.',
        discountCode: 'STUDENT10'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.ref_id, /^STN-\d{4}-\d{4}$/);
    assert.equal(res.body.quote.status, 'PENDING');

    createdQuoteId = res.body.quote.id;
    createdRefId = res.body.ref_id;
  });

  await t.test('7. Spam Protection - Honeypot Check', async () => {
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
    assert.match(res.body.ref_id, /STN-\d{4}-0000/);
  });

  await t.test('8. Customer Review Submission & Public Filtering', async () => {
    const resSubmit = await request(app)
      .post('/api/reviews')
      .send({
        customerName: 'Marcus Tremblay',
        serviceName: 'Residential Moving',
        rating: 5,
        reviewText: 'Abbas and his crew arrived promptly in Surrey and handled our fragile furniture with utmost care!'
      });
    assert.equal(resSubmit.status, 200);
    assert.equal(resSubmit.body.success, true);

    const resPublic = await request(app).get('/api/reviews');
    assert.equal(resPublic.status, 200);
    const unapproved = resPublic.body.reviews.find(r => r.customer_name === 'Marcus Tremblay');
    assert.equal(unapproved, undefined, 'Unapproved review should not appear publicly');
  });

  await t.test('9. Admin Authentication - Invalid Password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: 'WrongPassword123!'
      });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('10. Admin Authentication - Valid Login', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'admin',
        password: process.env.ADMIN_DEFAULT_PASS || 'STNAdmin2026!'
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    adminToken = res.body.token;
  });

  await t.test('11. Admin Metrics & Quotes List Access', async () => {
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

  await t.test('12. Admin Quote Status Workflow - Temporary Hold & Approval', async () => {
    assert.ok(createdQuoteId, 'createdQuoteId must exist');

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

    const resApprove = await request(app)
      .patch(`/api/admin/quotes/${createdQuoteId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        notes: 'Deposit confirmed. Scheduled on dispatch board.'
      });
    assert.equal(resApprove.status, 200);
    assert.equal(resApprove.body.status, 'APPROVED');

    const resDetails = await request(app)
      .get(`/api/admin/quotes/${createdQuoteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resDetails.status, 200);
    assert.equal(resDetails.body.quote.status, 'APPROVED');
    assert.ok(resDetails.body.auditTrail.length >= 3);
  });

  await t.test('13. Admin Services Management Endpoint', async () => {
    const resList = await request(app)
      .get('/api/admin/services')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resList.status, 200);
    assert.equal(resList.body.success, true);
    assert.ok(resList.body.services.length >= 10);

    const firstService = resList.body.services[0];
    const resUpdate = await request(app)
      .put(`/api/admin/services/${firstService.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: firstService.title,
        description: firstService.description,
        icon: firstService.icon,
        is_active: 1,
        image_url: firstService.image_url,
        service_area: 'Surrey, Vancouver & Lower Mainland',
        confirmation_note: firstService.confirmation_note
      });
    assert.equal(resUpdate.status, 200);
    assert.equal(resUpdate.body.success, true);
  });

  await t.test('14. Admin Fleet Management Endpoint', async () => {
    const resFleet = await request(app)
      .get('/api/admin/fleet')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resFleet.status, 200);
    assert.equal(resFleet.body.success, true);
    assert.ok(resFleet.body.fleet.length >= 4);
  });

  await t.test('15. Admin Gallery Management Endpoint', async () => {
    const resGallery = await request(app)
      .get('/api/admin/gallery')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resGallery.status, 200);
    assert.equal(resGallery.body.success, true);
    assert.ok(resGallery.body.images.length >= 10);
  });

  await t.test('16. Admin Promotions Management Endpoint', async () => {
    const resPromos = await request(app)
      .get('/api/admin/promotions')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resPromos.status, 200);
    assert.equal(resPromos.body.success, true);
    assert.ok(resPromos.body.promotions.length >= 2);
  });

  await t.test('17. SEO Dynamic Endpoints', async () => {
    const resSitemap = await request(app).get('/sitemap.xml');
    assert.equal(resSitemap.status, 200);
    assert.match(resSitemap.text, /<urlset/);
    assert.match(resSitemap.text, /services-residential-moving\.html/);
    assert.match(resSitemap.text, /services-beverage-transportation\.html/);

    const resRobots = await request(app).get('/robots.txt');
    assert.equal(resRobots.status, 200);
    assert.match(resRobots.text, /Disallow: \/admin/);
  });

  await t.test('18. British Columbia Statutory & Seasonal Campaigns Endpoint', async () => {
    const resActive = await request(app).get('/api/campaigns/active');
    assert.equal(resActive.status, 200);
    assert.equal(resActive.body.success, true);
    assert.equal(resActive.body.timezone, 'America/Vancouver');

    const resCalendar = await request(app).get('/api/campaigns/calendar?year=2026');
    assert.equal(resCalendar.status, 200);
    assert.equal(resCalendar.body.success, true);
    assert.equal(resCalendar.body.year, 2026);
    assert.equal(resCalendar.body.count, 16);
    assert.ok(Array.isArray(resCalendar.body.campaigns));

    // Verify key holidays exist in calculated calendar
    const ids = resCalendar.body.campaigns.map(c => c.id);
    assert.ok(ids.includes('new-years'));
    assert.ok(ids.includes('valentines'));
    assert.ok(ids.includes('family-day'));
    assert.ok(ids.includes('easter'));
    assert.ok(ids.includes('victoria-day'));
    assert.ok(ids.includes('canada-day'));
    assert.ok(ids.includes('bc-day'));
    assert.ok(ids.includes('labour-day'));
    assert.ok(ids.includes('truth-and-reconciliation'));
    assert.ok(ids.includes('thanksgiving'));
    assert.ok(ids.includes('halloween'));
    assert.ok(ids.includes('remembrance-day'));
    assert.ok(ids.includes('black-friday'));
    assert.ok(ids.includes('cyber-monday'));
    assert.ok(ids.includes('christmas'));
    assert.ok(ids.includes('boxing-day-week'));
  });

  await t.test('19. Campaign Date Simulation & Expiry Automation', async () => {
    // Halloween active window (Oct 28 - Oct 31)
    const resHalloween = await request(app).get('/api/campaigns/active?simulate_date=2026-10-30T12:00:00');
    assert.equal(resHalloween.status, 200);
    assert.equal(resHalloween.body.active, true);
    assert.equal(resHalloween.body.campaign.id, 'halloween');
    assert.equal(resHalloween.body.campaign.discountPercentage, 10);

    // Black Friday active window
    const resBF = await request(app).get('/api/campaigns/active?simulate_date=2026-11-27T12:00:00');
    assert.equal(resBF.status, 200);
    assert.equal(resBF.body.active, true);
    assert.equal(resBF.body.campaign.id, 'black-friday');

    // Canada Day active window
    const resCanadaDay = await request(app).get('/api/campaigns/active?simulate_date=2026-07-01T12:00:00');
    assert.equal(resCanadaDay.status, 200);
    assert.equal(resCanadaDay.body.active, true);
    assert.equal(resCanadaDay.body.campaign.id, 'canada-day');

    // Non-holiday date in May (May 5, 2026) -> No campaign active
    const resInactive = await request(app).get('/api/campaigns/active?simulate_date=2026-05-05T12:00:00');
    assert.equal(resInactive.status, 200);
    assert.equal(resInactive.body.active, false);
    assert.equal(resInactive.body.campaign, null);
  });
});
