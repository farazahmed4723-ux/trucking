/**
 * SPN TRUCKING LTD. — CORE FRONTEND CLIENT CONTROLLER
 * Calgary, Alberta, Canada
 * 
 * Features:
 * - Real API integration for Quote submissions (/api/quotes) with photo uploads
 * - Genuine Customer Reviews loading & submission modal (/api/reviews)
 * - Clickable phone dispatch links (778-302-8803)
 * - Dynamic form fields based on service selection
 * - Mobile navigation drawer and sticky navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileDrawer();
  initQuoteForm();
  initReviewsSection();
  initReviewModal();
  initFAQAccordion();
  initPhoneLinks();
});

/* ===================================================================
   1. STICKY HEADER & SCROLL BEHAVIOR
   =================================================================== */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ===================================================================
   2. ACCESSIBLE MOBILE DRAWER
   =================================================================== */
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const closeBtn = document.getElementById('mobile-drawer-close');

  if (!toggleBtn || !drawer || !backdrop) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('modal-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    closeBtn?.focus();
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.focus();
  };

  toggleBtn.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* ===================================================================
   3. VERIFIED DISPATCH PHONE ACTIONS
   =================================================================== */
function initPhoneLinks() {
  const phone = '778-302-8803';
  const telHref = 'tel:7783028803';

  document.querySelectorAll('.js-call-btn').forEach(btn => {
    btn.setAttribute('href', telHref);
    if (!btn.getAttribute('title')) {
      btn.setAttribute('title', `Call Abbas at SPN Trucking (${phone})`);
    }
  });
}

/* ===================================================================
   4. FULL-STACK QUOTE REQUEST FORM (REAL API & SQL)
   =================================================================== */
function initQuoteForm() {
  const form = document.getElementById('spn-quote-form') || document.getElementById('inzmam-quote-form');
  const serviceSelect = document.getElementById('quote-service-select');
  const panelMoving = document.getElementById('panel-moving-trucking');
  const panelJunkGardening = document.getElementById('panel-junk-gardening');
  const photoInput = document.getElementById('quote-photos');
  const photoPreview = document.getElementById('photo-preview-name');
  const feedbackBox = document.getElementById('quote-form-feedback');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form || !serviceSelect) return;

  // React to service changes
  const updateConditionalPanels = () => {
    const selected = serviceSelect.value;
    const movingCategories = [
      'residential-moving', 'commercial-moving', 'industrial-moving',
      'trucking', 'small-load-transportation', 'flatbed-trucking', 'refrigerated-trucking'
    ];
    const haulingCategories = ['junk-removal', 'garbage-removal', 'gardening'];

    if (movingCategories.includes(selected)) {
      panelMoving?.classList.add('active');
      panelJunkGardening?.classList.remove('active');
    } else if (haulingCategories.includes(selected)) {
      panelMoving?.classList.remove('active');
      panelJunkGardening?.classList.add('active');
    } else {
      panelMoving?.classList.remove('active');
      panelJunkGardening?.classList.remove('active');
    }
  };

  serviceSelect.addEventListener('change', updateConditionalPanels);
  updateConditionalPanels();

  // Photo upload preview
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        photoPreview.textContent = `Selected: ${files[0].name} (${Math.round(files[0].size / 1024)} KB)`;
        photoPreview.style.display = 'block';
      } else {
        photoPreview.style.display = 'none';
      }
    });
  }

  // Real API Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:8px;"></span>
        Processing Quote Request...
      `;
    }

    if (feedbackBox) {
      feedbackBox.className = 'form-feedback';
      feedbackBox.innerHTML = '';
      feedbackBox.style.display = 'none';
    }

    try {
      const formData = new FormData(form);

      const response = await fetch('/api/quotes', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        feedbackBox.className = 'form-feedback success';
        feedbackBox.style.display = 'block';
        feedbackBox.innerHTML = `
          <div style="background:rgba(16,185,129,0.12); border:1px solid #10B981; border-radius:12px; padding:1.25rem; color:#FFFFFF;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <h4 style="margin:0; font-size:1.15rem; color:#10B981; font-weight:700;">Quote Registered: ${data.ref_id}</h4>
            </div>
            <p style="margin:0 0 0.75rem; font-size:0.95rem; line-height:1.5; color:rgba(255,255,255,0.9);">
              Thank you, <strong>${formData.get('fullName')}</strong>. Your request has been securely recorded in our dispatch system.
            </p>
            <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:0.75rem; font-size:0.85rem; line-height:1.4; color:rgba(255,255,255,0.8);">
              <div>• <strong>Reference ID:</strong> <span style="color:#D4AF37; font-weight:700;">${data.ref_id}</span></div>
              <div>• <strong>Dispatch Notification:</strong> Queued for Abbas, Managing Director</div>
              <div>• <strong>Immediate Assistance:</strong> Call directly at <a href="tel:7783028803" style="color:#F5A623; font-weight:700;">778-302-8803</a></div>
            </div>
          </div>
        `;
        form.reset();
        if (photoPreview) photoPreview.style.display = 'none';
      } else {
        feedbackBox.className = 'form-feedback error';
        feedbackBox.style.display = 'block';
        feedbackBox.innerHTML = `
          <div style="background:rgba(239,68,68,0.12); border:1px solid #EF4444; border-radius:12px; padding:1.25rem; color:#FFFFFF;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <strong style="color:#EF4444; font-size:1rem;">Submission Attention</strong>
            </div>
            <p style="margin:0; font-size:0.9rem; line-height:1.5;">${data.error || 'Unable to record quote. Please call 778-302-8803.'}</p>
          </div>
        `;
      }
    } catch (err) {
      feedbackBox.className = 'form-feedback error';
      feedbackBox.style.display = 'block';
      feedbackBox.innerHTML = `
        <div style="background:rgba(239,68,68,0.12); border:1px solid #EF4444; border-radius:12px; padding:1.25rem; color:#FFFFFF;">
          <p style="margin:0; font-size:0.9rem;">Network error connecting to dispatch server. Please call Abbas directly at <a href="tel:7783028803" style="color:#F5A623; font-weight:700;">778-302-8803</a>.</p>
        </div>
      `;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Submit Quote Request</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        `;
      }
    }
  });
}

/* ===================================================================
   5. REAL CUSTOMER REVIEWS (NO FAKE METRICS / MODERATED ONLY)
   =================================================================== */
async function initReviewsSection() {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();

    if (data.success && data.reviews && data.reviews.length > 0) {
      let html = '<div class="testimonials-grid">';
      data.reviews.forEach(r => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        html += `
          <div class="testimonial-card">
            <div class="testimonial-stars" style="color:#D4AF37; font-size:1.15rem; margin-bottom:0.75rem;">${stars}</div>
            <p class="testimonial-text" style="font-size:0.95rem; line-height:1.6; color:rgba(255,255,255,0.85); margin-bottom:1rem;">
              "${escapeHtml(r.review_text)}"
            </p>
            <div class="testimonial-author">
              <strong style="color:#FFF; display:block;">${escapeHtml(r.customer_name)}</strong>
              <span style="font-size:0.8rem; color:#D4AF37;">${escapeHtml(r.service_name || 'Verified Client')} • ${escapeHtml(r.review_date || 'Calgary, AB')}</span>
              ${r.verified ? '<span class="verified-badge" style="display:inline-block; margin-left:6px; font-size:0.7rem; background:rgba(16,185,129,0.15); color:#10B981; padding:2px 6px; border-radius:4px; font-weight:600;">✓ Verified Client</span>' : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
    } else {
      // Elegant Coming Soon State if no verified reviews yet published
      container.innerHTML = `
        <div class="reviews-coming-soon-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(212,175,55,0.25); border-radius:16px; padding:2.5rem; text-align:center; max-width:760px; margin:0 auto;">
          <div style="font-size:2rem; margin-bottom:0.75rem;">🌟</div>
          <h3 style="color:#FFFFFF; font-size:1.4rem; margin-bottom:0.5rem; font-weight:700;">Customer Reviews & Feedback</h3>
          <p style="color:rgba(255,255,255,0.7); font-size:0.95rem; max-width:540px; margin:0 auto 1.5rem; line-height:1.6;">
            We preserve strict review authenticity and never generate fake ratings. If you have completed a move or transport job with SPN Trucking Ltd. in Calgary, we welcome your authentic feedback!
          </p>
          <button class="btn btn-primary js-open-review-modal">
            <span>Leave a Customer Review</span>
          </button>
        </div>
      `;
      // Bind newly rendered button
      container.querySelector('.js-open-review-modal')?.addEventListener('click', openReviewModal);
    }
  } catch (err) {
    console.error('Failed to load reviews:', err);
  }
}

/* ===================================================================
   6. CUSTOMER REVIEW SUBMISSION MODAL
   =================================================================== */
function initReviewModal() {
  document.querySelectorAll('.js-open-review-modal').forEach(btn => {
    btn.addEventListener('click', openReviewModal);
  });

  const form = document.getElementById('review-submit-form');
  const modal = document.getElementById('review-modal');
  const closeBtn = document.getElementById('review-modal-close');
  const feedback = document.getElementById('review-form-feedback');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customerName = form.querySelector('[name="customerName"]').value;
      const serviceName = form.querySelector('[name="serviceName"]').value;
      const rating = form.querySelector('[name="rating"]').value;
      const reviewText = form.querySelector('[name="reviewText"]').value;
      const website_hp = form.querySelector('[name="website_hp"]')?.value || '';

      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerName, serviceName, rating, reviewText, website_hp })
        });
        const data = await res.json();

        if (feedback) {
          feedback.style.display = 'block';
          if (data.success) {
            feedback.innerHTML = `<div style="color:#10B981; background:rgba(16,185,129,0.1); padding:0.75rem; border-radius:8px;">${data.message}</div>`;
            form.reset();
            setTimeout(() => {
              modal?.classList.remove('open');
              document.body.classList.remove('modal-open');
            }, 3000);
          } else {
            feedback.innerHTML = `<div style="color:#EF4444; background:rgba(239,68,68,0.1); padding:0.75rem; border-radius:8px;">${data.error}</div>`;
          }
        }
      } catch (err) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.innerHTML = `<div style="color:#EF4444;">Network connection error.</div>`;
        }
      }
    });
  }
}

function openReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('modal-open');
  }
}

/* ===================================================================
   7. ACCORDION (FAQ)
   =================================================================== */
function initFAQAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
