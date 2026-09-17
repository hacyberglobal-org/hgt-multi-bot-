import { SparkOffer, SparkOrderType, GigPlatform } from './types';

export const GIG_PLATFORMS: GigPlatform[] = ['Spark', 'Instacart', 'DoorDash', 'Amazon Flex', 'Uber Eats', 'Shipt', 'Roadie', 'Bungii', 'GoShare', 'Lyft', 'Veho', 'Postmates'];

export const WALMART_STORES = [
  { number: '1024', name: 'Walmart Supercenter (Northside)' },
  { number: '2489', name: 'Walmart Neighborhood Market (Downtown)' },
  { number: '0714', name: 'Walmart Supercenter (East Gate)' },
  { number: '1782', name: 'Walmart Neighborhood Market (Lakeside)' },
  { number: '3405', name: 'Walmart Supercenter (South Valley)' },
  { number: '0831', name: 'Walmart Supercenter (Metro West)' },
];

export const INSTACART_STORES = [
  { number: '3819', name: 'Costco Wholesale #428' },
  { number: '1904', name: 'Kroger Fresh Foods (Parkway)' },
  { number: '4482', name: 'Aldi Market (Westside)' },
  { number: '9021', name: 'Target Grocery (Central Mall)' },
  { number: '6712', name: 'CVS Pharmacy (24-Hour)' },
];

export const DOORDASH_STORES = [
  { number: '8821', name: 'McDonald’s (S. Main St)' },
  { number: '7721', name: 'DashMart Fulfillment #12' },
  { number: '1389', name: 'Chipotle Mexican Grill' },
  { number: '4401', name: '7-Eleven Convenience Hub' },
  { number: '2287', name: 'Taco Bell (State Line)' },
];

export const AMAZON_STORES = [
  { number: 'DQX1', name: 'Amazon Logistics (DQX1 Depot)' },
  { number: 'WF88', name: 'Whole Foods Market (Ninth Ave)' },
  { number: 'PR02', name: 'Amazon Prime Now Hub (Central)' },
  { number: 'UFX3', name: 'Amazon Fresh (Retail Depot)' },
];

export const UBER_STORES = [
  { number: 'UBX4', name: 'Passenger Ride Hub (Downtown)' },
  { number: 'SB83', name: 'Starbucks Coffee (Grand Ave)' },
  { number: 'PL91', name: 'Local Diner & Grill (S. Side)' },
  { number: 'UB92', name: 'Uber Connect Package Hub' },
];

export const SHIPT_STORES = [
  { number: 'S192', name: 'Meijer Supercenter' },
  { number: 'S402', name: 'Target Grocery (North)' },
  { number: 'S119', name: 'H-E-B Fresh Foods' },
  { number: 'S908', name: 'Petco Supplies (Metro)' },
];

export const ROADIE_STORES = [
  { number: 'HD88', name: 'Home Depot Warehouse #104' },
  { number: 'TS24', name: 'Tractor Supply Co.' },
  { number: 'BB12', name: 'Best Buy (Logistics Center)' },
];

export const BUNGII_STORES = [
  { number: 'BU91', name: 'Bungii Heavy Dispatch Hub West' },
  { number: 'FL82', name: 'Floor & Decor Outlet' },
  { number: 'BU31', name: 'Bungii Retail Hub East' },
];

export const GOSHARE_STORES = [
  { number: 'GS40', name: 'GoShare Commercial Cargo Hub' },
  { number: 'GS11', name: 'Sherwin-Williams Commercial' },
  { number: 'GS33', name: 'Lowe’s Pro Desk Warehouse' },
];

export const LYFT_STORES = [
  { number: 'LF01', name: 'Lyft Rider Sector Alpha' },
  { number: 'LF02', name: 'Downtown Hotel & Convention Plz' },
  { number: 'LF03', name: 'Metro Airport Terminal B' },
];

export const VEHO_STORES = [
  { number: 'VH01', name: 'Veho Sorting Warehouse A' },
  { number: 'VH02', name: 'Veho Regional E-Commerce Hub' },
  { number: 'VH03', name: 'Veho Delivery Depot (Downtown)' },
];

export const POSTMATES_STORES = [
  { number: 'PM01', name: '7-Eleven Convenience (Postmates)' },
  { number: 'PM02', name: 'The Gourmet Burger Lounge' },
  { number: 'PM03', name: 'Walgreens Pharmacy Hub' },
];

export const ORDER_ITEMS_TEMPLATES = {
  // Spark
  'Shop & Deliver': [
    'Grocery order (28 items) • includes refrigerated items',
    'Quick run (7 items) • Milk, Eggs, Soft Drinks',
    'Baby essentials (12 items) • Diapers, Formula, Wipes',
    'Weekly supply (41 items) • Produce, Snacks, Dairy, Pantry',
    'Pet goods (8 items) • 2x Bulky Dog Food bags (40lbs)',
  ],
  'Curbside Pickup': [
    'Store pickup (18 items) • Loaded into trunk',
    'General batch (30 items) • Loaded into backseat',
    'Cold goods (14 items) • Loaded into trunk',
    'Bulky load (2 items) • 1x Lawn Mower, 1x Weed Whacker',
    'Double customer batch (22 items) • Multi-Stop delivery',
  ],
  'Dotcom Delivery': [
    'General Merch (4 stops) • 1x Bicycle, 3x Small parcel boxes',
    'E-Commerce batch (8 stops) • Small envelopes and parcels',
    'Home Goods order (3 stops) • Microwave and kitchen boxes',
    'Tech order (2 stops) • 1x 55" Flat screen TV, 1x Soundbar',
  ],
  // Instacart
  'Full Service': [
    'Heavy batch (42 items) • Costco Bulk Goods, 3x Water Cases',
    'Organic grocery (18 items) • Fresh Veggies, Berries, Milk',
    'Family dinner (24 items) • Chicken breasts, Seasonings, Pasta',
    'Pet Supplies (10 items) • Cat litter, canned foods',
  ],
  'Delivery Only': [
    'Pre-packed bags (3 bags) • Ready for dropoff',
    'Refrigerated batch (4 bags) • Delivery only from cooler',
    'Spirits and Wine (2 items) • ID Verification Required',
  ],
  'Shop & Bag': [
    'In-store shop (15 items) • Assemble in curbside holding locker',
    'Quick grab (5 items) • Bread, butter, flowers',
  ],
  // DoorDash
  'Restaurant Delivery': [
    'Dinner combo (3 bag units) • Hot food, keep in thermal bag',
    'Late night snack (2 items) • Burgers and shakes',
    'Pizza batch (3 boxes) • Large Pepperoni, Garlic knots',
  ],
  'Shop & Deliver (DD)': [
    'Convenience Run (12 items) • Cold medicine, sports drinks',
    'Walgreens batch (6 items) • Cosmetics and energy bars',
    'Flower arrangement (1 item) • Fragile bouquet delivery',
  ],
  'DashMart Pack': [
    'Fulfillment Order (14 items) • Sundries, ice cream, chips',
    'Pantry stock (8 items) • Canned goods, detergent pods',
  ],
  // Amazon Flex
  'Logistics Block': [
    'Multi-Stop Route (32 parcels) • Residential neighborhood envelopes',
    'Amazon Logistics Pack (28 boxes) • High-density rural route',
    'Sameday Dispatch (18 packages) • Commercial building dropoffs',
  ],
  'Prime Now Block': [
    'Grocery Block (4 stops) • Paper bags with insulated chilling packs',
    'Prime block (5 stops) • Standard local routing envelopes',
  ],
  'Whole Foods Block': [
    'Whole Foods Route (6 stops) • Fresh items, paper bags, high tips',
    'Gourmet grocery runs (3 stops) • Organics, milk crates, fish, poultry',
  ],
  // Uber
  'UberX Ride': [
    'Passenger Trip (6.2 mi) • S. Main St to Airport Gate',
    'Short Transit (2.1 mi) • Office park complex commute',
    'Premium Commute (11.5 mi) • Executive trip into financial center',
  ],
  'Food Courier': [
    'Eats order (1 item) • local coffee shop pastry/brew',
    'Double pickup (2 orders) • Sushi combo & Boba tea',
  ],
  'Uber Connect': [
    'Package Delivery (1 parcel) • Forgotten keys, hand to receiver',
    'Document courier (1 folder) • Secure office-to-office transfer',
  ],
  // Shipt
  'Shipt Shop & Deliver': [
    'Weekly gourmet basket (32 items) • Fresh berries, premium meats, organic milk',
    'Petco Run (5 items) • Dog food, cat litter, chew toys',
    'Target grocery run (14 items) • High-priority handoff',
  ],
  'Shipt Delivery Only': [
    'Pre-paid batch (4 items) • Delivered from service desk',
    'Specialty gift (1 basket) • Deliver to front office',
  ],
  // Roadie
  'Roadie Gig': [
    'Sameday cargo (3 pieces) • Delivery of electronic electronics',
    'Luggage transport (2 cases) • Airport leftover baggage service',
  ],
  'Home Depot Delivery': [
    'Oversized flatbed bundle (4 items) • 8x Lumber planks, drywall tape, joint compound',
    'Power equipment (1 unit) • Cub Cadet riding mower delivery',
  ],
  // Bungii
  'Bungii Large Load': [
    'Sofa Delivery (1 piece) • Requires helper assistance',
    'Mattress and box spring set • Delivery to second-floor apartment',
  ],
  'Bungii XL Cargo': [
    'Construction materials (8 bundles) • Concrete bags, rebar grids',
    'Office workstations (3 boxes) • Local business haul',
  ],
  // GoShare
  'GoShare LTL Freight': [
    'Industrial pallet (2 crates) • Fenced cargo van required',
    'Paint containers (24 drums) • Commercial paint supply',
  ],
  'GoShare Helper Run': [
    'Single heavy utility box • Loading docks to retail storerooms',
    'Appliance installation batch • Heavy washer & dryer transfer',
  ],
  // Lyft
  'Lyft Passenger Trip': [
    'Rider commuter route (4.2 mi) • 1-3 passengers with carryon bags',
    'Express solo ride (8.5 mi) • Residential cluster to transport terminal',
  ],
  'Lyft XL Ride': [
    'Large group trip (12.2 mi) • 5 passengers with luggage suitcases',
    'Nightlife cluster ride (5.1 mi) • Bar sector to suburbia',
  ],
  // Veho
  'Veho Route Package': [
    'Route Bundle (14 packages) • Single-neighborhood route',
    'Route Bundle (22 parcels) • Mid-density residential route',
    'Regional Route (10 large boxes) • Commercial storefront deliveries',
  ],
  'Veho Same-Day Delivery': [
    'Sameday route (5 deliveries) • Time-critical e-commerce packages',
    'Priority route (8 items) • Insulated pharmaceutical boxes',
  ],
  // Postmates
  'Postmates Merchant Run': [
    'Convenience items (6 items) • Ice cream, drinks, charging cables',
    'Walgreens batch (3 items) • Prescriptions and snacks',
  ],
  'Postmates Instant Food': [
    'Gourmet burger combo (2 bags) • Hot food, keep in thermal bag',
    'Boba tea tray (4 cups) • Sealed cups, handle with care',
  ]
};

export function generateRandomSparkOffer(activePlatforms: GigPlatform[] = GIG_PLATFORMS): SparkOffer {
  const allowedPlatforms = activePlatforms.length > 0 ? activePlatforms : GIG_PLATFORMS;
  const platform = allowedPlatforms[Math.floor(Math.random() * allowedPlatforms.length)];

  let store = WALMART_STORES[0];
  let types: SparkOrderType[] = [];

  if (platform === 'Spark') {
    store = WALMART_STORES[Math.floor(Math.random() * WALMART_STORES.length)];
    types = ['Shop & Deliver', 'Curbside Pickup', 'Dotcom Delivery'];
  } else if (platform === 'Instacart') {
    store = INSTACART_STORES[Math.floor(Math.random() * INSTACART_STORES.length)];
    types = ['Full Service', 'Delivery Only', 'Shop & Bag'];
  } else if (platform === 'DoorDash') {
    store = DOORDASH_STORES[Math.floor(Math.random() * DOORDASH_STORES.length)];
    types = ['Restaurant Delivery', 'Shop & Deliver (DD)', 'DashMart Pack'];
  } else if (platform === 'Amazon Flex') {
    store = AMAZON_STORES[Math.floor(Math.random() * AMAZON_STORES.length)];
    types = ['Logistics Block', 'Prime Now Block', 'Whole Foods Block'];
  } else if (platform === 'Uber Eats') {
    store = UBER_STORES[Math.floor(Math.random() * UBER_STORES.length)];
    types = ['UberX Ride', 'Food Courier', 'Uber Connect'];
  } else if (platform === 'Shipt') {
    store = SHIPT_STORES[Math.floor(Math.random() * SHIPT_STORES.length)];
    types = ['Shipt Shop & Deliver', 'Shipt Delivery Only'];
  } else if (platform === 'Roadie') {
    store = ROADIE_STORES[Math.floor(Math.random() * ROADIE_STORES.length)];
    types = ['Roadie Gig', 'Home Depot Delivery'];
  } else if (platform === 'Bungii') {
    store = BUNGII_STORES[Math.floor(Math.random() * BUNGII_STORES.length)];
    types = ['Bungii Large Load', 'Bungii XL Cargo'];
  } else if (platform === 'GoShare') {
    store = GOSHARE_STORES[Math.floor(Math.random() * GOSHARE_STORES.length)];
    types = ['GoShare LTL Freight', 'GoShare Helper Run'];
  } else if (platform === 'Veho') {
    store = VEHO_STORES[Math.floor(Math.random() * VEHO_STORES.length)];
    types = ['Veho Route Package', 'Veho Same-Day Delivery'];
  } else if (platform === 'Postmates') {
    store = POSTMATES_STORES[Math.floor(Math.random() * POSTMATES_STORES.length)];
    types = ['Postmates Merchant Run', 'Postmates Instant Food'];
  } else {
    store = LYFT_STORES[Math.floor(Math.random() * LYFT_STORES.length)];
    types = ['Lyft Passenger Trip', 'Lyft XL Ride'];
  }

  const type = types[Math.floor(Math.random() * types.length)];

  let basePay = 0;
  let tip = 0;
  let distance = Number((Math.random() * 12 + 1.2).toFixed(1)); // 1.2 to 13.2 miles
  let itemsCount = 0;

  if (platform === 'Spark') {
    if (type === 'Shop & Deliver') {
      itemsCount = Math.floor(Math.random() * 45) + 3;
      basePay = Number((10 + itemsCount * 0.35 + distance * 0.5).toFixed(2));
      tip = Math.random() > 0.15 ? Number((Math.random() * 15 + 2).toFixed(2)) : 0;
    } else if (type === 'Curbside Pickup') {
      itemsCount = Math.floor(Math.random() * 50) + 5;
      basePay = Number((7 + distance * 0.7).toFixed(2));
      tip = Math.random() > 0.4 ? Number((Math.random() * 8 + 1).toFixed(2)) : 0;
    } else {
      itemsCount = Math.floor(Math.random() * 8) + 2; // represents stops
      basePay = Number((12 + itemsCount * 3.5 + distance * 0.8).toFixed(2));
      tip = 0;
    }
  } else if (platform === 'Instacart') {
    if (type === 'Full Service') {
      itemsCount = Math.floor(Math.random() * 55) + 5;
      basePay = Number((8 + itemsCount * 0.4 + distance * 0.4).toFixed(2));
      tip = Math.random() > 0.1 ? Number((Math.random() * 25 + 3).toFixed(2)) : 0;
    } else if (type === 'Delivery Only') {
      itemsCount = Math.floor(Math.random() * 6) + 1; // bags
      basePay = Number((5 + distance * 0.8).toFixed(2));
      tip = Math.random() > 0.3 ? Number((Math.random() * 10).toFixed(2)) : 0;
    } else {
      itemsCount = Math.floor(Math.random() * 25) + 2;
      basePay = Number((6 + itemsCount * 0.2).toFixed(2));
      tip = 0;
    }
  } else if (platform === 'DoorDash') {
    itemsCount = Math.floor(Math.random() * 12) + 1;
    if (type === 'Restaurant Delivery') {
      basePay = Number((2.5 + distance * 1.1).toFixed(2));
      tip = Math.random() > 0.25 ? Number((Math.random() * 12 + 2).toFixed(2)) : 0;
    } else if (type === 'Shop & Deliver (DD)') {
      basePay = Number((6 + itemsCount * 0.5 + distance * 0.6).toFixed(2));
      tip = Math.random() > 0.2 ? Number((Math.random() * 14 + 1.5).toFixed(2)) : 0;
    } else {
      basePay = Number((4 + distance * 1.0).toFixed(2));
      tip = Math.random() > 0.4 ? Number((Math.random() * 6).toFixed(2)) : 0;
    }
  } else if (platform === 'Amazon Flex') {
    if (type === 'Logistics Block') {
      itemsCount = Math.floor(Math.random() * 20) + 20; // parcels
      basePay = Number((54 + Math.floor(Math.random() * 3) * 18).toFixed(2));
      tip = 0;
    } else if (type === 'Prime Now Block') {
      itemsCount = Math.floor(Math.random() * 15) + 10; // packages
      basePay = Number((36 + Math.floor(Math.random() * 2) * 18).toFixed(2));
      tip = Math.random() > 0.2 ? Number((Math.random() * 15 + 5).toFixed(2)) : 0;
    } else {
      itemsCount = Math.floor(Math.random() * 15) + 5; // bags
      basePay = Number((34 + Math.floor(Math.random() * 2) * 17).toFixed(2));
      tip = Math.random() > 0.1 ? Number((Math.random() * 30 + 10).toFixed(2)) : 0;
    }
  } else if (platform === 'Uber Eats') {
    itemsCount = Math.floor(Math.random() * 5) + 1;
    if (type === 'UberX Ride') {
      itemsCount = 0;
      basePay = Number((4.5 + distance * 1.35).toFixed(2));
      tip = Math.random() > 0.5 ? Number((Math.random() * 10 + 2).toFixed(2)) : 0;
    } else if (type === 'Food Courier') {
      basePay = Number((2.0 + distance * 0.9).toFixed(2));
      tip = Math.random() > 0.3 ? Number((Math.random() * 8 + 1.5).toFixed(2)) : 0;
    } else {
      basePay = Number((5.5 + distance * 1.2).toFixed(2));
      tip = Math.random() > 0.6 ? Number((Math.random() * 12).toFixed(2)) : 0;
    }
  } else if (platform === 'Shipt') {
    if (type === 'Shipt Shop & Deliver') {
      itemsCount = Math.floor(Math.random() * 30) + 5;
      basePay = Number((9.5 + itemsCount * 0.3 + distance * 0.4).toFixed(2));
      tip = Math.random() > 0.15 ? Number((Math.random() * 18 + 4).toFixed(2)) : 0;
    } else {
      itemsCount = Math.floor(Math.random() * 5) + 1;
      basePay = Number((6.0 + distance * 0.6).toFixed(2));
      tip = Math.random() > 0.3 ? Number((Math.random() * 10).toFixed(2)) : 0;
    }
  } else if (platform === 'Roadie') {
    itemsCount = Math.floor(Math.random() * 3) + 1;
    if (type === 'Home Depot Delivery') {
      basePay = Number((25.0 + distance * 1.5).toFixed(2));
      tip = Math.random() > 0.70 ? Number((Math.random() * 20).toFixed(2)) : 0;
    } else {
      basePay = Number((12.0 + distance * 1.1).toFixed(2));
      tip = Math.random() > 0.40 ? Number((Math.random() * 8).toFixed(2)) : 0;
    }
  } else if (platform === 'Bungii') {
    itemsCount = Math.floor(Math.random() * 2) + 1;
    basePay = Number((45.0 + distance * 2.2).toFixed(2));
    tip = Math.random() > 0.25 ? Number((Math.random() * 30 + 10).toFixed(2)) : 0;
  } else if (platform === 'GoShare') {
    itemsCount = Math.floor(Math.random() * 2) + 1;
    basePay = Number((65.0 + distance * 2.5).toFixed(2));
    tip = Math.random() > 0.30 ? Number((Math.random() * 40 + 15).toFixed(2)) : 0;
  } else if (platform === 'Veho') {
    itemsCount = Math.floor(Math.random() * 15) + 10; // packages
    if (type === 'Veho Route Package') {
      basePay = Number((42.0 + distance * 1.6).toFixed(2));
      tip = Math.random() > 0.8 ? Number((Math.random() * 10).toFixed(2)) : 0; // mostly base pay
    } else {
      basePay = Number((28.0 + distance * 1.9).toFixed(2));
      tip = Math.random() > 0.5 ? Number((Math.random() * 15 + 5).toFixed(2)) : 0;
    }
  } else if (platform === 'Postmates') {
    itemsCount = Math.floor(Math.random() * 8) + 1;
    if (type === 'Postmates Merchant Run') {
      basePay = Number((4.5 + distance * 0.95).toFixed(2));
      tip = Math.random() > 0.3 ? Number((Math.random() * 8 + 1).toFixed(2)) : 0;
    } else {
      basePay = Number((3.0 + distance * 1.15).toFixed(2));
      tip = Math.random() > 0.2 ? Number((Math.random() * 12 + 2).toFixed(2)) : 0;
    }
  } else {
    itemsCount = 0;
    if (type === 'Lyft XL Ride') {
      basePay = Number((12.5 + distance * 1.85).toFixed(2));
      tip = Math.random() > 0.4 ? Number((Math.random() * 15 + 3).toFixed(2)) : 0;
    } else {
      basePay = Number((5.5 + distance * 1.15).toFixed(2));
      tip = Math.random() > 0.45 ? Number((Math.random() * 8 + 1).toFixed(2)) : 0;
    }
  }

  const totalPay = Number((basePay + tip).toFixed(2));
  let prefix = 'SPK';
  if (platform === 'Instacart') prefix = 'ICA';
  else if (platform === 'DoorDash') prefix = 'DDS';
  else if (platform === 'Amazon Flex') prefix = 'AMZ';
  else if (platform === 'Uber Eats') prefix = 'UBR';
  else if (platform === 'Shipt') prefix = 'SHP';
  else if (platform === 'Roadie') prefix = 'ROD';
  else if (platform === 'Bungii') prefix = 'BUN';
  else if (platform === 'GoShare') prefix = 'GSH';
  else if (platform === 'Lyft') prefix = 'LYF';
  else if (platform === 'Veho') prefix = 'VEH';
  else if (platform === 'Postmates') prefix = 'PMT';

  const id = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = Date.now();

  const offerLifespanSec = totalPay > 35 ? 10 : 20;
  const expiresAt = now + offerLifespanSec * 1000;

  return {
    id,
    storeNumber: store.number,
    storeName: store.name,
    type,
    basePay,
    tip,
    distance,
    itemsCount,
    totalPay,
    createdAt: now,
    expiresAt,
    status: 'pending',
    platform
  };
}

export const BOT_FAQS = [
  {
    question: 'How does an auto-accept Spark / Multi-Gig Bot work?',
    answer: 'A Multi-Gig tapper bot connects to or overlays onto your device’s delivery apps (Spark, DoorDash, Instacart, Uber, Amazon Flex) to monitor incoming blocks and "First-Come, First-Served" (FCFS) orders. Because delivery orders disappear within milliseconds when driver demand is high, the bot screens key parameters (payment, distance, types) and triggers automatic "Accept" taps instantly in the background.'
  },
  {
    question: 'What are the risks of using a driver bot on gig networks?',
    answer: 'The primary risk is permanent account deactivation. Anti-cheat algorithms monitor for inhuman acceptance speeds and repeated background network calls. Furthermore, getting a bot often involves installing unauthorized third-party APKs or providing your account credentials to shady services, leading to identity theft or wage draining.'
  },
  {
    question: 'Are there legitimate filters built into the apps?',
    answer: 'No, native gig apps do not allow pre-filtering or automated screening. You must evaluate every order manually, often while driving, which is both competitive and dangerous.'
  },
  {
    question: 'How do drivers optimize their earnings without bots?',
    answer: 'Experienced drivers optimize by parking close to high-volume supercenters, warehouses, or hot spots, using newer devices on low-latency 5G networks, learning which times have high demand, and focusing on high-base-pay segments which require manual effort that auto-grabbers cannot replace.'
  }
];
