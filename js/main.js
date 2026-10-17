/**
 * STN TRUCKING LTD. — CORE FRONTEND CLIENT CONTROLLER
 * Surrey & Vancouver, British Columbia, Canada
 * 
 * Features:
 * - Real API integration for Quote submissions (/api/quotes) with photo uploads
 * - Filterable Premium Vehicle & Service Gallery (/api/gallery) with Lightbox
 * - Genuine Customer Reviews loading & submission modal (/api/reviews)
 * - Clickable phone dispatch links (778-302-8803)
 * - Dynamic form fields based on service selection
 * - Mobile navigation drawer and sticky navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileDrawer();
  initHeroFleetSlider();
  initQuoteForm();
  initGallery();
  initReviewsSection();
  initReviewModal();
  initFAQAccordion();
  initPhoneLinks();
  initFleetCarousel();
  initScrollReveal();
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
      btn.setAttribute('title', `Call Abbas at STN Trucking (${phone})`);
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
      'flatbed-trucking', 'small-load-transportation', 'trucking',
      'refrigerated-trucking', 'beverage-transportation',
      'residential-moving', 'commercial-moving', 'industrial-moving'
    ];
    const haulingCategories = ['junk-removal', 'garbage-removal', 'gardening', 'tool-services'];

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
              Thank you, <strong>${escapeHtml(formData.get('fullName'))}</strong>. Your request has been securely recorded in our dispatch system with a <strong>PENDING</strong> review status.
            </p>
            <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:0.75rem; font-size:0.85rem; line-height:1.4; color:rgba(255,255,255,0.8);">
              <div>• <strong>Reference ID:</strong> <span style="color:#D4AF37; font-weight:700;">${data.ref_id}</span></div>
              <div>• <strong>Dispatch Notification:</strong> Abbas (Managing Director) will review specifications and confirm availability</div>
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

// Global helper to select service and scroll to quote form
window.selectServiceAndScroll = function(serviceSlug) {
  const serviceSelect = document.getElementById('quote-service-select');
  if (serviceSelect && serviceSlug) {
    serviceSelect.value = serviceSlug;
    serviceSelect.dispatchEvent(new Event('change'));
  }
  const quoteSection = document.getElementById('quote-section');
  if (quoteSection) {
    quoteSection.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ===================================================================
   5. FILTERABLE VEHICLE & SERVICE IMAGE GALLERY
   =================================================================== */
function initGallery() {
  const container = document.getElementById('gallery-items-container');
  const filterButtons = document.querySelectorAll('.gallery-filter-btn');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('gallery-lightbox-img');
  const lightboxTitle = document.getElementById('gallery-lightbox-title');
  const lightboxCaption = document.getElementById('gallery-lightbox-caption');
  const lightboxBadge = document.getElementById('gallery-lightbox-badge');
  const lightboxClose = document.getElementById('gallery-lightbox-close');

  if (!container) return;

  const filterCards = (category) => {
    const cards = container.querySelectorAll('.gallery-card');
    cards.forEach(card => {
      const cardCat = card.getAttribute('data-category');
      if (category === 'all' || cardCat === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter') || 'all';
      filterCards(filter);
    });
  });

  // Lightbox click handler
  container.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card');
    if (!card || !lightbox) return;

    const img = card.querySelector('.gallery-img');
    const title = card.querySelector('.gallery-card-title')?.textContent || '';
    const caption = card.querySelector('.gallery-card-caption')?.textContent || '';
    const isVerified = card.getAttribute('data-type') === 'verified_fleet';

    if (lightboxImg && img) lightboxImg.src = img.src;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxBadge) {
      lightboxBadge.textContent = isVerified ? '✓ Verified Fleet Asset' : 'Illustrative Category Representation';
      lightboxBadge.className = isVerified ? 'gallery-type-badge verified' : 'gallery-type-badge illustrative';
    }

    lightbox.classList.add('open');
    document.body.classList.add('modal-open');
  });

  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('modal-open');
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        lightbox.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
    });
  }
}

/* ===================================================================
   6. REAL CUSTOMER REVIEWS (AUTHENTIC TESTIMONIALS ONLY)
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
              <span style="font-size:0.8rem; color:#D4AF37;">${escapeHtml(r.service_name || 'Verified Client')} • ${escapeHtml(r.review_date || 'BC, Canada')}</span>
              ${r.verified ? '<span class="verified-badge" style="display:inline-block; margin-left:6px; font-size:0.7rem; background:rgba(16,185,129,0.15); color:#10B981; padding:2px 6px; border-radius:4px; font-weight:600;">✓ Verified Client</span>' : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
    } else {
      // Exact prompt requirement: If none are available, display "Customer Reviews Coming Soon."
      container.innerHTML = `
        <div class="reviews-coming-soon-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(212,175,55,0.25); border-radius:16px; padding:2.5rem; text-align:center; max-width:760px; margin:0 auto;">
          <div style="font-size:2rem; margin-bottom:0.75rem;">🌟</div>
          <h3 style="color:#FFFFFF; font-size:1.4rem; margin-bottom:0.5rem; font-weight:700;">Customer Reviews Coming Soon</h3>
          <p style="color:rgba(255,255,255,0.7); font-size:0.95rem; max-width:540px; margin:0 auto 1.5rem; line-height:1.6;">
            We preserve strict review authenticity and never generate fake ratings or testimonials. If you have completed a move or hauling job with STN Trucking Ltd. across Surrey, Vancouver, or the Lower Mainland, we welcome your authentic feedback!
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
   7. CUSTOMER REVIEW SUBMISSION MODAL
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
   8. ACCORDION (FAQ)
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

/* ===================================================================
   9. PHONE DISPATCH CLICK-TO-CALL
   =================================================================== */
function initPhoneLinks() {
  const phoneLinks = document.querySelectorAll('a[href*="778-302-8803"], a[href*="7783028803"]');
  phoneLinks.forEach(link => {
    link.setAttribute('href', 'tel:+17783028803');
    link.setAttribute('aria-label', 'Call STN Trucking dispatch at 778-302-8803');
  });
}

/* ===================================================================
   10. INTERACTIVE FLEET & TRAILER CAROUSEL SLIDER
   =================================================================== */
function initFleetCarousel() {
  const track = document.getElementById('fleet-carousel-track');
  const prevBtn = document.getElementById('fleet-prev-btn');
  const nextBtn = document.getElementById('fleet-next-btn');
  const dotsContainer = document.getElementById('fleet-carousel-dots');
  const carouselContainer = document.querySelector('.fleet-carousel-wrapper');

  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.fleet-carousel-slide'));
  if (!slides.length) return;

  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideInterval = 5000;

  function getVisibleSlidesCount() {
    if (window.innerWidth >= 1100) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function getMaxIndex() {
    const visible = getVisibleSlidesCount();
    return Math.max(0, slides.length - visible);
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const maxIdx = getMaxIndex();
    for (let i = 0; i <= maxIdx; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
      dot.setAttribute('type', 'button');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        restartTimer();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function goToSlide(index) {
    const maxIdx = getMaxIndex();
    if (index > maxIdx) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = maxIdx;
    } else {
      currentIndex = index;
    }

    const visible = getVisibleSlidesCount();
    const percentShift = (currentIndex * (100 / visible));
    track.style.transform = `translateX(-${percentShift}%)`;
    updateDots();
  }

  function startTimer() {
    stopTimer();
    autoSlideTimer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, slideInterval);
  }

  function stopTimer() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  function restartTimer() {
    stopTimer();
    startTimer();
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
      restartTimer();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
      restartTimer();
    });
  }

  // Hover & Focus pausing
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopTimer);
    carouselContainer.addEventListener('mouseleave', startTimer);
    carouselContainer.addEventListener('focusin', stopTimer);
    carouselContainer.addEventListener('focusout', startTimer);
  }

  // Visibility change pause (when switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  // Touch Swipe Gesture detection
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    stopTimer();
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex - 1);
      }
    }
    startTimer();
  }, { passive: true });

  // Responsive re-calc on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      buildDots();
      goToSlide(Math.min(currentIndex, getMaxIndex()));
    }, 150);
  });

  buildDots();
  goToSlide(0);
  startTimer();
}

/* ===================================================================
   11. SCROLL REVEAL MOTION OBSERVER
   =================================================================== */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ===================================================================
   12. HERO AUTO-MOVING FLEET SHOWCASE SLIDER
   Smoothly auto-transitions trucks and services every 3.8 seconds
   =================================================================== */
function initHeroFleetSlider() {
  const card = document.getElementById('hero-slider-card');
  if (!card) return;

  const imgEl = document.getElementById('hero-slide-img');
  const catEl = document.getElementById('hero-slide-category');
  const badgeEl = document.getElementById('hero-slide-badge');
  const pillEl = document.getElementById('hero-slide-pill');
  const titleEl = document.getElementById('hero-slide-title');
  const descEl = document.getElementById('hero-slide-desc');
  const progressBar = document.getElementById('hero-slider-progress');
  const dotsContainer = document.getElementById('hero-slider-dots');
  const prevBtn = document.getElementById('hero-slider-prev');
  const nextBtn = document.getElementById('hero-slider-next');

  const fleetSlides = [
    {
      img: 'assets/fleet/fleet_53ft_long_haul.jpg',
      category: '53 FT Highway Long-Haul',
      badge: 'Surrey & Vancouver ↔ BC Highways',
      pill: 'Inter-City Linehaul',
      title: '53 FT Highway Tractor-Trailers',
      desc: 'Heavy-duty highway tractors and 53 ft dry van trailers for linehaul commercial freight across British Columbia and Western Canada.'
    },
    {
      img: 'assets/fleet/fleet_junk_removal_truck.jpg',
      category: 'Junk Removal & Hauling',
      badge: 'Eco Cleanouts • Surrey & Vancouver',
      pill: 'Full-Service Disposal',
      title: 'Heavy Cleanout Dump Trucks',
      desc: 'High-capacity dump trucks configured for household cleanouts, renovation scrap, mattress disposal, and waste carting.'
    },
    {
      img: 'assets/fleet/fleet_residential_moving.jpg',
      category: 'Residential Moving',
      badge: 'Apartments, Condos & Houses',
      pill: 'Careful Relocation',
      title: 'Residential Moving Box Trucks',
      desc: 'Dedicated moving trucks equipped with quilted furniture blankets, heavy dollies, and professional loading crews.'
    },
    {
      img: 'assets/fleet/fleet_flatbed_truck.jpg',
      category: 'Flatbed Trucking',
      badge: 'Open-Deck Equipment Transport',
      pill: 'Industrial & Jobsite',
      title: 'Medium & Heavy Flatbed Trucks',
      desc: 'Open-deck flatbed transport for structural steel, construction lumber, pipes, crated machinery, and jobsite gear across BC.'
    },
    {
      img: 'assets/fleet/fleet_commercial_moving.jpg',
      category: 'Commercial Moving',
      badge: 'Business Parks & Office Relocations',
      pill: 'Minimal Downtime',
      title: 'Corporate Office Freight Trucks',
      desc: 'Commercial box trucks and logistics teams for office workstation transfers and retail business relocations.'
    },
    {
      img: 'assets/fleet/fleet_garbage_removal.jpg',
      category: 'Garbage & Debris Disposal',
      badge: 'Certified Lower Mainland Facilities',
      pill: 'Heavy Debris Hauling',
      title: 'Construction & Garbage Dump Haulers',
      desc: 'Authorized waste disposal vehicles hauling residential, commercial, and renovation debris to certified regional transfer stations.'
    },
    {
      img: 'assets/fleet/fleet_refrigerated_truck.jpg',
      category: 'Cold Chain Logistics',
      badge: 'Temperature-Controlled Reefer',
      pill: 'Perishables & Food Supply',
      title: 'Refrigerated & Insulated Units',
      desc: 'Food-grade inspected insulated trucks with Thermo King units for temperature-sensitive perishables across BC.'
    },
    {
      img: 'assets/fleet/fleet_gardening_yard_cleanup.jpg',
      category: 'Gardening & Yard Cleanup',
      badge: 'Surrey & Vancouver Properties',
      pill: 'Green Waste Composting',
      title: 'Yard Debris & Landscaping Trucks',
      desc: 'Fallen branches, lawn trimmings, hedge clippings, and seasonal property clearing transported to organic composting facilities.'
    }
  ];

  let currentIdx = 0;
  let progressTimer = null;
  const slideDuration = 3800; // 3.8 seconds per slide
  let isPaused = false;

  // Build interactive indicator dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    fleetSlides.forEach((slide, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('type', 'button');
      dot.setAttribute('aria-label', `View ${slide.category}`);
      dot.addEventListener('click', () => {
        showSlide(i);
        startTimer();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.hero-slider-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIdx);
    });
  }

  function showSlide(index) {
    currentIdx = (index + fleetSlides.length) % fleetSlides.length;
    const slide = fleetSlides[currentIdx];

    // Smooth image transition with subtle zoom
    if (imgEl) {
      imgEl.style.opacity = '0.35';
      imgEl.classList.remove('anim-zoom');
      setTimeout(() => {
        imgEl.src = slide.img;
        imgEl.alt = slide.title;
        imgEl.style.opacity = '1';
        imgEl.classList.add('anim-zoom');
      }, 180);
    }

    if (catEl) catEl.textContent = slide.category;
    if (badgeEl) badgeEl.textContent = slide.badge;
    if (pillEl) pillEl.textContent = slide.pill;

    if (titleEl) {
      titleEl.style.opacity = '0';
      titleEl.style.transform = 'translateY(5px)';
      setTimeout(() => {
        titleEl.textContent = slide.title;
        titleEl.style.opacity = '1';
        titleEl.style.transform = 'translateY(0)';
      }, 160);
    }

    if (descEl) {
      descEl.style.opacity = '0';
      setTimeout(() => {
        descEl.textContent = slide.desc;
        descEl.style.opacity = '1';
      }, 190);
    }

    updateDots();
  }

  function startTimer() {
    clearInterval(progressTimer);
    if (progressBar) progressBar.style.width = '0%';

    let elapsed = 0;
    const step = 50;

    progressTimer = setInterval(() => {
      if (!isPaused) {
        elapsed += step;
        const pct = Math.min(100, (elapsed / slideDuration) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (elapsed >= slideDuration) {
          showSlide(currentIdx + 1);
          elapsed = 0;
          if (progressBar) progressBar.style.width = '0%';
        }
      }
    }, step);
  }

  // Hover pauses the timer so client can inspect details comfortably
  card.addEventListener('mouseenter', () => { isPaused = true; });
  card.addEventListener('mouseleave', () => { isPaused = false; });

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showSlide(currentIdx - 1);
      startTimer();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showSlide(currentIdx + 1);
      startTimer();
    });
  }

  // Initialize first slide and kick off timer
  showSlide(0);
  startTimer();
}

