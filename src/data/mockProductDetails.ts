import { Product } from '@/contexts/CartContext';

export interface ProductDetail extends Product {
  handle: string;
  brand: string;
  sku: string;
  longDescription: string;
  images: string[];
  specifications: Array<{ label: string; value: string }>;
  fitment: Array<{ make: string; model: string; years: string }>;
  crossReference: string[];
}

export const MOCK_PRODUCT_DETAILS: Record<string, ProductDetail> = {
  'p1': {
    id: 'p1',
    handle: 'p1',
    name: 'Professional Socket Set - 145 Piece',
    brand: 'GearWrench',
    sku: 'GW-80550',
    price: 249.99,
    category: 'Tools',
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
    images: [
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    ],
    description: 'Complete socket set with ratchets, extensions, and adapters. Chrome vanadium steel construction.',
    longDescription: `The GearWrench Professional 145-Piece Socket Set is the ultimate tool collection for automotive professionals. Manufactured from premium chrome vanadium steel with a polished chrome finish, this comprehensive set includes everything you need for any repair job.

Features:
• 72-tooth ratchets for 5° swing arc
• Full polish chrome finish resists corrosion
• Off-corner loading design reduces fastener rounding
• Organized blow-molded case for easy transport
• Lifetime manufacturer warranty
• Includes SAE and metric sockets from 1/4" to 3/4" drive`,
    inStock: true,
    specifications: [
      { label: 'Drive Sizes', value: '1/4", 3/8", 1/2"' },
      { label: 'Material', value: 'Chrome Vanadium Steel' },
      { label: 'Finish', value: 'Polished Chrome' },
      { label: 'Piece Count', value: '145 Pieces' },
      { label: 'Case Type', value: 'Blow-Molded' },
      { label: 'Warranty', value: 'Lifetime' },
    ],
    fitment: [],
    crossReference: ['SK80550', 'CTA-8550', 'SUN-80145'],
  },
  'p2': {
    id: 'p2',
    handle: 'p2',
    name: 'Synthetic Motor Oil 5W-30 (Case of 12)',
    brand: 'Mobil 1',
    sku: 'MOB1-120766',
    price: 89.99,
    category: 'Fluids & Chemicals',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800',
    ],
    description: 'Premium synthetic motor oil. API certified, high-performance formula for modern engines.',
    longDescription: `Mobil 1 Advanced Full Synthetic Motor Oil 5W-30 is engineered to help keep engines running like new by providing exceptional wear protection, cleaning power and overall performance. This case of 12 quarts offers excellent value for professional shops.

Features:
• Exceeds industry standards for wear protection
• Outstanding thermal and oxidation stability
• Excellent low-temperature capabilities
• Helps prevent deposits and sludge buildup
• Enhanced frictional properties aid fuel economy
• API SN PLUS, ILSAC GF-5 certified`,
    inStock: true,
    specifications: [
      { label: 'Viscosity Grade', value: '5W-30' },
      { label: 'API Service', value: 'SN PLUS, SP' },
      { label: 'ILSAC', value: 'GF-5, GF-6A' },
      { label: 'Package', value: '12 x 1 Quart Bottles' },
      { label: 'Total Volume', value: '3 Gallons (12 Quarts)' },
      { label: 'Type', value: 'Full Synthetic' },
    ],
    fitment: [
      { make: 'Universal', model: 'Most gasoline engines', years: 'All Years' },
      { make: 'Ford', model: 'F-150', years: '2011-2024' },
      { make: 'Chevrolet', model: 'Silverado', years: '2014-2024' },
      { make: 'Toyota', model: 'Camry', years: '2018-2024' },
    ],
    crossReference: ['120766', 'MOB1-5W30', 'PENZOIL-550045208'],
  },
  'p3': {
    id: 'p3',
    handle: 'p3',
    name: 'OBD2 Diagnostic Scanner Pro',
    brand: 'Autel',
    sku: 'AUT-AL539',
    price: 179.99,
    category: 'Diagnostic Equipment',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
    images: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    ],
    description: 'Advanced OBD2 scanner with live data, freeze frame, and emissions readiness check.',
    longDescription: `The Autel AutoLink AL539 is a powerful OBD2 code reader and electrical test tool combined. Read and clear diagnostic trouble codes, view live data stream, check I/M readiness status, and perform comprehensive vehicle system tests all in one portable device.

Features:
• Read and clear DTCs from all OBD2 systems
• Display I/M monitor and freeze frame data
• Retrieve vehicle information (VIN, CIN, CVN)
• Electrical system testing with multimeter function
• Test battery, alternator, and starter
• Color screen with intuitive menu navigation
• Free lifetime software updates`,
    inStock: true,
    specifications: [
      { label: 'Screen', value: '2.8" Color TFT' },
      { label: 'Protocol', value: 'OBD2 CAN, ISO, KWP, PWM, VPW' },
      { label: 'Functions', value: 'DTC Read/Clear, Live Data, Freeze Frame' },
      { label: 'Electrical Test', value: 'Yes - Multimeter Included' },
      { label: 'Updates', value: 'Free Lifetime via Internet' },
      { label: 'Warranty', value: '1 Year' },
    ],
    fitment: [
      { make: 'Universal', model: 'All OBD2 Vehicles', years: '1996-2024' },
    ],
    crossReference: ['AL539', 'INNOVA-3160g', 'ACTRON-CP9690'],
  },
  'p4': {
    id: 'p4',
    handle: 'p4',
    name: 'Hydraulic Floor Jack - 3 Ton',
    brand: 'Arcan',
    sku: 'ARC-XL3T',
    price: 139.99,
    category: 'Tools',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    ],
    description: 'Heavy-duty hydraulic floor jack with dual pump pistons. 6-inch to 20-inch lift range.',
    longDescription: `The Arcan XL3T Professional Floor Jack offers exceptional lifting power and speed in a durable steel construction. Dual parallel pump pistons provide fast lifting action with minimal handle strokes, while the reinforced lift arm ensures stability under heavy loads.

Features:
• 3-ton (6,000 lb) lifting capacity
• Dual pump pistons for fast lift
• Heavy-duty steel construction
• Bypass and overload valves for safety
• 360° swivel casters for maneuverability
• Rubber saddle pad protects vehicle frame
• Meets ASME PASE safety standards`,
    inStock: true,
    specifications: [
      { label: 'Capacity', value: '3 Ton (6,000 lbs)' },
      { label: 'Min Height', value: '5.9 inches' },
      { label: 'Max Height', value: '20.5 inches' },
      { label: 'Construction', value: 'Heavy-Gauge Steel' },
      { label: 'Safety', value: 'Bypass & Overload Valves' },
      { label: 'Warranty', value: '1 Year' },
    ],
    fitment: [],
    crossReference: ['XL3T', 'SUN-6603', 'OTC-5019'],
  },
  'p5': {
    id: 'p5',
    handle: 'p5',
    name: 'Brake Pad Set - Premium Ceramic',
    brand: 'Wagner',
    sku: 'WAG-ZD1363',
    price: 64.99,
    category: 'Parts',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      'https://images.unsplash.com/photo-1449130015084-2dc7c9e50a3a?w=800',
    ],
    description: 'Low-dust ceramic brake pads. Superior stopping power and long wear life.',
    longDescription: `Wagner ThermoQuiet Ceramic Brake Pads deliver ultra-quiet, ultra-clean braking performance. The advanced ceramic formulation provides superior stopping power while producing minimal brake dust. Includes premium stainless steel hardware and application-specific shims.

Features:
• Ceramic formula for quiet operation
• 95% less dust than semi-metallic pads
• Laser-shaped friction material for optimal performance
• Integrally molded insulator reduces noise
• Premium stainless steel hardware included
• Application-specific design for perfect fit`,
    inStock: true,
    specifications: [
      { label: 'Material', value: 'Premium Ceramic' },
      { label: 'Dust Level', value: 'Ultra Low (95% less)' },
      { label: 'Noise Level', value: 'Ultra Quiet' },
      { label: 'Hardware Included', value: 'Yes - Stainless Steel' },
      { label: 'Shims Included', value: 'Yes - Application Specific' },
      { label: 'Warranty', value: '3 Years / 36,000 Miles' },
    ],
    fitment: [
      { make: 'Honda', model: 'Accord', years: '2018-2023' },
      { make: 'Honda', model: 'CR-V', years: '2017-2023' },
      { make: 'Acura', model: 'TLX', years: '2015-2023' },
      { make: 'Toyota', model: 'Camry', years: '2018-2024' },
    ],
    crossReference: ['ZD1363', 'D1363-8677', 'AKEBONO-ACT1363'],
  },
  'p6': {
    id: 'p6',
    handle: 'p6',
    name: 'Mechanics Gloves - Nitrile Palm (12 Pack)',
    brand: 'Ironclad',
    sku: 'IRN-EXO2-MPG',
    price: 34.99,
    category: 'Safety Gear',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    ],
    description: 'Touch-screen compatible work gloves with nitrile-coated palms for excellent grip.',
    longDescription: `Ironclad EXO2 Motor Pro Gloves combine maximum dexterity with superior hand protection. The nitrile-dipped palms provide excellent grip in wet or oily conditions, while the touchscreen-compatible fingertips allow you to use mobile devices without removing gloves.

Features:
• Nitrile-dipped palms for superior grip
• Touchscreen compatible fingertips
• Form-fitting stretch fabric for comfort
• Machine washable
• Reinforced high-wear areas
• 12-pack for extended use`,
    inStock: true,
    specifications: [
      { label: 'Material', value: 'Synthetic Leather & Nylon' },
      { label: 'Palm Coating', value: 'Nitrile' },
      { label: 'Touchscreen', value: 'Yes - All Fingers' },
      { label: 'Washable', value: 'Yes - Machine Washable' },
      { label: 'Sizes Available', value: 'S, M, L, XL, XXL' },
      { label: 'Quantity', value: '12 Pairs' },
    ],
    fitment: [],
    crossReference: ['EXO2-MPG-12', 'MECH-GLV-12', 'PRO-GRIP-12'],
  },
  'p7': {
    id: 'p7',
    handle: 'p7',
    name: 'LED Work Light - 5000 Lumens',
    brand: 'Neiko',
    sku: 'NEI-40464A',
    price: 79.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    ],
    description: 'Ultra-bright LED work light with adjustable stand and magnetic base. 360° swivel head.',
    longDescription: `The Neiko Pro-Grade LED Work Light delivers professional-grade illumination with 5000 lumens of bright, shadow-free light. Perfect for automotive work, the adjustable stand and 360° rotating head allows you to direct light exactly where you need it.

Features:
• 5000 lumen super bright output
• COB LED technology for even illumination
• 360° rotating light head
• Adjustable telescoping stand (3-6 feet)
• Strong magnetic base for metal surfaces
• Dual hanging hooks for overhead mounting
• Durable aluminum housing
• 6-foot power cord with grounded plug`,
    inStock: true,
    specifications: [
      { label: 'Brightness', value: '5000 Lumens' },
      { label: 'LED Type', value: 'COB (Chip on Board)' },
      { label: 'Color Temperature', value: '6500K Daylight White' },
      { label: 'Stand Height', value: '3-6 feet adjustable' },
      { label: 'Power', value: 'AC 120V, 50W' },
      { label: 'Cord Length', value: '6 feet' },
    ],
    fitment: [],
    crossReference: ['40464A', 'NEBO-6755', 'STRIKER-00230'],
  },
  'p8': {
    id: 'p8',
    handle: 'p8',
    name: 'Air Filter Replacement Kit',
    brand: 'K&N',
    sku: 'KN-33-2129',
    price: 24.99,
    category: 'Parts',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    ],
    description: 'Universal fit air filter kit. High-flow design for improved engine performance.',
    longDescription: `K&N High-Flow Air Filters are designed to increase horsepower and acceleration while providing excellent filtration. The washable, reusable design eliminates the need for replacement filters and helps protect your engine for up to 50,000 miles before cleaning is required.

Features:
• Increased horsepower and torque
• Washable and reusable (lasts up to 10 years)
• High airflow with excellent filtration
• Oiled cotton gauze media
• Pleat design maximizes surface area
• 50,000-mile cleaning interval
• 10-Year/Million Mile Limited Warranty`,
    inStock: false,
    specifications: [
      { label: 'Filter Media', value: 'Oiled Cotton Gauze' },
      { label: 'Service Interval', value: '50,000 miles' },
      { label: 'Dimensions', value: '9.5" x 7.5" x 1.5"' },
      { label: 'Reusable', value: 'Yes - Washable' },
      { label: 'Warranty', value: '10 Years / 1 Million Miles' },
      { label: 'Performance Gain', value: 'Up to 4 HP' },
    ],
    fitment: [
      { make: 'Ford', model: 'Mustang', years: '2015-2023' },
      { make: 'Ford', model: 'F-150', years: '2015-2020' },
      { make: 'Lincoln', model: 'Navigator', years: '2018-2023' },
    ],
    crossReference: ['33-2129', 'FA1883', 'WIX-49129'],
  },
  'p9': {
    id: 'p9',
    handle: 'p9',
    name: 'Torque Wrench - Digital Display',
    brand: 'ACDelco',
    sku: 'ACD-ARM601-4',
    price: 129.99,
    category: 'Tools',
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
    images: [
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800',
    ],
    description: 'Precision digital torque wrench. 10-150 ft-lb range with audible alert and LED display.',
    longDescription: `The ACDelco Digital Torque Wrench features a large, easy-to-read LCD screen that displays torque values in four different units. The wrench provides both audible and visual alerts when the desired torque is reached, ensuring accurate fastener tightening every time.

Features:
• Digital LCD display (easy to read in any light)
• Four measurement units: ft-lb, in-lb, N-m, kg-cm
• Audible alert and LED light at target torque
• ±2% accuracy (CW), ±3% (CCW)
• Peak hold function
• Reversible ratchet head
• Calibration certificate included
• Comes with protective storage case`,
    inStock: true,
    specifications: [
      { label: 'Range', value: '10-150 ft-lbs' },
      { label: 'Accuracy', value: '±2% CW, ±3% CCW' },
      { label: 'Drive Size', value: '1/2 inch' },
      { label: 'Display', value: 'LCD Digital' },
      { label: 'Units', value: 'ft-lb, in-lb, N-m, kg-cm' },
      { label: 'Warranty', value: '1 Year' },
    ],
    fitment: [],
    crossReference: ['ARM601-4', 'CDI-2503MFRPH', 'TEKTON-24335'],
  },
  'p10': {
    id: 'p10',
    handle: 'p10',
    name: 'Coolant Flush & Fill Kit',
    brand: 'Prestone',
    sku: 'PRE-AF-KIT-6',
    price: 44.99,
    category: 'Fluids & Chemicals',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    ],
    description: 'Complete coolant system service kit with universal adapter fittings and hoses.',
    longDescription: `The Prestone Coolant System Flush & Fill Kit makes it easy to service any vehicle's cooling system. Includes everything needed for a complete flush: universal adapters, hoses, flush solution, and premium antifreeze. Works with all makes and models.

Features:
• Complete flush in under 30 minutes
• Universal adapter fittings (fits all vehicles)
• Includes flush cleaning solution
• 1 gallon Prestone Antifreeze/Coolant
• Heavy-duty reinforced hoses
• Detailed instruction manual included
• Compatible with all coolant types`,
    inStock: true,
    specifications: [
      { label: 'Kit Contents', value: 'Adapters, Hoses, Flush, Antifreeze' },
      { label: 'Antifreeze Volume', value: '1 Gallon (concentrate)' },
      { label: 'Flush Solution', value: '22 oz bottle' },
      { label: 'Hose Length', value: '6 feet' },
      { label: 'Compatibility', value: 'All vehicles, all coolant types' },
      { label: 'Service Time', value: '20-30 minutes' },
    ],
    fitment: [
      { make: 'Universal', model: 'All Vehicles', years: 'All Years' },
    ],
    crossReference: ['AF-KIT-6', 'PEAK-FLKIT', 'ZEREX-FLUSHKIT'],
  },
  'p11': {
    id: 'p11',
    handle: 'p11',
    name: 'Battery Load Tester',
    brand: 'Schumacher',
    sku: 'SCH-BT-100',
    price: 59.99,
    category: 'Diagnostic Equipment',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
    images: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
    ],
    description: 'Professional battery and alternator tester. Tests 6V and 12V batteries up to 1000 CCA.',
    longDescription: `The Schumacher BT-100 is a professional-grade battery load tester that quickly determines battery condition. Test 6V and 12V batteries, check alternator output, and diagnose starter motor draw with color-coded meter readings for instant results.

Features:
• Tests 6V and 12V batteries
• Load tests up to 1000 CCA
• Tests alternator charging output (10-16V)
• Checks starter motor cranking voltage
• Large 2-3/4" color-coded meter
• Heavy-duty 50-amp load coil
• Rubber-coated clamps for secure connection
• Top-mounted switch for easy operation`,
    inStock: true,
    specifications: [
      { label: 'Battery Types', value: '6V and 12V' },
      { label: 'CCA Range', value: 'Up to 1000 CCA' },
      { label: 'Alternator Test', value: '10-16 Volts' },
      { label: 'Load Coil', value: '50 Amp' },
      { label: 'Meter Size', value: '2-3/4 inch diameter' },
      { label: 'Cable Length', value: '4 feet' },
    ],
    fitment: [],
    crossReference: ['BT-100', 'OTC-3180', 'MILTON-S-921'],
  },
  'p12': {
    id: 'p12',
    handle: 'p12',
    name: 'Shop Towels - Heavy Duty (Box of 200)',
    brand: 'Scott',
    sku: 'SCT-75143',
    price: 29.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    ],
    description: 'Industrial-grade disposable shop towels. Oil and solvent resistant.',
    longDescription: `Scott Shop Towels are the professional's choice for heavy-duty cleaning. These absorbent, durable towels handle the toughest jobs in the shop. The innovative Absorbency Pockets soak up more water and oil faster, while the textured surface scrubs away grime.

Features:
• 30% more absorbent than leading brands
• Oil and solvent resistant
• Textured for scrubbing power
• Won't fall apart when wet
• Lint-free for critical cleaning tasks
• Hygienic pop-up box dispensing
• Blue color hides stains
• Large 10" x 12" size`,
    inStock: true,
    specifications: [
      { label: 'Quantity', value: '200 Towels per Box' },
      { label: 'Size', value: '10" x 12" per towel' },
      { label: 'Material', value: 'Reinforced Paper' },
      { label: 'Absorbency', value: '30% more than competitors' },
      { label: 'Resistance', value: 'Oil, Solvent, Water' },
      { label: 'Dispensing', value: 'Pop-up Box' },
    ],
    fitment: [],
    crossReference: ['75143', 'WYPALL-05776', 'TOOLBOX-Z400'],
  },
};
