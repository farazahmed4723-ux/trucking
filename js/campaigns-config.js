/**
 * STN TRUCKING LTD. — BRITISH COLUMBIA SEASONAL & STATUTORY HOLIDAY CAMPAIGNS
 * Timezone: America/Vancouver (Pacific Time - PT)
 * 
 * Rules:
 * - Real dynamic calendar calculations for British Columbia and Canadian Statutory Holidays
 *   as well as recognized commercial shopping events (Black Friday, Cyber Monday) and seasonal campaigns.
 * - Supports any future year dynamically (no hardcoded expired dates).
 * - Distinguishes between official statutory holidays, commercial shopping events, and seasonal marketing.
 * - Automatically activates when the campaign start date arrives and automatically expires when it ends.
 * - Transparent 10% discount applied to qualifying STN Trucking services.
 */

const CampaignsConfig = {
  timezone: "America/Vancouver",

  // Year-round Student Discount policy (available upon student ID confirmation)
  studentDiscount: {
    enabled: true,
    percentage: 10,
    code: "STUDENT10",
    name: "BC Post-Secondary Student Discount",
    tagline: "10% off moving and hauling across Surrey & Vancouver for enrolled UBC, SFU, BCIT, KPU, Langara, or Douglas College students.",
    eligibleServices: ["residential-moving", "junk-removal", "small-load-transportation"],
    terms: "Valid current post-secondary student ID card required upon booking confirmation. Cannot be combined with statutory holiday discounts."
  },

  // Confirmed 16 Calendar Campaigns
  campaigns: [
    {
      id: "new-years",
      name: "New Year's Kickoff",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-NEWYEAR",
      type: "fixed",
      month: 1, // Jan 1
      day: 1,
      leadDays: 1, // Dec 31
      lagDays: 1,  // Jan 2
      enabled: true,
      bannerText: "🎉 New Year Kickoff — 10% OFF Moving & Decluttering Across BC",
      eligibleServices: ["residential-moving", "commercial-moving", "trucking", "junk-removal"]
    },
    {
      id: "valentines",
      name: "Valentine's Day Seasonal Special",
      category: "commercial_event",
      discountPercentage: 10,
      code: "PROMO10-VALENTINE",
      type: "fixed",
      month: 2, // Feb 14
      day: 14,
      leadDays: 2, // Feb 12
      lagDays: 0,  // Feb 14
      enabled: true,
      bannerText: "💝 Sweet Home Move — 10% OFF Surrey & Vancouver Relocations",
      eligibleServices: ["residential-moving", "small-load-transportation"]
    },
    {
      id: "family-day",
      name: "British Columbia Family Day",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-FAMILYDAY",
      type: "nth_weekday",
      month: 2, // February
      weekday: 1, // Monday
      nth: 3, // 3rd Monday in February
      leadDays: 2, // Preceding Saturday
      lagDays: 0,  // Family Day Monday
      enabled: true,
      bannerText: "🏠 BC Family Day Weekend — 10% OFF Family Home Moves & Cleanouts",
      eligibleServices: ["residential-moving", "small-load-transportation", "junk-removal"]
    },
    {
      id: "easter",
      name: "Good Friday & Easter Long Weekend",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-EASTER",
      type: "easter_offset",
      offsetDays: -2, // Good Friday (Easter Sunday - 2)
      leadDays: 0,
      lagDays: 3,  // Through Easter Monday
      enabled: true,
      bannerText: "🌷 Easter Long Weekend — 10% OFF Lower Mainland Moving & Yard Cleanups",
      eligibleServices: ["residential-moving", "gardening", "junk-removal"]
    },
    {
      id: "victoria-day",
      name: "Victoria Day Long Weekend",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-VICTORIADAY",
      type: "monday_before",
      month: 5, // May
      referenceDay: 25,
      leadDays: 2, // Preceding Saturday
      lagDays: 0,  // Victoria Day Monday
      enabled: true,
      bannerText: "🚚 Victoria Day Weekend — 10% OFF Trucking, Hauling & Relocations in BC",
      eligibleServices: ["residential-moving", "commercial-moving", "trucking", "gardening"]
    },
    {
      id: "canada-day",
      name: "Canada Day Long Weekend",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-CANADADAY",
      type: "fixed",
      month: 7, // July 1
      day: 1,
      leadDays: 2,
      lagDays: 1,
      enabled: true,
      bannerText: "🇨🇦 Canada Day Special — 10% OFF Moving & Freight Transport Across BC",
      eligibleServices: ["residential-moving", "commercial-moving", "junk-removal", "trucking", "flatbed-trucking"]
    },
    {
      id: "bc-day",
      name: "British Columbia Day",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-BCDAY",
      type: "nth_weekday",
      month: 8, // August
      weekday: 1, // Monday
      nth: 1, // 1st Monday in August
      leadDays: 2,
      lagDays: 0,
      enabled: true,
      bannerText: "☀️ BC Day Weekend — 10% OFF Lower Mainland Moving, Hauling & Delivery",
      eligibleServices: ["residential-moving", "commercial-moving", "junk-removal", "gardening"]
    },
    {
      id: "labour-day",
      name: "Labour Day Long Weekend",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-LABOURDAY",
      type: "nth_weekday",
      month: 9, // September
      weekday: 1, // Monday
      nth: 1, // 1st Monday in September
      leadDays: 2,
      lagDays: 0,
      enabled: true,
      bannerText: "📦 Labour Day Move Rush — 10% OFF Surrey & Vancouver Residential Relocations",
      eligibleServices: ["residential-moving", "commercial-moving", "junk-removal", "small-load-transportation"]
    },
    {
      id: "truth-and-reconciliation",
      name: "National Day for Truth and Reconciliation",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-NDTR",
      type: "fixed",
      month: 9, // Sept 30
      day: 30,
      leadDays: 1,
      lagDays: 1,
      enabled: true,
      bannerText: "🍁 Autumn Long Weekend — 10% OFF Scheduled Moves Across BC",
      eligibleServices: ["residential-moving", "junk-removal", "gardening"]
    },
    {
      id: "thanksgiving",
      name: "Thanksgiving Day",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-THANKSGIVING",
      type: "nth_weekday",
      month: 10, // October
      weekday: 1, // Monday
      nth: 2, // 2nd Monday in October
      leadDays: 2,
      lagDays: 0,
      enabled: true,
      bannerText: "🦃 Thanksgiving Long Weekend — 10% OFF Residential & Yard Cleanups in BC",
      eligibleServices: ["residential-moving", "gardening", "junk-removal"]
    },
    {
      id: "halloween",
      name: "Halloween Seasonal Cleanup & Move",
      category: "seasonal_campaign",
      discountPercentage: 10,
      code: "SEASONAL10-HALLOWEEN",
      type: "fixed_range",
      startMonth: 10,
      startDay: 28,
      endMonth: 10,
      endDay: 31,
      enabled: true,
      bannerText: "🎃 Halloween Seasonal Special — 10% OFF Yard Cleanups & Junk Hauls in BC",
      eligibleServices: ["junk-removal", "garbage-removal", "gardening", "residential-moving"]
    },
    {
      id: "remembrance-day",
      name: "Remembrance Day Weekend",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-REMEMBRANCE",
      type: "fixed",
      month: 11, // Nov 11
      day: 11,
      leadDays: 1,
      lagDays: 1,
      enabled: true,
      bannerText: "🎖️ November Long Weekend — 10% OFF Lower Mainland Relocations & Hauls",
      eligibleServices: ["residential-moving", "commercial-moving", "junk-removal"]
    },
    {
      id: "black-friday",
      name: "Black Friday Commercial Booking Event",
      category: "commercial_event",
      discountPercentage: 10,
      code: "PROMO10-BLACKFRIDAY",
      type: "black_friday", // 4th Friday of November
      leadDays: 0,
      lagDays: 2, // Through Sunday
      enabled: true,
      bannerText: "🏷️ Black Friday Booking Event — 10% OFF Commercial Freight & Corporate Moves",
      eligibleServices: ["commercial-moving", "trucking", "flatbed-trucking", "junk-removal"]
    },
    {
      id: "cyber-monday",
      name: "Cyber Monday Digital Logistics Event",
      category: "commercial_event",
      discountPercentage: 10,
      code: "PROMO10-CYBERMONDAY",
      type: "cyber_monday", // Monday after 4th Friday of November
      leadDays: 0,
      lagDays: 0, // Monday only
      enabled: true,
      bannerText: "💻 Cyber Monday Special — 10% OFF Online Transport & Moving Quotes in BC",
      eligibleServices: ["residential-moving", "commercial-moving", "trucking", "small-load-transportation"]
    },
    {
      id: "christmas",
      name: "Christmas Holiday",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-CHRISTMAS",
      type: "fixed_range",
      startMonth: 12,
      startDay: 23,
      endMonth: 12,
      endDay: 25,
      enabled: true,
      bannerText: "🎄 Christmas Season Special — 10% OFF Scheduled BC Relocations & Transport",
      eligibleServices: ["residential-moving", "commercial-moving", "trucking"]
    },
    {
      id: "boxing-day-week",
      name: "Boxing Day & Year-End Haul",
      category: "official_statutory",
      discountPercentage: 10,
      code: "HOLIDAY10-BOXINGWEEK",
      type: "fixed_range",
      startMonth: 12,
      startDay: 26,
      endMonth: 12,
      endDay: 31,
      enabled: true,
      bannerText: "🎁 Boxing Week & Year-End Haul — 10% OFF Warehousing Moves & Cleanouts",
      eligibleServices: ["residential-moving", "commercial-moving", "junk-removal", "trucking"]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignsConfig;
}
