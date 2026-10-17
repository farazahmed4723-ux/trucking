/**
 * STN TRUCKING LTD. — ADMIN BACKOFFICE CONTROLLER
 * Surrey & Vancouver, British Columbia, Canada
 * 
 * Handles:
 * - Authentication & Session Management
 * - Quote status workflow (Pending, Hold, Approved, Rejected, Released)
 * - Services directory & descriptions management
 * - Fleet specifications & payload limits
 * - Gallery & Hero imagery upload, toggles, verified/illustrative tags
 * - Promotions management (10% student & holiday discounts)
 * - Site Settings, British Columbia service areas & SEO metadata
 * - Authentic customer reviews moderation
 * - Notifications log & audit trail
 */

let currentToken = localStorage.getItem('spn_admin_token') || '';
let activeTab = 'quotes';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initModals();
});

/* ===================================================================
   1. AUTHENTICATION & SESSION
   =================================================================== */
function initAuth() {
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('admin-logout-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          currentToken = data.token;
          localStorage.setItem('spn_admin_token', currentToken);
          document.getElementById('admin-user-display').textContent = data.admin.name;
          showDashboard();
        } else {
          errorDiv.textContent = data.error || 'Login failed.';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Server connection error.';
        errorDiv.style.display = 'block';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      currentToken = '';
      localStorage.removeItem('spn_admin_token');
      showLogin();
    });
  }

  if (currentToken) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('dashboard-view').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
  loadDashboardData();
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentToken}`
  };
}

/* ===================================================================
   2. TABS & DATA LOADING
   =================================================================== */
function initTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-tab');

      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      const pane = document.getElementById(`tab-content-${activeTab}`);
      if (pane) pane.style.display = 'block';

      loadTabData(activeTab);
    });
  });

  // Quotes filters
  document.getElementById('filter-quote-status')?.addEventListener('change', loadQuotes);
  document.getElementById('search-quotes')?.addEventListener('input', debounce(loadQuotes, 300));
  document.getElementById('refresh-quotes-btn')?.addEventListener('click', loadQuotes);
}

function loadDashboardData() {
  loadMetrics();
  loadQuotes();
}

function loadTabData(tab) {
  if (tab === 'quotes') loadQuotes();
  else if (tab === 'services') loadServices();
  else if (tab === 'fleet') loadFleet();
  else if (tab === 'gallery') loadGallery();
  else if (tab === 'promotions') loadPromotions();
  else if (tab === 'settings') loadSettings();
  else if (tab === 'reviews') loadReviews();
  else if (tab === 'notifications') loadNotifications();
  else if (tab === 'audit') loadAudit();
}

/* ===================================================================
   3. METRICS
   =================================================================== */
async function loadMetrics() {
  try {
    const res = await fetch('/api/admin/metrics', { headers: authHeaders() });
    if (res.status === 401) return handleUnauthorized();
    const data = await res.json();
    if (data.success) {
      document.getElementById('metric-total-quotes').textContent = data.metrics.totalQuotes;
      document.getElementById('metric-pending-quotes').textContent = data.metrics.pendingQuotes;
      document.getElementById('metric-hold-quotes').textContent = data.metrics.holdQuotes;
      document.getElementById('metric-approved-quotes').textContent = data.metrics.approvedQuotes;
      document.getElementById('metric-pending-reviews').textContent = data.metrics.pendingReviews;
    }
  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
}

/* ===================================================================
   4. QUOTES & BOOKINGS
   =================================================================== */
async function loadQuotes() {
  const tbody = document.getElementById('quotes-table-body');
  if (!tbody) return;

  const status = document.getElementById('filter-quote-status')?.value || 'ALL';
  const search = document.getElementById('search-quotes')?.value || '';

  try {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.append('status', status);
    if (search.trim()) params.append('search', search.trim());

    const res = await fetch(`/api/admin/quotes?${params.toString()}`, { headers: authHeaders() });
    if (res.status === 401) return handleUnauthorized();
    const data = await res.json();

    if (!data.success || data.quotes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:rgba(255,255,255,0.6);">No quote requests matching criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = data.quotes.map(q => `
      <tr>
        <td><strong style="color:#D4AF37;">${escapeHtml(q.ref_id)}</strong></td>
        <td><strong>${escapeHtml(q.full_name)}</strong></td>
        <td>
          <div>${escapeHtml(q.phone)}</div>
          <small style="color:rgba(255,255,255,0.6);">${escapeHtml(q.email)}</small>
        </td>
        <td><span style="font-size:0.85rem;">${escapeHtml(q.service_category)}</span></td>
        <td>${escapeHtml(q.service_date || 'TBD')}</td>
        <td><span class="badge-status ${escapeHtml(q.status)}">${escapeHtml(q.status)}</span></td>
        <td><small style="color:rgba(255,255,255,0.6);">${escapeHtml(q.created_at?.split(' ')[0] || '')}</small></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openQuoteDetail(${q.id})">Inspect</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#EF4444; padding:2rem;">Failed to load quotes.</td></tr>';
  }
}

async function openQuoteDetail(id) {
  const modal = document.getElementById('quote-modal');
  const content = document.getElementById('quote-modal-content');
  if (!modal || !content) return;

  content.innerHTML = '<p style="text-align:center;">Loading quote details...</p>';
  modal.classList.add('open');

  try {
    const res = await fetch(`/api/admin/quotes/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) {
      content.innerHTML = `<p style="color:#EF4444;">${data.error || 'Quote not found.'}</p>`;
      return;
    }

    const q = data.quote;
    content.innerHTML = `
      <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:1.4rem; color:#FFF; margin:0;">Quote: ${escapeHtml(q.ref_id)}</h2>
          <span class="badge-status ${escapeHtml(q.status)}" style="margin-top:6px;">${escapeHtml(q.status)}</span>
        </div>
        <div style="text-align:right;">
          <small style="color:rgba(255,255,255,0.6);">Received: ${escapeHtml(q.created_at)}</small>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; font-size:0.9rem;">
        <div>
          <p><strong>Customer:</strong> ${escapeHtml(q.full_name)}</p>
          <p><strong>Phone:</strong> <a href="tel:${escapeHtml(q.phone)}" style="color:#D4AF37;">${escapeHtml(q.phone)}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(q.email)}" style="color:#D4AF37;">${escapeHtml(q.email)}</a></p>
          <p><strong>Service:</strong> ${escapeHtml(q.service_category)} (${escapeHtml(q.job_type || 'residential')})</p>
        </div>
        <div>
          <p><strong>Date / Window:</strong> ${escapeHtml(q.service_date || 'TBD')} ${escapeHtml(q.service_time ? '(' + q.service_time + ')' : '')}</p>
          <p><strong>Pickup:</strong> ${escapeHtml(q.pickup_location || 'Not provided')}</p>
          <p><strong>Dropoff:</strong> ${escapeHtml(q.dropoff_location || 'Not provided')}</p>
          <p><strong>Discount Code:</strong> ${escapeHtml(q.discount_code || 'None')}</p>
        </div>
      </div>

      <div style="margin-bottom:1.5rem;">
        <strong>Load Description:</strong>
        <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:0.85rem; margin-top:0.35rem; font-size:0.9rem; line-height:1.5;">
          ${escapeHtml(q.load_description)}
        </div>
      </div>

      ${q.additional_instructions ? `
        <div style="margin-bottom:1.5rem;">
          <strong>Access / Instructions:</strong>
          <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:0.85rem; margin-top:0.35rem; font-size:0.9rem;">
            ${escapeHtml(q.additional_instructions)}
          </div>
        </div>
      ` : ''}

      ${q.photo_path ? `
        <div style="margin-bottom:1.5rem;">
          <strong>Uploaded Photograph:</strong>
          <div style="margin-top:0.5rem;">
            <a href="${escapeHtml(q.photo_path)}" target="_blank" style="display:inline-block; max-width:280px; border:1px solid #D4AF37; border-radius:8px; overflow:hidden;">
              <img src="${escapeHtml(q.photo_path)}" alt="Quote Asset" style="width:100%; display:block;">
            </a>
          </div>
        </div>
      ` : ''}

      <!-- Status Management Workflow -->
      <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem;">
        <h4 style="margin:0 0 1rem; color:#D4AF37; font-size:1.05rem;">Dispatch Action & Status Workflow</h4>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <button class="btn btn-outline btn-sm" onclick="updateStatus(${q.id}, 'HOLD', 24)">24h Hold ⏳</button>
          <button class="btn btn-outline btn-sm" onclick="updateStatus(${q.id}, 'HOLD', 48)">48h Hold ⏳</button>
          <button class="btn btn-primary btn-sm" onclick="updateStatus(${q.id}, 'APPROVED')">Approve Booking ✓</button>
          <button class="btn btn-outline btn-sm" style="border-color:#EF4444; color:#EF4444;" onclick="updateStatus(${q.id}, 'REJECTED')">Reject Quote ✗</button>
          <button class="btn btn-outline btn-sm" onclick="updateStatus(${q.id}, 'RELEASED')">Release Hold 🔓</button>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem;">Internal Dispatch Notes</label>
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="internal-notes-input" class="form-control" value="${escapeHtml(q.internal_notes || '')}" placeholder="Pricing details, vehicle assigned, customer agreement...">
            <button class="btn btn-secondary btn-sm" onclick="saveNotes(${q.id})">Save</button>
          </div>
        </div>
      </div>

      <!-- Audit History -->
      <div>
        <h4 style="font-size:1rem; margin-bottom:0.75rem; color:rgba(255,255,255,0.9);">Audit Trail</h4>
        <div style="max-height:160px; overflow-y:auto; font-size:0.8rem; background:rgba(255,255,255,0.02); border-radius:8px; padding:0.5rem;">
          ${data.auditTrail.map(a => `
            <div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.04); display:flex; justify-content:space-between;">
              <span><strong>${escapeHtml(a.action)}</strong> by ${escapeHtml(a.performed_by)}</span>
              <span style="color:rgba(255,255,255,0.5);">${escapeHtml(a.created_at)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<p style="color:#EF4444;">Error fetching quote details.</p>';
  }
}

async function updateStatus(id, status, holdHours) {
  try {
    const res = await fetch(`/api/admin/quotes/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, holdHours })
    });
    const data = await res.json();
    if (data.success) {
      openQuoteDetail(id);
      loadQuotes();
      loadMetrics();
    } else {
      alert(data.error || 'Failed to update status.');
    }
  } catch (err) {
    alert('Network error updating status.');
  }
}

async function saveNotes(id) {
  const notes = document.getElementById('internal-notes-input')?.value;
  try {
    const res = await fetch(`/api/admin/quotes/${id}/notes`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ internalNotes: notes })
    });
    const data = await res.json();
    if (data.success) {
      alert('Internal notes updated.');
    }
  } catch (err) {
    alert('Error saving notes.');
  }
}

/* ===================================================================
   5. SERVICES DIRECTORY MANAGEMENT
   =================================================================== */
async function loadServices() {
  const tbody = document.getElementById('services-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/services', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      tbody.innerHTML = data.services.map(s => `
        <tr>
          <td>${s.display_order}</td>
          <td>
            <strong>${escapeHtml(s.icon || '')} ${escapeHtml(s.title)}</strong>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${escapeHtml(s.slug)}</div>
          </td>
          <td><span style="font-size:0.8rem; background:rgba(212,175,55,0.1); color:#D4AF37; padding:2px 6px; border-radius:4px;">${escapeHtml(s.category)}</span></td>
          <td><small>${escapeHtml(s.service_area || 'Surrey, Vancouver & Lower Mainland')}</small></td>
          <td><small style="color:${s.confirmation_note ? '#F59E0B' : 'rgba(255,255,255,0.5)'};">${escapeHtml(s.confirmation_note || 'Standard Dispatch')}</small></td>
          <td>${s.is_active ? '<span style="color:#10B981; font-weight:700;">Active</span>' : '<span style="color:#EF4444;">Inactive</span>'}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="editService(${s.id})">Edit</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load services.</td></tr>';
  }
}

window.editService = async function(id) {
  try {
    const res = await fetch('/api/admin/services', { headers: authHeaders() });
    const data = await res.json();
    const service = data.services.find(s => s.id === id);
    if (!service) return;

    document.getElementById('service-edit-id').value = service.id;
    document.getElementById('service-slug').value = service.slug;
    document.getElementById('service-slug').disabled = true;
    document.getElementById('service-title').value = service.title;
    document.getElementById('service-category').value = service.category;
    document.getElementById('service-icon').value = service.icon || '🚚';
    document.getElementById('service-area').value = service.service_area || '';
    document.getElementById('service-confirmation').value = service.confirmation_note || '';
    document.getElementById('service-desc').value = service.short_desc;
    document.getElementById('service-image').value = service.image_url || '';
    document.getElementById('service-modal-title').textContent = `Edit Service: ${service.title}`;

    document.getElementById('service-modal').classList.add('open');
  } catch (e) {
    alert('Error preparing edit.');
  }
};

/* ===================================================================
   6. FLEET SPECIFICATIONS
   =================================================================== */
async function loadFleet() {
  const tbody = document.getElementById('fleet-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/fleet', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      tbody.innerHTML = data.fleet.map(f => `
        <tr>
          <td><strong>${escapeHtml(f.name)}</strong></td>
          <td>${escapeHtml(f.size_range)}</td>
          <td><strong style="color:#D4AF37;">${escapeHtml(f.payload_capacity)}</strong></td>
          <td>${escapeHtml(f.dimensions)}</td>
          <td><img src="${escapeHtml(f.image_url)}" alt="" style="width:60px; height:36px; object-fit:cover; border-radius:4px;"></td>
          <td>${f.is_active ? '<span style="color:#10B981; font-weight:700;">Active</span>' : '<span style="color:#EF4444;">Inactive</span>'}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="promptEditFleet(${f.id}, '${escapeHtml(f.name)}')">Update Specs</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load fleet specs.</td></tr>';
  }
}

window.promptEditFleet = async function(id, name) {
  const newPayload = prompt(`Enter updated payload capacity for ${name}:`);
  if (!newPayload) return;
  try {
    const res = await fetch(`/api/admin/fleet/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ payloadCapacity: newPayload })
    });
    const data = await res.json();
    if (data.success) {
      alert('Fleet specifications updated.');
      loadFleet();
    }
  } catch (err) {
    alert('Error updating fleet.');
  }
};

/* ===================================================================
   7. GALLERY & HERO IMAGERY MANAGEMENT
   =================================================================== */
async function loadGallery() {
  const tbody = document.getElementById('gallery-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/gallery', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      tbody.innerHTML = data.gallery.map(g => `
        <tr>
          <td><img src="${escapeHtml(g.image_url)}" alt="" style="width:70px; height:42px; object-fit:cover; border-radius:6px; border:1px solid rgba(212,175,55,0.3);"></td>
          <td>
            <strong>${escapeHtml(g.title)}</strong>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.6);">${escapeHtml(g.caption || '')}</div>
          </td>
          <td><span style="font-size:0.8rem; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px;">${escapeHtml(g.category)}</span></td>
          <td>
            ${g.image_type === 'verified_fleet' 
              ? '<span style="color:#10B981; font-weight:700; font-size:0.75rem;">✓ Verified Fleet</span>' 
              : '<span style="color:#94A3B8; font-size:0.75rem;">Illustrative</span>'}
          </td>
          <td>
            <button class="btn ${g.is_hero ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="toggleHeroImage(${g.id}, ${!g.is_hero})">
              ${g.is_hero ? '★ Hero Selected' : 'Make Hero'}
            </button>
          </td>
          <td>
            <button class="btn btn-outline btn-sm" style="color:#EF4444; border-color:#EF4444;" onclick="deleteGalleryImage(${g.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load gallery.</td></tr>';
  }
}

window.toggleHeroImage = async function(id, isHero) {
  try {
    const res = await fetch(`/api/admin/gallery/${id}/hero`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isHero })
    });
    const data = await res.json();
    if (data.success) loadGallery();
  } catch (err) {
    alert('Error setting hero image.');
  }
};

window.deleteGalleryImage = async function(id) {
  if (!confirm('Are you sure you want to remove this image from the gallery?')) return;
  try {
    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();
    if (data.success) loadGallery();
  } catch (err) {
    alert('Error deleting image.');
  }
};

/* ===================================================================
   8. PROMOTIONS MANAGEMENT
   =================================================================== */
async function loadPromotions() {
  const tbody = document.getElementById('promos-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/promotions', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      tbody.innerHTML = data.promos.map(p => `
        <tr>
          <td><strong style="color:#D4AF37;">${escapeHtml(p.code)}</strong></td>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td><span style="font-size:1rem; font-weight:800; color:#10B981;">${p.discount_percent}%</span></td>
          <td><small>${escapeHtml(p.description)}</small></td>
          <td>${p.is_active ? '<span style="color:#10B981; font-weight:700;">Active</span>' : '<span style="color:#EF4444;">Paused</span>'}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="togglePromoActive(${p.id}, ${!p.is_active})">
              ${p.is_active ? 'Pause' : 'Activate'}
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load promotions.</td></tr>';
  }
}

window.togglePromoActive = async function(id, isActive) {
  try {
    const res = await fetch(`/api/admin/promotions/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ isActive })
    });
    const data = await res.json();
    if (data.success) loadPromotions();
  } catch (err) {
    alert('Error updating promotion.');
  }
};

/* ===================================================================
   9. SETTINGS & SEO METADATA
   =================================================================== */
async function loadSettings() {
  try {
    const res = await fetch('/api/admin/settings', { headers: authHeaders() });
    const data = await res.json();
    if (data.success && data.settings) {
      const map = {};
      data.settings.forEach(s => { map[s.key] = s.value; });

      if (document.getElementById('setting-company-name')) document.getElementById('setting-company-name').value = map.company_name || '';
      if (document.getElementById('setting-contact-person')) document.getElementById('setting-contact-person').value = map.contact_person || '';
      if (document.getElementById('setting-contact-phone')) document.getElementById('setting-contact-phone').value = map.contact_phone || '';
      if (document.getElementById('setting-contact-email')) document.getElementById('setting-contact-email').value = map.contact_email || '';
      if (document.getElementById('setting-target-market')) document.getElementById('setting-target-market').value = map.target_market || '';
      if (document.getElementById('setting-primary-cities')) document.getElementById('setting-primary-cities').value = map.primary_cities || '';
      if (document.getElementById('setting-secondary-market')) document.getElementById('setting-secondary-market').value = map.secondary_market || '';
      if (document.getElementById('setting-domain-name')) document.getElementById('setting-domain-name').value = map.domain_name || '';
      if (document.getElementById('setting-hero-headline')) document.getElementById('setting-hero-headline').value = map.hero_headline || '';
      if (document.getElementById('setting-hero-supporting')) document.getElementById('setting-hero-supporting').value = map.hero_supporting || '';
      if (document.getElementById('setting-experience-verified')) document.getElementById('setting-experience-verified').value = map.experience_verified || 'verified';
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

/* ===================================================================
   10. REVIEWS MODERATION
   =================================================================== */
async function loadReviews() {
  const tbody = document.getElementById('reviews-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/reviews', { headers: authHeaders() });
    const data = await res.json();

    if (!data.success || data.reviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:rgba(255,255,255,0.6);">No customer reviews in database.</td></tr>';
      return;
    }

    tbody.innerHTML = data.reviews.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.customer_name)}</strong></td>
        <td><small>${escapeHtml(r.service_name)}</small></td>
        <td><span style="color:#D4AF37;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></td>
        <td><div style="max-width:320px; font-size:0.85rem; line-height:1.4;">${escapeHtml(r.review_text)}</div></td>
        <td>${r.verified ? '<span style="color:#10B981; font-weight:700;">✓ Verified</span>' : '<span style="color:rgba(255,255,255,0.4);">Unverified</span>'}</td>
        <td>${r.is_approved ? '<span class="badge-status APPROVED">Approved</span>' : '<span class="badge-status PENDING">Pending</span>'}</td>
        <td>
          <div style="display:flex; gap:4px;">
            ${r.is_approved ? `
              <button class="btn btn-outline btn-sm" onclick="moderateReview(${r.id}, 0)">Unpublish</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="moderateReview(${r.id}, 1)">Approve</button>
            `}
            <button class="btn btn-outline btn-sm" style="border-color:#EF4444; color:#EF4444;" onclick="deleteReview(${r.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load reviews.</td></tr>';
  }
}

window.moderateReview = async function(id, isApproved) {
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isApproved: !!isApproved })
    });
    const data = await res.json();
    if (data.success) {
      loadReviews();
      loadMetrics();
    }
  } catch (err) {
    alert('Error moderating review.');
  }
};

window.deleteReview = async function(id) {
  if (!confirm('Permanently delete review?')) return;
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();
    if (data.success) {
      loadReviews();
      loadMetrics();
    }
  } catch (err) {
    alert('Error deleting review.');
  }
};

/* ===================================================================
   11. NOTIFICATIONS & AUDIT TRAIL
   =================================================================== */
async function loadNotifications() {
  const tbody = document.getElementById('notifications-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/notifications', { headers: authHeaders() });
    const data = await res.json();
    if (!data.success || data.notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">No notification logs.</td></tr>';
      return;
    }
    tbody.innerHTML = data.notifications.map(n => `
      <tr>
        <td><small>${escapeHtml(n.created_at)}</small></td>
        <td><strong>${escapeHtml(n.channel)}</strong></td>
        <td>${escapeHtml(n.recipient)}</td>
        <td><span class="badge-status ${n.status === 'DELIVERED' ? 'APPROVED' : 'PENDING'}">${escapeHtml(n.status)}</span></td>
        <td>${escapeHtml(n.provider)}</td>
        <td><small style="color:rgba(255,255,255,0.7);">${escapeHtml(n.response_message || 'OK')}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load notifications.</td></tr>';
  }
}

async function loadAudit() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/audit-logs', { headers: authHeaders() });
    const data = await res.json();
    if (!data.success || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No audit logs.</td></tr>';
      return;
    }
    tbody.innerHTML = data.logs.map(a => `
      <tr>
        <td><small>${escapeHtml(a.created_at)}</small></td>
        <td>${a.quote_id ? `<strong style="color:#D4AF37;">Quote #${a.quote_id}</strong>` : '—'}</td>
        <td><strong>${escapeHtml(a.action)}</strong></td>
        <td>${escapeHtml(a.performed_by)}</td>
        <td><small style="color:rgba(255,255,255,0.7);">${escapeHtml(a.details || '')}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#EF4444; padding:2rem; text-align:center;">Failed to load audit logs.</td></tr>';
  }
}

/* ===================================================================
   12. MODALS & FORMS BINDING
   =================================================================== */
function initModals() {
  // Quote modal close
  document.getElementById('quote-modal-close')?.addEventListener('click', () => {
    document.getElementById('quote-modal')?.classList.remove('open');
  });

  // Service form save
  document.getElementById('admin-service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('service-edit-id').value;
    const title = document.getElementById('service-title').value;
    const category = document.getElementById('service-category').value;
    const icon = document.getElementById('service-icon').value;
    const serviceArea = document.getElementById('service-area').value;
    const confirmationNote = document.getElementById('service-confirmation').value;
    const shortDesc = document.getElementById('service-desc').value;
    const imageUrl = document.getElementById('service-image').value;

    try {
      const url = id ? `/api/admin/services/${id}` : '/api/admin/services';
      const method = id ? 'PUT' : 'POST';
      const slug = document.getElementById('service-slug').value;

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ slug, title, category, icon, serviceArea, confirmationNote, shortDesc, imageUrl })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('service-modal')?.classList.remove('open');
        loadServices();
      } else {
        alert(data.error || 'Failed to save service.');
      }
    } catch (err) {
      alert('Error saving service.');
    }
  });

  document.getElementById('service-modal-close')?.addEventListener('click', () => {
    document.getElementById('service-modal')?.classList.remove('open');
  });

  document.getElementById('add-service-btn')?.addEventListener('click', () => {
    document.getElementById('service-edit-id').value = '';
    document.getElementById('service-slug').value = '';
    document.getElementById('service-slug').disabled = false;
    document.getElementById('service-title').value = '';
    document.getElementById('service-desc').value = '';
    document.getElementById('service-modal-title').textContent = 'Add New Service';
    document.getElementById('service-modal')?.classList.add('open');
  });

  // Settings form save
  document.getElementById('admin-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      company_name: document.getElementById('setting-company-name').value,
      contact_person: document.getElementById('setting-contact-person').value,
      contact_phone: document.getElementById('setting-contact-phone').value,
      contact_email: document.getElementById('setting-contact-email').value,
      target_market: document.getElementById('setting-target-market').value,
      primary_cities: document.getElementById('setting-primary-cities').value,
      secondary_market: document.getElementById('setting-secondary-market').value,
      domain_name: document.getElementById('setting-domain-name').value,
      hero_headline: document.getElementById('setting-hero-headline').value,
      hero_supporting: document.getElementById('setting-hero-supporting').value,
      experience_verified: document.getElementById('setting-experience-verified').value
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (data.success) {
        const feedback = document.getElementById('settings-save-feedback');
        if (feedback) {
          feedback.style.display = 'inline';
          setTimeout(() => { feedback.style.display = 'none'; }, 3000);
        }
      }
    } catch (err) {
      alert('Error saving settings.');
    }
  });

  // Add review form
  document.getElementById('add-verified-review-btn')?.addEventListener('click', () => {
    document.getElementById('add-review-modal')?.classList.add('open');
  });

  document.getElementById('add-review-close')?.addEventListener('click', () => {
    document.getElementById('add-review-modal')?.classList.remove('open');
  });

  document.getElementById('admin-add-review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerName = document.getElementById('new-rev-name').value;
    const serviceName = document.getElementById('new-rev-service').value;
    const rating = document.getElementById('new-rev-rating').value;
    const reviewText = document.getElementById('new-rev-text').value;

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ customerName, serviceName, rating, reviewText })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('add-review-modal')?.classList.remove('open');
        document.getElementById('admin-add-review-form').reset();
        loadReviews();
      }
    } catch (err) {
      alert('Error creating review.');
    }
  });

  // Gallery upload & register modal
  document.getElementById('upload-gallery-image-btn')?.addEventListener('click', () => {
    document.getElementById('gallery-modal')?.classList.add('open');
  });

  document.getElementById('gallery-modal-close')?.addEventListener('click', () => {
    document.getElementById('gallery-modal')?.classList.remove('open');
  });

  document.getElementById('admin-gallery-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('gallery-file');
    let imageUrl = document.getElementById('gallery-url').value;

    if (fileInput && fileInput.files.length > 0) {
      const uploadForm = new FormData();
      uploadForm.append('image', fileInput.files[0]);
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: uploadForm
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        imageUrl = uploadData.url;
      }
    }

    if (!imageUrl) {
      alert('Please select an image file or provide an image path.');
      return;
    }

    const title = document.getElementById('gallery-title').value;
    const category = document.getElementById('gallery-category').value;
    const imageType = document.getElementById('gallery-type').value;
    const caption = document.getElementById('gallery-caption').value;
    const isHero = document.getElementById('gallery-hero').checked;

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, category, imageUrl, imageType, caption, isHero })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('gallery-modal')?.classList.remove('open');
        document.getElementById('admin-gallery-form').reset();
        loadGallery();
      }
    } catch (err) {
      alert('Error adding gallery image.');
    }
  });
}

function handleUnauthorized() {
  currentToken = '';
  localStorage.removeItem('spn_admin_token');
  showLogin();
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
