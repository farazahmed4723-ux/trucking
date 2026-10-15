/**
 * SPN TRUCKING LTD. — ADMIN BACKOFFICE CONTROLLER
 * Handles: Authentication, quote status workflow, temporary holds,
 * review moderation, site settings, notifications log, and audit trail.
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
  else if (tab === 'reviews') loadReviews();
  else if (tab === 'settings') loadSettings();
  else if (tab === 'notifications') loadNotifications();
  else if (tab === 'audit') loadAuditLogs();
}

async function loadMetrics() {
  try {
    const res = await fetch('/api/admin/metrics', { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
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
   3. QUOTES & TEMPORARY HOLDS
   =================================================================== */
async function loadQuotes() {
  const tbody = document.getElementById('quotes-table-body');
  if (!tbody) return;

  const status = document.getElementById('filter-quote-status')?.value || 'ALL';
  const search = document.getElementById('search-quotes')?.value || '';

  try {
    const url = `/api/admin/quotes?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();

    if (data.success && data.quotes) {
      if (data.quotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:rgba(255,255,255,0.6);">No matching quotes found.</td></tr>';
        return;
      }

      tbody.innerHTML = data.quotes.map(q => `
        <tr>
          <td><strong style="color:#D4AF37;">${escapeHtml(q.ref_id)}</strong></td>
          <td><strong>${escapeHtml(q.full_name)}</strong><br><span style="font-size:0.75rem; color:rgba(255,255,255,0.6);">${escapeHtml(q.job_type || '')}</span></td>
          <td>
            <a href="tel:${escapeHtml(q.phone)}" style="color:#FFF;">${escapeHtml(q.phone)}</a><br>
            <span style="font-size:0.8rem; color:rgba(255,255,255,0.6);">${escapeHtml(q.email)}</span>
          </td>
          <td>${escapeHtml(q.service_category)}</td>
          <td>${escapeHtml(q.service_date || 'Flexible')}</td>
          <td>
            <span class="badge-status ${q.status}">${q.status}</span>
            ${q.status === 'HOLD' && q.hold_expires_at ? `<br><span style="font-size:0.7rem; color:#60A5FA;">Until ${new Date(q.hold_expires_at).toLocaleTimeString([], {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>` : ''}
          </td>
          <td>${new Date(q.created_at).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openQuoteDetail(${q.id})">Inspect</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:#EF4444; text-align:center;">Failed to load quotes.</td></tr>`;
  }
}

window.openQuoteDetail = async function(id) {
  const modal = document.getElementById('quote-modal');
  const container = document.getElementById('quote-modal-content');
  if (!modal || !container) return;

  container.innerHTML = '<div style="text-align:center; padding:2rem;">Loading quote details...</div>';
  modal.classList.add('open');

  try {
    const res = await fetch(`/api/admin/quotes/${id}`, { headers: authHeaders() });
    const data = await res.json();

    if (data.success && data.quote) {
      const q = data.quote;
      const audits = data.auditTrail || [];
      const notifs = data.notifications || [];

      container.innerHTML = `
        <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:1.4rem; color:#FFF; margin:0;">${escapeHtml(q.ref_id)}</h3>
            <span class="badge-status ${q.status}">${q.status}</span>
          </div>
          <p style="color:#D4AF37; font-size:0.9rem; margin:0.25rem 0 0;">Customer: <strong>${escapeHtml(q.full_name)}</strong></p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; font-size:0.9rem;">
          <div>
            <strong>Contact:</strong><br>
            Phone: <a href="tel:${escapeHtml(q.phone)}" style="color:#D4AF37;">${escapeHtml(q.phone)}</a><br>
            Email: <a href="mailto:${escapeHtml(q.email)}" style="color:#D4AF37;">${escapeHtml(q.email)}</a>
          </div>
          <div>
            <strong>Service & Timing:</strong><br>
            Category: ${escapeHtml(q.service_category)} (${escapeHtml(q.job_type)})<br>
            Date: ${escapeHtml(q.service_date || 'Flexible')} ${escapeHtml(q.service_time || '')}<br>
            Vehicle Pref: ${escapeHtml(q.truck_size || 'Standard')}
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:1rem; margin-bottom:1.5rem; font-size:0.9rem;">
          <div><strong>Pickup:</strong> ${escapeHtml(q.pickup_location || 'Not Specified')}</div>
          <div><strong>Dropoff:</strong> ${escapeHtml(q.dropoff_location || 'Not Specified')}</div>
          <div style="margin-top:0.5rem;"><strong>Load Description:</strong></div>
          <div style="color:rgba(255,255,255,0.85); margin-top:2px;">${escapeHtml(q.load_description)}</div>
          ${q.additional_instructions ? `<div style="margin-top:0.5rem;"><strong>Special Instructions:</strong> ${escapeHtml(q.additional_instructions)}</div>` : ''}
          ${q.discount_code ? `<div style="margin-top:0.5rem; color:#F59E0B;"><strong>Promotion Code:</strong> ${escapeHtml(q.discount_code)}</div>` : ''}
          ${q.photo_path ? `<div style="margin-top:0.75rem;"><a href="${q.photo_path}" target="_blank" class="btn btn-outline btn-sm">📷 View Customer Uploaded Photo</a></div>` : ''}
        </div>

        <!-- Status Management Actions -->
        <div style="background:#070A10; border:1px solid rgba(212,175,55,0.25); border-radius:10px; padding:1.25rem; margin-bottom:1.5rem;">
          <h4 style="margin:0 0 0.75rem; font-size:1rem; color:#D4AF37;">Dispatch Status Workflow</h4>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
            <button class="btn btn-sm" style="background:#10B981; color:#FFF;" onclick="updateQuoteStatus(${q.id}, 'APPROVED')">✓ Approve Booking</button>
            <div style="display:inline-flex; align-items:center; gap:4px;">
              <button class="btn btn-sm" style="background:#3B82F6; color:#FFF;" onclick="holdQuotePrompt(${q.id})">⏳ Temporary Hold</button>
            </div>
            <button class="btn btn-sm" style="background:#EF4444; color:#FFF;" onclick="updateQuoteStatus(${q.id}, 'REJECTED')">✕ Reject</button>
            <button class="btn btn-outline btn-sm" onclick="updateQuoteStatus(${q.id}, 'RELEASED')">Release Hold</button>
          </div>
        </div>

        <!-- Internal Notes -->
        <div style="margin-bottom:1.5rem;">
          <label class="form-label" style="font-size:0.85rem;">Internal Dispatch Notes</label>
          <textarea id="quote-internal-notes" class="form-textarea" style="min-height:60px;">${escapeHtml(q.internal_notes || '')}</textarea>
          <button class="btn btn-outline btn-sm" style="margin-top:0.5rem;" onclick="saveInternalNotes(${q.id})">Save Notes</button>
        </div>

        <!-- Audit Trail -->
        <div>
          <h4 style="font-size:0.95rem; margin-bottom:0.5rem; color:rgba(255,255,255,0.8);">Quote Audit Trail</h4>
          <div style="font-size:0.8rem; color:rgba(255,255,255,0.6); max-height:140px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:0.5rem; border-radius:6px;">
            ${audits.map(a => `<div>[${new Date(a.created_at).toLocaleTimeString()}] <strong>${a.action}</strong> by ${a.performed_by} ${a.details || ''}</div>`).join('')}
          </div>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<div style="color:#EF4444;">Failed to load quote details.</div>';
  }
};

window.holdQuotePrompt = function(id) {
  const hours = prompt('Enter temporary hold duration in hours (e.g. 24, 48, 72):', '24');
  if (hours) {
    updateQuoteStatus(id, 'HOLD', parseInt(hours, 10));
  }
};

window.updateQuoteStatus = async function(id, status, holdHours) {
  try {
    const res = await fetch(`/api/admin/quotes/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, holdHours })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      openQuoteDetail(id);
      loadMetrics();
      loadQuotes();
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert('Failed to update status.');
  }
};

window.saveInternalNotes = async function(id) {
  const notes = document.getElementById('quote-internal-notes')?.value;
  try {
    const res = await fetch(`/api/admin/quotes/${id}/notes`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ internalNotes: notes })
    });
    const data = await res.json();
    if (data.success) {
      alert('Internal notes saved.');
    }
  } catch (err) {
    alert('Failed to save notes.');
  }
};

/* ===================================================================
   4. REVIEWS MODERATION
   =================================================================== */
async function loadReviews() {
  const tbody = document.getElementById('reviews-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/reviews', { headers: authHeaders() });
    const data = await res.json();

    if (data.success && data.reviews) {
      if (data.reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:rgba(255,255,255,0.6);">No customer reviews submitted yet.</td></tr>';
        return;
      }

      tbody.innerHTML = data.reviews.map(r => `
        <tr>
          <td><strong>${escapeHtml(r.customer_name)}</strong></td>
          <td>${escapeHtml(r.service_name)}</td>
          <td style="color:#D4AF37;">${'★'.repeat(r.rating)}</td>
          <td style="max-width:240px; font-size:0.85rem;">"${escapeHtml(r.review_text)}"</td>
          <td>${r.verified ? '<span style="color:#10B981;">✓ Verified</span>' : '<span style="color:rgba(255,255,255,0.4);">Public</span>'}</td>
          <td>
            ${r.is_approved ? '<span style="color:#10B981; font-weight:700;">APPROVED</span>' : '<span style="color:#F59E0B; font-weight:700;">PENDING</span>'}
            ${r.is_featured ? '<br><span style="color:#D4AF37; font-size:0.75rem;">★ Featured</span>' : ''}
          </td>
          <td>
            ${!r.is_approved ? `<button class="btn btn-sm" style="background:#10B981; color:#FFF; margin-right:4px;" onclick="moderateReview(${r.id}, 1, ${r.is_featured})">Approve</button>` : `<button class="btn btn-outline btn-sm" style="margin-right:4px;" onclick="moderateReview(${r.id}, 0, ${r.is_featured})">Hide</button>`}
            <button class="btn btn-outline btn-sm" style="border-color:#EF4444; color:#EF4444;" onclick="deleteReview(${r.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:#EF4444; text-align:center;">Failed to load reviews.</td></tr>';
  }
}

window.moderateReview = async function(id, isApproved, isFeatured) {
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isApproved: !!isApproved, isFeatured: !!isFeatured })
    });
    const data = await res.json();
    if (data.success) {
      loadReviews();
      loadMetrics();
    }
  } catch (err) {
    alert('Review action failed.');
  }
};

window.deleteReview = async function(id) {
  if (!confirm('Are you sure you want to permanently delete this review?')) return;
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
    alert('Failed to delete review.');
  }
};

/* ===================================================================
   5. SITE SETTINGS & SEO
   =================================================================== */
async function loadSettings() {
  try {
    const res = await fetch('/api/admin/settings', { headers: authHeaders() });
    const data = await res.json();

    if (data.success && data.settings) {
      data.settings.forEach(s => {
        const input = document.getElementById(`setting-${s.key.replace(/_/g, '-')}`);
        if (input) input.value = s.value;
      });
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

document.getElementById('admin-settings-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const settings = {};
  formData.forEach((value, key) => { settings[key] = value; });

  const feedback = document.getElementById('settings-save-feedback');

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ settings })
    });
    const data = await res.json();

    if (data.success && feedback) {
      feedback.style.display = 'inline';
      setTimeout(() => { feedback.style.display = 'none'; }, 3000);
    }
  } catch (err) {
    alert('Failed to save settings.');
  }
});

/* ===================================================================
   6. NOTIFICATIONS & AUDIT TRAIL
   =================================================================== */
async function loadNotifications() {
  const tbody = document.getElementById('notifications-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/notifications', { headers: authHeaders() });
    const data = await res.json();

    if (data.success && data.notifications) {
      if (data.notifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:rgba(255,255,255,0.6);">No notifications recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = data.notifications.map(n => `
        <tr>
          <td>${new Date(n.created_at).toLocaleString()}</td>
          <td><strong>${n.channel}</strong></td>
          <td>${escapeHtml(n.recipient)}</td>
          <td><span class="badge-status ${n.status}">${n.status}</span></td>
          <td>${n.provider}</td>
          <td style="font-size:0.8rem; color:rgba(255,255,255,0.8);">${escapeHtml(n.response_message || 'N/A')}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#EF4444; text-align:center;">Failed to load notifications.</td></tr>';
  }
}

async function loadAuditLogs() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/admin/audit-logs', { headers: authHeaders() });
    const data = await res.json();

    if (data.success && data.logs) {
      tbody.innerHTML = data.logs.map(l => `
        <tr>
          <td>${new Date(l.created_at).toLocaleString()}</td>
          <td>${l.quote_id || '-'}</td>
          <td><strong style="color:#D4AF37;">${l.action}</strong></td>
          <td>${l.performed_by}</td>
          <td style="font-size:0.8rem; color:rgba(255,255,255,0.7);">${escapeHtml(l.details || '')}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#EF4444; text-align:center;">Failed to load audit logs.</td></tr>';
  }
}

/* ===================================================================
   7. MODAL CONTROLS
   =================================================================== */
function initModals() {
  document.getElementById('quote-modal-close')?.addEventListener('click', () => {
    document.getElementById('quote-modal')?.classList.remove('open');
  });

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
        body: JSON.stringify({ customerName, serviceName, rating, reviewText, isFeatured: 1 })
      });
      const data = await res.json();
      if (data.success) {
        alert('Review published.');
        document.getElementById('add-review-modal')?.classList.remove('open');
        document.getElementById('admin-add-review-form').reset();
        loadReviews();
        loadMetrics();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to publish review.');
    }
  });
}

function logout() {
  currentToken = '';
  localStorage.removeItem('spn_admin_token');
  showLogin();
}

function debounce(func, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
