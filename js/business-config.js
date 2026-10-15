/**
 * SPN TRUCKING LTD. — CENTRALIZED BUSINESS CONFIGURATION
 * Calgary, Alberta, Canada
 * 
 * Verified Business Information:
 * Company: SPN Trucking Ltd.
 * Contact: Abbas, Managing Director
 * Phone: 778-302-8803
 * Email: stntruckingltd@gmail.com
 * Target Market: Calgary, Alberta, Canada
 * Secondary Market: Lower Mainland & British Columbia Corridor (By Inquiry)
 */

const BusinessConfig = {
  name: "SPN Trucking Ltd.",
  legalName: "SPN Trucking Ltd.",
  managingDirector: "Abbas",
  city: "Calgary",
  province: "Alberta",
  country: "Canada",
  timezone: "America/Edmonton", // Mountain Time (MT)
  domain: window.location.origin || "https://spntrucking.ca",

  // Verified Contact Details
  contact: {
    phone: {
      display: "778-302-8803",
      raw: "7783028803",
      telLink: "tel:7783028803",
      verified: true,
      callActionAvailable: true,
      note: "Primary dispatch and customer line for Abbas, Managing Director."
    },
    email: {
      display: "stntruckingltd@gmail.com",
      raw: "stntruckingltd@gmail.com",
      mailLink: "mailto:stntruckingltd@gmail.com",
      verified: true,
      note: "Official customer inquiries and dispatch inbox."
    },
    hours: {
      headline: "24/7 Dispatch & Enquiries",
      verified: true,
      clarificationNote: "Telephone inquiries and scheduled transport operating 24/7; warehouse and depot pickups by appointment.",
      officeHoursDisplay: "Monday – Sunday: 24/7 Dispatch (Subject to scheduling confirmation)"
    },
    headquarters: {
      address: "Calgary, Alberta, Canada (Mobile Dispatch Depot)",
      verified: true,
      note: "Operating across greater Calgary metro, Airdrie, Chestermere, Cochrane, Okotoks, and Rocky View County."
    }
  },

  // Industry Experience Verification
  experience: {
    years: "5+",
    title: "5+ Years of Industry Experience",
    holder: "Abbas, Managing Director",
    verified: true, // Configurable owner verification toggle
    distinctionNote: "Reflects the seasoned logistics and transportation industry experience of Managing Director Abbas. Corporate incorporation details kept transparent."
  },

  // Service Areas (Calgary Core + Lower Mainland / BC Western Corridor)
  serviceAreas: {
    status: "Active Calgary Operations & Western Corridor Linehaul",
    verified: true,
    disclaimer: "Core daily operations centered in the Greater Calgary Region. Long-haul freight and moves to British Columbia and Saskatchewan scheduled on demand.",
    regions: [
      {
        name: "Greater Calgary Metro (Primary Core)",
        status: "Active Daily Dispatch",
        municipalities: [
          "Downtown Calgary", "SW Calgary", "NW Calgary", "SE Calgary", "NE Calgary",
          "Airdrie", "Chestermere", "Cochrane", "Okotoks", "Rocky View County"
        ],
        note: "Complete residential & commercial moving, junk hauling, small load transport, and yard cleanups."
      },
      {
        name: "Regional Alberta Linehaul",
        status: "Daily / Scheduled Linehaul",
        municipalities: ["Red Deer", "Edmonton", "High River", "Canmore", "Banff", "Strathmore"],
        note: "Dedicated freight runs, flatbed cargo, and regional relocations."
      },
      {
        name: "Lower Mainland & British Columbia Corridor",
        status: "Scheduled Inter-Provincial Corridor",
        municipalities: ["Vancouver", "Surrey", "Fraser Valley", "Burnaby", "Richmond", "Kamloops", "Kelowna"],
        note: "Highway linehaul (up to 53 ft), residential cross-provincial moves, and insulated transport."
      }
    ]
  },

  // Comprehensive Services Directory
  services: {
    residentialMoving: {
      id: "residential-moving",
      title: "Residential Moving",
      shortDesc: "Careful household moves across Calgary with protective furniture blankets, floor runners, and transparent hourly rates.",
      pageUrl: "services-residential-moving.html",
      icon: "🏠",
      verified: true
    },
    commercialMoving: {
      id: "commercial-moving",
      title: "Commercial Moving",
      shortDesc: "Structured office, retail, and corporate relocations in Calgary scheduled to minimize business downtime.",
      pageUrl: "services-commercial-moving.html",
      icon: "🏢",
      verified: true
    },
    industrialMoving: {
      id: "industrial-moving",
      title: "Industrial Moving",
      shortDesc: "Heavy workshop tools, light industrial machinery, warehouse transfers, and manufacturing equipment logistics.",
      pageUrl: "services-industrial-moving.html",
      icon: "⚙️",
      verified: true
    },
    smallLoadTransportation: {
      id: "small-load-transportation",
      title: "Small Load Transportation",
      shortDesc: "Expedited single-item, palletized goods, store pickup, and furniture delivery across Calgary metro.",
      pageUrl: "services-small-load-transportation.html",
      icon: "📦",
      verified: true
    },
    junkRemoval: {
      id: "junk-removal",
      title: "Junk Removal",
      shortDesc: "Fast, stress-free household, garage, and estate clutter clearing with eco-conscious donation and transfer station sorting.",
      pageUrl: "services-junk-removal.html",
      icon: "🗑️",
      verified: true
    },
    garbageRemoval: {
      id: "garbage-removal",
      title: "Garbage Removal",
      shortDesc: "Prompt residential, commercial, and renovation waste carting directly to certified Calgary municipal facilities.",
      pageUrl: "services-garbage-removal.html",
      icon: "♻️",
      verified: true
    },
    trucking: {
      id: "trucking",
      title: "Long-Haul & Regional Trucking",
      shortDesc: "Dedicated dry van and highway linehaul transport up to 53 ft connecting Calgary, Alberta, and Western corridors.",
      pageUrl: "services-trucking.html",
      icon: "🚛",
      verified: true
    },
    flatbedTrucking: {
      id: "flatbed-trucking",
      title: "Flatbed Trucking",
      shortDesc: "Open-deck transport for machinery, lumber, steel, palletized goods, and heavy job-site building supplies.",
      pageUrl: "services-flatbed-trucking.html",
      icon: "🚚",
      verified: true
    },
    refrigeratedTrucking: {
      id: "refrigerated-trucking",
      title: "Refrigerated & Insulated Transport",
      shortDesc: "Temperature-controlled reefer units and insulated cargo bodies for perishables, dairy, and cold-sensitive freight.",
      pageUrl: "services-refrigerated-trucking.html",
      icon: "❄️",
      verified: true
    },
    beverageTransportation: {
      id: "beverage-transportation",
      title: "Beverage Transportation",
      shortDesc: "Specialized pallet and keg hauling for breweries, distributors, and retailers across Calgary and regional lanes.",
      pageUrl: "services-refrigerated-trucking.html#beverage",
      icon: "🥤",
      verified: true
    },
    gardening: {
      id: "gardening",
      title: "Gardening & Yard Cleanup",
      shortDesc: "Seasonal lawn care, hedge trimming, branch removal, and green waste carting to keep Calgary properties pristine.",
      pageUrl: "services-gardening.html",
      icon: "🌿",
      verified: true
    },
    toolServices: {
      id: "tool-services",
      title: "Tools & Equipment Supply",
      shortDesc: "Moving ramps, heavy-duty dollies, pallet jacks, and property maintenance equipment support.",
      pageUrl: "services-tool-services.html",
      icon: "🔧",
      verified: true
    }
  },

  // Fleet Range Specifications
  fleet: [
    {
      range: "10' – 15' Agile Urban Cutaways",
      capacity: "2,500 – 4,000 lbs",
      dimensions: "10-15' Box",
      bestFor: "Studio / 1-bedroom moves, small load deliveries, and tight Calgary residential driveways."
    },
    {
      range: "16' – 24' Insulated Box Trucks",
      capacity: "5,000 – 10,000 lbs",
      dimensions: "16-24' Box",
      bestFor: "2 to 4-bedroom homes, commercial inventory, and weather-protected cargo."
    },
    {
      range: "Flatbed Trucks & Trailers",
      capacity: "Up to 25,000 lbs",
      dimensions: "20' – 40' Deck",
      bestFor: "Machinery, construction supplies, crated cargo, and open-deck industrial transport."
    },
    {
      range: "53' Highway Reefer & Dry Van",
      capacity: "Up to 45,000 lbs",
      dimensions: "53' Semi-Trailer",
      bestFor: "Full truckload (FTL) commercial logistics across Alberta, BC, and Western Canada."
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BusinessConfig;
}
