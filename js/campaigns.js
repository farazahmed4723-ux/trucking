/**
 * STN TRUCKING LTD. — PROMOTIONAL CAMPAIGN ENGINE
 * Evaluates promotional campaigns based on Pacific Time (America/Vancouver).
 * Supports British Columbia statutory holiday calculation, campaign windows, and student discount fallback.
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

    try {
      const now = new Date();
      const tz = (typeof CampaignsConfig !== 'undefined' && CampaignsConfig.timezone) 
        ? CampaignsConfig.timezone 
        : 'America/Vancouver';

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
   * Anonymous Gregorian Computus algorithm to find Easter Sunday
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
    return new Date(year, month - 1, day, 0, 0, 0);
  },

  /**
   * Calculate exact holiday date for a given year based on its rule
   */
  calculateHolidayDate(holiday, year) {
    if (holiday.type === 'fixed') {
      return new Date(year, holiday.month - 1, holiday.day, 0, 0, 0);
    }

    if (holiday.type === 'nth_weekday' || holiday.type === 'nth-weekday') {
      const nth = holiday.nth || holiday.occurrence || 1;
      const targetWeekday = holiday.weekday;
      const d = new Date(year, holiday.month - 1, 1, 0, 0, 0);
      let count = 0;
      while (d.getMonth() === holiday.month - 1) {
        if (d.getDay() === targetWeekday) {
          count++;
          if (count === nth) {
            return new Date(d);
          }
        }
        d.setDate(d.getDate() + 1);
      }
    }

    if (holiday.type === 'easter_offset' || holiday.type === 'easter-offset') {
      const easter = this.getEasterSunday(year);
      const target = new Date(easter);
      const offset = holiday.offsetDays !== undefined ? holiday.offsetDays : holiday.easterOffsetDays;
      target.setDate(target.getDate() + offset);
      return target;
    }

    if (holiday.type === 'monday_before' || holiday.type === 'monday-before') {
      const refDay = holiday.referenceDay || holiday.beforeDay || 25;
      const d = new Date(year, holiday.month - 1, refDay - 1, 0, 0, 0);
      while (d.getDay() !== 1) { // 1 is Monday
        d.setDate(d.getDate() - 1);
      }
      return d;
    }

    return null;
  },

  /**
   * Determine currently active promotional campaign
   */
  getActiveCampaign() {
    const currentDate = this.getCurrentDate();
    const currentYear = currentDate.getFullYear();

    if (typeof CampaignsConfig === 'undefined' || !CampaignsConfig.holidays) {
      return this.getStudentFallback();
    }

    for (const holiday of CampaignsConfig.holidays) {
      if (!holiday.enabled) continue;

      const holidayDate = this.calculateHolidayDate(holiday, currentYear);
      if (!holidayDate) continue;

      const lead = holiday.leadDays || 0;
      const lag = holiday.lagDays || 0;

      const start = new Date(holidayDate);
      start.setDate(start.getDate() - lead);
      start.setHours(0, 0, 0, 0);

      const end = new Date(holidayDate);
      end.setDate(end.getDate() + lag);
      end.setHours(23, 59, 59, 999);

      if (currentDate >= start && currentDate <= end) {
        return {
          isHoliday: true,
          holidayId: holiday.id,
          holidayName: holiday.name,
          bannerText: holiday.bannerText,
          eligibleServices: holiday.eligibleServices,
          startDate: start,
          endDate: end,
          holidayDate: holidayDate,
          badge: "BC Holiday Special"
        };
      }
    }

    return this.getStudentFallback();
  },

  getStudentFallback() {
    const student = (typeof CampaignsConfig !== 'undefined' && CampaignsConfig.studentDiscount)
      ? CampaignsConfig.studentDiscount
      : {
          bannerText: "BC Students Save 10% on Moving & Junk Hauling — Claim Rate",
          ctaText: "Claim 10% Student Rate",
          ctaLink: "#quote-section"
        };

    return {
      isHoliday: false,
      holidayId: "student-year-round",
      holidayName: "Student Discount",
      bannerText: student.bannerText,
      eligibleServices: ["Residential Moving", "Junk Removal", "Small Load Transportation"],
      badge: "Year-Round Student Savings",
      termsNotice: "Valid BC post-secondary student ID required upon booking (UBC, SFU, BCIT, KPU, etc.)."
    };
  },

  /**
   * Render the top slim promotional banner
   */
  renderBanner() {
    const bannerContainer = document.getElementById('promo-banner-container');
    if (!bannerContainer) return;

    const campaign = this.getActiveCampaign();
    const bannerHTML = `
      <div class="promo-banner" id="promo-banner" role="region" aria-label="Promotional Announcement">
        <div class="container promo-banner-inner">
          <div class="promo-banner-badge">${campaign.badge}</div>
          <div class="promo-banner-text">
            <span>${campaign.bannerText}</span>
          </div>
          <div class="promo-banner-actions">
            <a href="#quote-section" class="promo-banner-btn" onclick="CampaignEngine.applyToQuote('${campaign.holidayId}')">
              Claim 10% Off
            </a>
          </div>
        </div>
      </div>
    `;

    bannerContainer.innerHTML = bannerHTML;
  },

  /**
   * Automatically select promotion in the quote form when user clicks banner CTA
   */
  applyToQuote(promoId) {
    const select = document.getElementById('quote-discount-select');
    if (!select) return;

    if (promoId === 'student-year-round') {
      select.value = 'student';
    } else {
      select.value = 'holiday';
    }

    const quoteSection = document.getElementById('quote-section');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CampaignEngine.renderBanner();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignEngine;
}
