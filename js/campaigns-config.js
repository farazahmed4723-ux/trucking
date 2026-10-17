/**
 * STN TRUCKING LTD. — PROMOTIONAL CAMPAIGN CALENDAR CONFIGURATION
 * Jurisdiction: Surrey, Vancouver, Lower Mainland, British Columbia & Canada
 * Timezone: America/Vancouver (Pacific Time - PT)
 * 
 * Rules:
 * - Recurring statutory holiday calculations evaluate using Pacific Time.
 * - Holiday campaigns trigger automatically during the active holiday window.
 * - When no holiday campaign is active, the year-round 10% BC Student Discount banner is active.
 * - All promotions apply a transparent 10% discount with single-discount rules.
 */

const CampaignsConfig = {
  timezone: "America/Vancouver",

  // Year-round Student Discount configuration for British Columbia
  studentDiscount: {
    enabled: true,
    percentage: 10,
    bannerText: "🎓 BC Students Save 10% on Moving & Junk Hauling — Claim Rate",
    tagline: "Moving dorms, apartments, or clearing end-of-semester clutter? Present valid student ID from UBC, SFU, BCIT, KPU, Langara, or Douglas College to save 10%.",
    ctaText: "Claim 10% Student Rate",
    ctaLink: "#quote-section",
    terms: {
      verified: true,
      flag: "Student Discount Policy",
      items: [
        "Valid current student ID card (UBC, SFU, BCIT, Kwantlen, Langara, Douglas College, etc.) required upon confirmation.",
        "One promotional discount per booking; cannot be combined with statutory holiday discounts.",
        "Eligible services: Residential Moving, Junk Removal, and Small Load Transportation across Surrey & Vancouver."
      ]
    }
  },

  // General Holiday Policy Terms
  generalHolidayTerms: {
    verified: true,
    flag: "Holiday Promotion Policy",
    items: [
      "10% promotional rate applies to bookings requested or scheduled during the statutory campaign window.",
      "Cannot be combined with student discount or ongoing commercial fleet contracts.",
      "Subject to vehicle dispatch and crew availability across Surrey, Vancouver, and the Lower Mainland."
    ]
  },

  // British Columbia & Canadian Statutory Holidays
  holidays: [
    {
      id: "new-years",
      name: "New Year's Day",
      type: "fixed",
      month: 1, // January
      day: 1,
      enabled: true,
      leadDays: 1,
      lagDays: 1,
      bannerText: "🎉 New Year Kickoff — 10% OFF Moving & Decluttering Across Surrey & Vancouver",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Trucking", "Junk Removal"]
    },
    {
      id: "family-day",
      name: "British Columbia Family Day",
      type: "nth_weekday",
      month: 2, // February
      weekday: 1, // Monday
      nth: 3, // 3rd Monday of February
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "🏠 BC Family Day Special — 10% OFF Surrey & Vancouver Family Relocations",
      eligibleServices: ["Residential Moving", "Small Load Transportation", "Junk Removal"]
    },
    {
      id: "good-friday",
      name: "Good Friday / Easter Weekend",
      type: "easter_offset",
      offsetDays: -2,
      enabled: true,
      leadDays: 1,
      lagDays: 2,
      bannerText: "🌷 Spring Long Weekend — Save 10% on Lower Mainland Moves & Yard Cleanups",
      eligibleServices: ["Residential Moving", "Gardening", "Junk Removal"]
    },
    {
      id: "victoria-day",
      name: "Victoria Day",
      type: "monday_before",
      month: 5, // May
      referenceDay: 25,
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "🚚 Victoria Day Weekend — 10% OFF Trucking, Hauling & Relocations in BC",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Trucking", "Gardening"]
    },
    {
      id: "canada-day",
      name: "Canada Day",
      type: "fixed",
      month: 7, // July
      day: 1,
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "🇨🇦 Canada Day Long Weekend — 10% OFF Moving & Hauling Across BC",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Junk Removal", "Trucking"]
    },
    {
      id: "bc-day",
      name: "British Columbia Day",
      type: "nth_weekday",
      month: 8, // August
      weekday: 1, // Monday
      nth: 1, // 1st Monday of August
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "☀️ BC Day Weekend — 10% OFF Lower Mainland Moving, Hauling & Delivery",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Junk Removal", "Gardening"]
    },
    {
      id: "labour-day",
      name: "Labour Day",
      type: "nth_weekday",
      month: 9, // September
      weekday: 1, // Monday
      nth: 1, // 1st Monday of September
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "📦 Labour Day Move Rush — 10% OFF Surrey & Vancouver Residential Relocations",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Junk Removal", "Small Load Transportation"]
    },
    {
      id: "truth-and-reconciliation",
      name: "National Day for Truth and Reconciliation",
      type: "fixed",
      month: 9, // September
      day: 30,
      enabled: true,
      leadDays: 1,
      lagDays: 1,
      bannerText: "🍁 Autumn Long Weekend — 10% OFF Scheduled Moves Across BC",
      eligibleServices: ["Residential Moving", "Junk Removal", "Gardening"]
    },
    {
      id: "thanksgiving",
      name: "Thanksgiving Day",
      type: "nth_weekday",
      month: 10, // October
      weekday: 1, // Monday
      nth: 2, // 2nd Monday of October
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "🦃 Thanksgiving Long Weekend — 10% OFF Residential & Yard Cleanups in BC",
      eligibleServices: ["Residential Moving", "Gardening", "Junk Removal"]
    },
    {
      id: "remembrance-day",
      name: "Remembrance Day",
      type: "fixed",
      month: 11, // November
      day: 11,
      enabled: true,
      leadDays: 1,
      lagDays: 1,
      bannerText: "🎖️ November Long Weekend — 10% OFF Lower Mainland Relocations & Hauls",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Junk Removal"]
    },
    {
      id: "christmas-boxing-week",
      name: "Christmas & Boxing Week",
      type: "fixed_range",
      startMonth: 12,
      startDay: 24,
      endMonth: 12,
      endDay: 31,
      enabled: true,
      leadDays: 0,
      lagDays: 0,
      bannerText: "🎄 Holiday Season Special — 10% OFF Year-End Commercial & Home Moves in BC",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Junk Removal", "Trucking"]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignsConfig;
}
