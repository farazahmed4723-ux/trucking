/**
 * SPN TRUCKING LTD. — PROMOTIONAL CAMPAIGN CALENDAR CONFIGURATION
 * Jurisdiction: Calgary, Alberta & Canada
 * Timezone: America/Edmonton (Mountain Time - MT)
 * 
 * Rules:
 * - Recurring statutory holiday calculations evaluate using Mountain Time.
 * - Holiday campaigns trigger automatically during the active holiday window.
 * - When no holiday campaign is active, the year-round 10% Calgary Student Discount banner is active.
 * - All promotions apply a transparent 10% discount with single-discount rules.
 */

const CampaignsConfig = {
  timezone: "America/Edmonton",

  // Year-round Student Discount configuration for Calgary
  studentDiscount: {
    enabled: true,
    percentage: 10,
    bannerText: "Calgary Students Save 10% on Moving & Junk Hauling — Claim Rate",
    tagline: "Moving dorms, apartments, or clearing end-of-semester clutter? Present valid student ID from U of C, MRU, SAIT, or Bow Valley College to save 10%.",
    ctaText: "Claim 10% Student Rate",
    ctaLink: "#quote-section",
    terms: {
      verified: true,
      flag: "Student Discount Policy",
      items: [
        "Valid current student ID card (University of Calgary, Mount Royal, SAIT, Bow Valley, etc.) required upon confirmation.",
        "One promotional discount per booking; cannot be combined with statutory holiday discounts.",
        "Eligible services: Residential Moving, Junk Removal, and Small Load Delivery."
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
      "Subject to vehicle dispatch and crew availability across the Greater Calgary Region."
    ]
  },

  // Alberta & Canadian Statutory Holidays
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
      bannerText: "🎉 New Year Kickoff — 10% OFF Moving & Decluttering Across Calgary",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Trucking", "Junk Removal"]
    },
    {
      id: "family-day",
      name: "Alberta Family Day",
      type: "nth_weekday",
      month: 2, // February
      weekday: 1, // Monday
      nth: 3, // 3rd Monday of February
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "🏠 Family Day Special — 10% OFF Calgary Family & Residential Relocations",
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
      bannerText: "🌷 Spring Long Weekend — Save 10% on Calgary Moves & Yard Cleanups",
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
      bannerText: "🚚 Victoria Day Weekend — 10% OFF Trucking, Hauling & Relocations",
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
      bannerText: "🇨🇦 Happy Canada Day! Save 10% on Moving & Transportation Across Calgary",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Trucking", "Junk Removal"]
    },
    {
      id: "heritage-day",
      name: "Heritage Day / Alberta Day",
      type: "nth_weekday",
      month: 8, // August
      weekday: 1, // Monday
      nth: 1, // 1st Monday of August
      enabled: true,
      leadDays: 2,
      lagDays: 1,
      bannerText: "🏔️ Alberta Heritage Weekend — 10% OFF Summer Moves & Freight Runs",
      eligibleServices: ["Residential Moving", "Trucking", "Flatbed Trucking", "Junk Removal"]
    },
    {
      id: "labour-day",
      name: "Labour Day",
      type: "nth_weekday",
      month: 9, // September
      weekday: 1, // Monday
      nth: 1, // 1st Monday of September
      enabled: true,
      leadDays: 3,
      lagDays: 1,
      bannerText: "📦 Labour Day Move Rush — 10% OFF Calgary Residential & Student Moves",
      eligibleServices: ["Residential Moving", "Small Load Transportation", "Junk Removal"]
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
      bannerText: "🍂 Thanksgiving Special — 10% OFF Fall Property Cleanups & Moves",
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
      bannerText: "🍁 Remembrance Week — 10% Special Rate on Calgary Hauling & Freight",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Trucking"]
    },
    {
      id: "christmas",
      name: "Christmas & Boxing Week",
      type: "fixed",
      month: 12, // December
      day: 25,
      enabled: true,
      leadDays: 3,
      lagDays: 6, // Extends through Boxing Day into New Year
      bannerText: "🎄 Holiday Season Special — 10% OFF Winter Moves & Commercial Transport",
      eligibleServices: ["Residential Moving", "Commercial Moving", "Trucking", "Junk Removal"]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignsConfig;
}
