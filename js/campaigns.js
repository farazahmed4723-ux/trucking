/**
 * STN TRUCKING LTD. — BRITISH COLUMBIA HOLIDAY & SEASONAL PROMOTIONS ENGINE
 * Timezone: America/Vancouver (Pacific Time - PT)
 *
 * Implements:
 * 1. Dynamic annual calculation of British Columbia statutory holidays, commercial shopping events,
 *    and seasonal marketing promotions across any current or future year.
 * 2. Accurate Pacific Time (America/Vancouver) timezone evaluation.
 * 3. Automatic 10% discount activation when a campaign start date arrives, and automatic expiry when it ends.
 * 4. Displays promotional banner ONLY when genuinely active; completely hides banner when no campaign is active.
 * 5. Seamless quote request capture: attaches promo code to quote request without claiming uncalculated price discounts.
 * 6. Supports simulation/preview parameters for dispatch and client testing.
 */

const CampaignEngine = {
  simulatedDate: null,

  /**
   * Get current date in America/Vancouver timezone
   */
  getCurrentDate() {
    if (this.simulatedDate) {
      return new Date(this.simulatedDate);
    }

    // Check URL parameters for simulation/testing (e.g., ?simulate_date=2026-10-31 or ?preview_promo=thanksgiving)
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const simParam = params.get('simulate_date') || params.get('sim_date');
      if (simParam) {
        const parsed = new Date(simParam.includes('T') ? simParam : `${simParam}T12:00:00`);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    try {
      const tz = (typeof CampaignsConfig !== 'undefined' && CampaignsConfig.timezone) 
        ? CampaignsConfig.timezone 
        : 'America/Vancouver';

      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(now);
      const val = type => parts.find(p => p.type === type)?.value;

      const year = parseInt(val('year'), 10);
      const month = parseInt(val('month'), 10) - 1;
      const day = parseInt(val('day'), 10);
      const hour = parseInt(val('hour'), 10);
      const minute = parseInt(val('minute'), 10);
      const second = parseInt(val('second'), 10);

      return new Date(year, month, day, hour, minute, second);
    } catch (e) {
      return new Date();
    }
  },

  /**
   * Anonymous Gregorian Computus algorithm to calculate Easter Sunday for any year
   */
  getEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  },

  /**
   * Format date range into friendly readable string (e.g. "Oct 10 – Oct 12, 2026")
   */
  formatDateRange(start, end) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sM = months[start.getMonth()];
    const eM = months[end.getMonth()];
    const sD = start.getDate();
    const eD = end.getDate();
    const sY = start.getFullYear();
    const eY = end.getFullYear();

    if (sY === eY && sM === eM) {
      return `${sM} ${sD} – ${eD}, ${eY}`;
    } else if (sY === eY) {
      return `${sM} ${sD} – ${eM} ${eD}, ${eY}`;
    } else {
      return `${sM} ${sD}, ${sY} – ${eM} ${eD}, ${eY}`;
    }
  },

  /**
   * Calculate exact start and end date window for a campaign in a given year
   */
  calculateCampaignWindow(campaign, year) {
    let holidayDate = null;
    let startDate = null;
    let endDate = null;

    switch (campaign.type) {
      case 'fixed': {
        holidayDate = new Date(year, campaign.month - 1, campaign.day, 0, 0, 0, 0);
        startDate = new Date(holidayDate);
        startDate.setDate(startDate.getDate() - (campaign.leadDays || 0));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(holidayDate);
        endDate.setDate(endDate.getDate() + (campaign.lagDays || 0));
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case 'fixed_range': {
        startDate = new Date(year, campaign.startMonth - 1, campaign.startDay, 0, 0, 0, 0);
        endDate = new Date(year, campaign.endMonth - 1, campaign.endDay, 23, 59, 59, 999);
        holidayDate = new Date(startDate);
        break;
      }

      case 'nth_weekday': {
        const nth = campaign.nth || 1;
        const targetWeekday = campaign.weekday; // 0=Sun, 1=Mon, ..., 6=Sat
        const d = new Date(year, campaign.month - 1, 1, 0, 0, 0, 0);
        let count = 0;
        while (d.getMonth() === campaign.month - 1) {
          if (d.getDay() === targetWeekday) {
            count++;
            if (count === nth) {
              holidayDate = new Date(d);
              break;
            }
          }
          d.setDate(d.getDate() + 1);
        }

        if (holidayDate) {
          startDate = new Date(holidayDate);
          startDate.setDate(startDate.getDate() - (campaign.leadDays || 0));
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(holidayDate);
          endDate.setDate(endDate.getDate() + (campaign.lagDays || 0));
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      }

      case 'easter_offset': {
        const easter = this.getEasterSunday(year);
        holidayDate = new Date(easter);
        holidayDate.setDate(holidayDate.getDate() + (campaign.offsetDays || 0));

        startDate = new Date(holidayDate);
        startDate.setDate(startDate.getDate() - (campaign.leadDays || 0));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(holidayDate);
        endDate.setDate(endDate.getDate() + (campaign.lagDays || 0));
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case 'monday_before': {
        // Monday preceding referenceDay (e.g. Victoria Day is Monday before May 25)
        const refDay = campaign.referenceDay || 25;
        const d = new Date(year, campaign.month - 1, refDay - 1, 0, 0, 0, 0);
        while (d.getDay() !== 1) {
          d.setDate(d.getDate() - 1);
        }
        holidayDate = new Date(d);

        startDate = new Date(holidayDate);
        startDate.setDate(startDate.getDate() - (campaign.leadDays || 0));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(holidayDate);
        endDate.setDate(endDate.getDate() + (campaign.lagDays || 0));
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case 'black_friday': {
        // 4th Friday of November
        const d = new Date(year, 10, 1, 0, 0, 0, 0); // Month 10 = Nov
        while (d.getDay() !== 5) {
          d.setDate(d.getDate() + 1);
        }
        d.setDate(d.getDate() + 21); // 4th Friday
        holidayDate = new Date(d);

        startDate = new Date(holidayDate);
        startDate.setDate(startDate.getDate() - (campaign.leadDays || 0));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(holidayDate);
        endDate.setDate(endDate.getDate() + (campaign.lagDays || 0));
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case 'cyber_monday': {
        // Monday after 4th Friday of November
        const d = new Date(year, 10, 1, 0, 0, 0, 0);
        while (d.getDay() !== 5) {
          d.setDate(d.getDate() + 1);
        }
        d.setDate(d.getDate() + 21 + 3); // 4th Friday + 3 days = Cyber Monday
        holidayDate = new Date(d);

        startDate = new Date(holidayDate);
        startDate.setDate(startDate.getDate() - (campaign.leadDays || 0));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(holidayDate);
        endDate.setDate(endDate.getDate() + (campaign.lagDays || 0));
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      default:
        return null;
    }

    if (!startDate || !endDate) return null;

    return {
      startDate,
      endDate,
      holidayDate,
      validDatesText: this.formatDateRange(startDate, endDate)
    };
  },

  /**
   * Determine currently active promotional campaign in America/Vancouver timezone.
   * Returns enriched campaign object if active, or null if no campaign is currently active.
   */
  getActiveCampaign(targetDate = null) {
    const config = (typeof CampaignsConfig !== 'undefined') ? CampaignsConfig : null;
    if (!config || !config.campaigns) {
      return null;
    }

    const currentDate = targetDate ? new Date(targetDate) : this.getCurrentDate();
    const currentYear = currentDate.getFullYear();

    // Check URL override for previewing a specific campaign (e.g. ?preview_promo=thanksgiving)
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const previewId = params.get('preview_promo') || params.get('preview_campaign');
      if (previewId) {
        const match = config.campaigns.find(c => c.id.toLowerCase() === previewId.toLowerCase());
        if (match) {
          const windowInfo = this.calculateCampaignWindow(match, currentYear);
          return {
            ...match,
            ...windowInfo,
            isActive: true,
            status: 'PREVIEW'
          };
        }
      }
    }

    // Evaluate campaigns across current year, and adjacent year for New Year boundary window
    const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

    for (const year of yearsToCheck) {
      for (const campaign of config.campaigns) {
        if (!campaign.enabled) continue;

        const windowInfo = this.calculateCampaignWindow(campaign, year);
        if (!windowInfo) continue;

        if (currentDate >= windowInfo.startDate && currentDate <= windowInfo.endDate) {
          return {
            ...campaign,
            ...windowInfo,
            isActive: true,
            status: 'ACTIVE'
          };
        }
      }
    }

    // No campaign is currently active
    return null;
  },

  /**
   * Get all campaigns calculated for a given year with active/upcoming status
   */
  getAllCampaignsForYear(year = null) {
    const config = (typeof CampaignsConfig !== 'undefined') ? CampaignsConfig : null;
    if (!config || !config.campaigns) return [];

    const currentDate = this.getCurrentDate();
    const targetYear = year || currentDate.getFullYear();

    return config.campaigns.map(campaign => {
      const windowInfo = this.calculateCampaignWindow(campaign, targetYear);
      let status = 'UPCOMING';
      let isActive = false;

      if (windowInfo) {
        if (currentDate >= windowInfo.startDate && currentDate <= windowInfo.endDate) {
          status = 'ACTIVE';
          isActive = true;
        } else if (currentDate > windowInfo.endDate) {
          status = 'EXPIRED';
        }
      }

      return {
        ...campaign,
        year: targetYear,
        ...windowInfo,
        isActive,
        status
      };
    });
  },

  /**
   * Render the professional promotional banner matching STN black, navy, gold, and white branding.
   * Completely hides the banner when no campaign is active.
   */
  renderBanner() {
    const bannerContainer = document.getElementById('promo-banner-container');
    if (!bannerContainer) return;

    const campaign = this.getActiveCampaign();

    // Hide banner completely when no campaign is active
    if (!campaign) {
      bannerContainer.innerHTML = '';
      bannerContainer.style.display = 'none';
      return;
    }

    bannerContainer.style.display = 'block';

    const categoryBadge = campaign.category === 'official_statutory'
      ? '🍁 BC Statutory Holiday'
      : (campaign.category === 'commercial_event' ? '🏷️ Commercial Booking Event' : '✨ Seasonal Special');

    const bannerHTML = `
      <aside class="promo-banner" id="promo-banner" role="region" aria-label="Active Seasonal Promotion">
        <div class="container promo-banner-inner">
          <div class="promo-banner-lead">
            <span class="promo-banner-tag">${categoryBadge}</span>
            <span class="promo-banner-badge">10% OFF</span>
          </div>
          <div class="promo-banner-content">
            <strong class="promo-banner-title">${campaign.name}:</strong>
            <span class="promo-banner-text">${campaign.bannerText || '10% off qualifying STN Trucking services across Surrey, Vancouver & BC.'}</span>
            <span class="promo-banner-dates">Valid: ${campaign.validDatesText}</span>
          </div>
          <div class="promo-banner-cta">
            <a href="#quote-section" class="promo-banner-btn" id="promo-claim-btn" onclick="CampaignEngine.applyToQuote('${campaign.code}', '${campaign.name}')">
              Get a Free Quote
            </a>
          </div>
        </div>
      </aside>
    `;

    bannerContainer.innerHTML = bannerHTML;

    // Also populate the active promotion into the quote form dropdown if present
    this.syncQuoteDropdown(campaign);
  },

  /**
   * Synchronize active campaign into quote discount select without overwriting user choice
   */
  syncQuoteDropdown(campaign) {
    const select = document.getElementById('quote-discount-select');
    if (!select || !campaign) return;

    let option = select.querySelector(`option[value="${campaign.code}"]`);
    if (!option) {
      option = document.createElement('option');
      option.value = campaign.code;
      option.textContent = `🎉 ${campaign.name} (10% Discount)`;
      // Insert right after default option
      if (select.children.length > 1) {
        select.insertBefore(option, select.children[1]);
      } else {
        select.appendChild(option);
      }
    }
  },

  /**
   * Handle user clicking "Get a Free Quote" from the promotional banner
   */
  applyToQuote(promoCode, campaignName = '') {
    const select = document.getElementById('quote-discount-select');
    if (select) {
      let option = select.querySelector(`option[value="${promoCode}"]`);
      if (!option && promoCode) {
        option = document.createElement('option');
        option.value = promoCode;
        option.textContent = `🎉 ${campaignName || 'Seasonal Promotion'} (10% Discount)`;
        select.appendChild(option);
      }
      if (option) {
        select.value = promoCode;
      }

      // Display a clear note under the select field confirming dispatch review
      let notice = document.getElementById('quote-promo-notice');
      if (!notice) {
        notice = document.createElement('div');
        notice.id = 'quote-promo-notice';
        notice.style.cssText = 'margin-top:0.4rem; font-size:0.85rem; color:#F5A623; font-weight:600;';
        select.parentNode.appendChild(notice);
      }
      notice.textContent = `✓ 10% ${campaignName || 'Seasonal'} promotion selected. Recorded for dispatch review upon quote preparation.`;
    }

    const quoteSection = document.getElementById('quote-section');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    CampaignEngine.renderBanner();
  });
}

// CommonJS export for Node.js / testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignEngine;
}
