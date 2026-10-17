/**
 * STN TRUCKING LTD. — CENTRALIZED BUSINESS CONFIGURATION
 * Surrey & Vancouver, British Columbia, Canada
 * 
 * Verified Business Information:
 * Company: STN Trucking Ltd.
 * Contact: Abbas, Managing Director
 * Phone: 778-302-8803
 * Email: stntruckingltd@gmail.com
 * Primary Target Market: Surrey, Vancouver, Lower Mainland, BC
 * Secondary Corridor: British Columbia Highway Corridors (By Confirmed Inquiry)
 */

const BusinessConfig = {
  name: "STN Trucking Ltd.",
  legalName: "STN Trucking Ltd.",
  managingDirector: "Abbas",
  city: "Surrey & Vancouver",
  province: "British Columbia",
  country: "Canada",
  timezone: "America/Vancouver", // Pacific Time (PT)
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
      address: "Surrey & Vancouver, British Columbia, Canada (Mobile Dispatch Depot)",
      verified: true,
      note: "Operating across Surrey, Vancouver, Burnaby, Richmond, Langley, Delta, Coquitlam, New Westminster, and the Lower Mainland."
    }
  },

  // Industry Experience Verification
  experience: {
    years: "5+",
    title: "5+ Years of Industry Experience",
    holder: "Abbas, Managing Director",
    verified: true,
    distinctionNote: "Reflects the seasoned logistics and transportation industry experience of Managing Director Abbas. Corporate incorporation details kept transparent."
  },

  // Service Areas (Surrey Core + Vancouver Metro + Lower Mainland + BC Corridor)
  serviceAreas: {
    status: "Active Surrey & Vancouver Operations & BC Highway Linehaul",
    verified: true,
    disclaimer: "Core daily operations centered in Surrey, Vancouver, and the Lower Mainland. Long-haul freight across British Columbia scheduled on confirmed demand.",
    regions: [
      {
        name: "Surrey & South Fraser (Primary Core)",
        status: "Active Daily Dispatch",
        municipalities: [
          "Surrey", "North Surrey", "South Surrey", "Guildford", "Fleetwood", "Newton", "Cloverdale",
          "Langley", "Delta", "White Rock"
        ],
        note: "Complete residential & commercial moving, flatbed hauling, junk removal, small load deliveries, and yard cleanups."
      },
      {
        name: "Metro Vancouver & North Shore",
        status: "Active Daily Dispatch",
        municipalities: [
          "Vancouver", "Downtown Vancouver", "Burnaby", "Richmond", "New Westminster",
          "Coquitlam", "Port Coquitlam", "Port Moody", "North Vancouver", "West Vancouver"
        ],
        note: "Condo & high-rise relocations, office moving, pallet deliveries, expedited urban courier runs."
      },
      {
        name: "Fraser Valley & Regional BC Linehaul",
        status: "Scheduled Daily / Route Linehaul",
        municipalities: ["Abbotsford", "Chilliwack", "Mission", "Hope", "Squamish", "Whistler"],
        note: "Dedicated freight runs, flatbed cargo, and regional relocations."
      },
      {
        name: "Inter-City British Columbia Corridors",
        status: "Scheduled Linehaul (By Confirmed Inquiry)",
        municipalities: ["Kamloops", "Kelowna", "Vernon", "Penticton", "Prince George", "Vancouver Island (Ferry Linehaul)"],
        note: "Highway linehaul (up to 53 ft), residential cross-regional moves, and commercial freight."
      }
    ]
  },

  // Comprehensive Services Directory (11 Core Offerings)
  services: {
    flatbedTrucking: {
      id: "flatbed-trucking",
      title: "Flatbed Trucking",
      shortDesc: "Medium and heavy-duty open deck transport for construction materials, structural steel, machinery, and jobsite equipment across Surrey and Vancouver.",
      pageUrl: "services-flatbed-trucking.html",
      icon: "🚚",
      imageUrl: "assets/fleet/fleet_flatbed_truck.jpg",
      serviceArea: "Surrey, Vancouver, Lower Mainland & BC Highway Corridors",
      confirmationNote: "Standard dispatch; over-dimension loads confirmed with dispatch.",
      verified: true
    },
    smallLoadTransportation: {
      id: "small-load-transportation",
      title: "Small Load Transportation",
      shortDesc: "Compact 10 ft to 15 ft trucks for furniture, appliances, store deliveries, and small residential and commercial deliveries across Surrey & Vancouver metro.",
      pageUrl: "services-small-load-transportation.html",
      icon: "📦",
      imageUrl: "assets/fleet/fleet_10ft_truck.jpg",
      serviceArea: "Surrey, Vancouver, Burnaby, Richmond, Langley, Delta",
      confirmationNote: "Daily dispatch available.",
      verified: true
    },
    trucking: {
      id: "trucking",
      title: "Long-Haul Transportation (53')",
      shortDesc: "Highway tractor-trailers and dry van box trailers up to 53 ft for long-distance regional and inter-provincial freight transport across BC and beyond.",
      pageUrl: "services-trucking.html",
      icon: "🚛",
      imageUrl: "assets/fleet/fleet_53ft_long_haul.jpg",
      serviceArea: "British Columbia Highway Corridors & Western Canada",
      confirmationNote: "Scheduled linehaul based on equipment availability.",
      verified: true
    },
    refrigeratedTrucking: {
      id: "refrigerated-trucking",
      title: "Insulated & Refrigerated Transportation",
      shortDesc: "Insulated box trucks and refrigerated units for temperature-sensitive cargo, produce, and specialty cold-chain freight.",
      pageUrl: "services-refrigerated-trucking.html",
      icon: "❄️",
      imageUrl: "assets/fleet/fleet_refrigerated_truck.jpg",
      serviceArea: "Lower Mainland & Dedicated BC Corridors",
      confirmationNote: "Only scheduled upon direct business confirmation of unit availability.",
      verified: true
    },
    beverageTransportation: {
      id: "beverage-transportation",
      title: "Beverage Transportation",
      shortDesc: "Palletized beverage deliveries, wholesale distribution, and commercial keg/can transportation for Lower Mainland producers.",
      pageUrl: "services-refrigerated-trucking.html#beverage",
      icon: "🥤",
      imageUrl: "assets/fleet/fleet_beverage_transport.jpg",
      serviceArea: "Surrey, Vancouver & Fraser Valley Distribution Routes",
      confirmationNote: "Commercial freight scheduled after business route confirmation.",
      verified: true
    },
    junkRemoval: {
      id: "junk-removal",
      title: "Junk Removal",
      shortDesc: "Full-service pickup and dump-body collection for household junk, furniture, mattresses, renovation debris, and garage or estate cleanouts.",
      pageUrl: "services-junk-removal.html",
      icon: "🗑️",
      imageUrl: "assets/fleet/fleet_junk_removal_truck.jpg",
      serviceArea: "Surrey, Vancouver, Langley, Delta, Richmond & Metro Area",
      confirmationNote: "Prompt dispatch with eco-friendly recycling & donation sorting.",
      verified: true
    },
    garbageRemoval: {
      id: "garbage-removal",
      title: "Garbage Removal",
      shortDesc: "Authorized residential and commercial waste collection, renovation scrap, and construction disposal carting to certified Lower Mainland facilities.",
      pageUrl: "services-garbage-removal.html",
      icon: "♻️",
      imageUrl: "assets/fleet/fleet_garbage_removal.jpg",
      serviceArea: "Surrey, Vancouver & Lower Mainland Approved Facilities",
      confirmationNote: "Provided strictly within authorized municipal disposal categories.",
      verified: true
    },
    residentialMoving: {
      id: "residential-moving",
      title: "Residential Moving",
      shortDesc: "Full-service house, apartment, and condo moving with moving blankets, dollies, cargo straps, and careful loading across Surrey and Vancouver.",
      pageUrl: "services-residential-moving.html",
      icon: "🏠",
      imageUrl: "assets/fleet/fleet_residential_moving.jpg",
      serviceArea: "Surrey, Vancouver, Burnaby, Richmond, Langley, Delta & Tri-Cities",
      confirmationNote: "Transparent hourly or flat rates; 10% student discount eligible.",
      verified: true
    },
    commercialMoving: {
      id: "commercial-moving",
      title: "Commercial Moving",
      shortDesc: "Office relocations, retail store transfers, workstation transport, and systematic setup scheduled to minimize downtime for BC businesses.",
      pageUrl: "services-commercial-moving.html",
      icon: "🏢",
      imageUrl: "assets/fleet/fleet_commercial_moving.jpg",
      serviceArea: "Surrey, Vancouver, Burnaby & Lower Mainland Business Hubs",
      confirmationNote: "Flexible evening and weekend scheduling available.",
      verified: true
    },
    industrialMoving: {
      id: "industrial-moving",
      title: "Industrial Moving",
      shortDesc: "Flatbed equipment transportation, workshop tool transfers, warehouse machinery, and light industrial equipment logistics across BC.",
      pageUrl: "services-industrial-moving.html",
      icon: "⚙️",
      imageUrl: "assets/fleet/fleet_industrial_moving.jpg",
      serviceArea: "Lower Mainland Industrial Parks & BC Corridors",
      confirmationNote: "Scheduled subject to rigging & heavy equipment confirmation.",
      verified: true
    },
    gardening: {
      id: "gardening",
      title: "Landscaping & Pressure Washing",
      shortDesc: "Commercial & residential pressure washing (driveway before & after, walkways, patios), seasonal hedge trimming, and green waste carting across Surrey & Vancouver.",
      pageUrl: "services-gardening.html",
      icon: "🌿",
      imageUrl: "assets/fleet/fleet_gardening_yard_cleanup.jpg",
      serviceArea: "Surrey, Vancouver, Delta, Langley & Lower Mainland",
      confirmationNote: "Complete pressure washing and prompt carting to organic green waste composting facilities.",
      verified: true
    },
    toolServices: {
      id: "tool-services",
      title: "Tools & Equipment Supply",
      shortDesc: "Professional equipment supply including heavy-duty dollies, moving ramps, straps, and project maintenance gear.",
      pageUrl: "services-tool-services.html",
      icon: "🔧",
      imageUrl: "assets/fleet/fleet_tools_equipment.jpg",
      serviceArea: "Surrey, Vancouver & Lower Mainland Dispatch",
      confirmationNote: "Supplied with move/cleanup services; standalone rental subject to confirmation.",
      verified: true
    }
  },

  // Fleet Range Specifications
  fleet: [
    {
      range: "10' – 15' Agile Urban Cutaways",
      capacity: "2,500 – 4,000 lbs",
      dimensions: "10-15' Box",
      imageUrl: "assets/fleet/fleet_10ft_truck.jpg",
      bestFor: "Surrey & Vancouver apartments, single-room suites, student relocations, and tight residential lanes."
    },
    {
      range: "16' – 24' Medium & Insulated Box Trucks",
      capacity: "5,000 – 10,000 lbs",
      dimensions: "16-24' Box",
      imageUrl: "assets/fleet/fleet_15ft_truck.jpg",
      bestFor: "2 to 4-bedroom homes, commercial retail moves, and weather-protected cargo across Lower Mainland."
    },
    {
      range: "Flatbed Trucks & Equipment Decks",
      capacity: "Up to 25,000 lbs",
      dimensions: "20' – 40' Deck",
      imageUrl: "assets/fleet/fleet_flatbed_truck.jpg",
      bestFor: "Construction supplies, machinery, crated equipment, and open-deck industrial transport across BC."
    },
    {
      range: "53' Highway Tractor-Trailer & Reefer",
      capacity: "Up to 45,000 lbs",
      dimensions: "53' Semi-Trailer",
      imageUrl: "assets/fleet/fleet_53ft_long_haul.jpg",
      bestFor: "Full truckload (FTL) commercial logistics connecting Lower Mainland, BC, and western corridors."
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BusinessConfig;
}
