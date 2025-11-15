// Three-level hierarchical category structure
export interface CategoryFilter {
  id: string;
  name: string;
  children?: CategoryFilter[];
}

export const MOCK_CATEGORIES: CategoryFilter[] = [
  {
    id: 'parts',
    name: 'Parts',
    children: [
      {
        id: 'brakes',
        name: 'Brakes',
        children: [
          { id: 'brake-pads', name: 'Brake Pads' },
          { id: 'brake-rotors', name: 'Brake Rotors' },
          { id: 'brake-calipers', name: 'Brake Calipers' },
          { id: 'brake-lines-hoses', name: 'Brake Lines & Hoses' },
          { id: 'brake-drums', name: 'Brake Drums' },
          { id: 'brake-shoes', name: 'Brake Shoes' },
          { id: 'master-cylinders', name: 'Master Cylinders' },
          { id: 'brake-hardware-kits', name: 'Brake Hardware Kits' },
          { id: 'abs-sensors', name: 'ABS Sensors' },
        ],
      },
      {
        id: 'suspension',
        name: 'Suspension',
        children: [
          { id: 'shocks-struts', name: 'Shocks & Struts' },
          { id: 'control-arms', name: 'Control Arms' },
          { id: 'ball-joints', name: 'Ball Joints' },
          { id: 'tie-rod-ends', name: 'Tie Rod Ends' },
          { id: 'bushings', name: 'Bushings' },
          { id: 'coil-leaf-springs', name: 'Coil Springs & Leaf Springs' },
          { id: 'sway-bars-end-links', name: 'Sway Bars & End Links' },
          { id: 'suspension-kits', name: 'Suspension Kits' },
        ],
      },
      {
        id: 'exhaust',
        name: 'Exhaust',
        children: [
          { id: 'mufflers', name: 'Mufflers' },
          { id: 'exhaust-pipes', name: 'Exhaust Pipes' },
          { id: 'catalytic-converters', name: 'Catalytic Converters' },
          { id: 'exhaust-manifolds', name: 'Exhaust Manifolds' },
          { id: 'exhaust-gaskets-clamps', name: 'Gaskets & Clamps' },
          { id: 'oxygen-sensors', name: 'Oxygen Sensors' },
        ],
      },
      {
        id: 'engine-cooling',
        name: 'Engine Cooling',
        children: [
          { id: 'radiators', name: 'Radiators' },
          { id: 'water-pumps', name: 'Water Pumps' },
          { id: 'thermostats', name: 'Thermostats' },
          { id: 'cooling-fans', name: 'Cooling Fans' },
          { id: 'cooling-hoses-belts', name: 'Hoses & Belts' },
          { id: 'reservoirs-caps', name: 'Reservoirs & Caps' },
        ],
      },
      {
        id: 'driveline-axles',
        name: 'Driveline & Axles',
        children: [
          { id: 'cv-axles', name: 'CV Axles' },
          { id: 'drive-shafts', name: 'Drive Shafts' },
          { id: 'differentials', name: 'Differentials' },
          { id: 'u-joints', name: 'U-Joints' },
          { id: 'bearings-seals', name: 'Bearings & Seals' },
        ],
      },
      {
        id: 'engine',
        name: 'Engine',
        children: [
          { id: 'cylinder-heads', name: 'Cylinder Heads' },
          { id: 'pistons-rings', name: 'Pistons & Rings' },
          { id: 'engine-gaskets-seals', name: 'Gaskets & Seals' },
          { id: 'timing-belts-chains', name: 'Timing Belts & Chains' },
          { id: 'valves-camshafts', name: 'Valves & Camshafts' },
          { id: 'oil-pumps', name: 'Oil Pumps' },
          { id: 'engine-mounts', name: 'Engine Mounts' },
        ],
      },
      {
        id: 'steering',
        name: 'Steering',
        children: [
          { id: 'steering-racks-gearboxes', name: 'Steering Racks & Gearboxes' },
          { id: 'power-steering-pumps', name: 'Power Steering Pumps' },
          { id: 'tie-rods-linkages', name: 'Tie Rods & Linkages' },
          { id: 'steering-columns', name: 'Steering Columns' },
          { id: 'steering-shafts', name: 'Steering Shafts' },
        ],
      },
      {
        id: 'fuel-delivery',
        name: 'Fuel Delivery',
        children: [
          { id: 'fuel-pumps', name: 'Fuel Pumps' },
          { id: 'fuel-injectors', name: 'Fuel Injectors' },
          { id: 'fuel-filters', name: 'Fuel Filters' },
          { id: 'fuel-lines-hoses', name: 'Fuel Lines & Hoses' },
          { id: 'fuel-tanks', name: 'Fuel Tanks' },
        ],
      },
      {
        id: 'air-intake',
        name: 'Air Intake',
        children: [
          { id: 'air-filters', name: 'Air Filters' },
          { id: 'intake-manifolds', name: 'Intake Manifolds' },
          { id: 'throttle-bodies', name: 'Throttle Bodies' },
          { id: 'intake-hoses', name: 'Intake Hoses' },
          { id: 'cold-air-intake-kits', name: 'Cold Air Intake Kits' },
        ],
      },
      {
        id: 'ac-heating',
        name: 'A/C & Heating',
        children: [
          { id: 'compressors', name: 'Compressors' },
          { id: 'condensers', name: 'Condensers' },
          { id: 'evaporators', name: 'Evaporators' },
          { id: 'heater-cores', name: 'Heater Cores' },
          { id: 'blower-motors', name: 'Blower Motors' },
          { id: 'ac-lines-o-rings', name: 'A/C Lines & O-Rings' },
        ],
      },
      {
        id: 'starting-charging',
        name: 'Starting & Charging',
        children: [
          { id: 'starters', name: 'Starters' },
          { id: 'alternators', name: 'Alternators' },
          { id: 'batteries', name: 'Batteries' },
          { id: 'voltage-regulators', name: 'Voltage Regulators' },
          { id: 'battery-cables', name: 'Battery Cables' },
        ],
      },
      {
        id: 'transmission',
        name: 'Transmission',
        children: [
          { id: 'automatic-manual-transmissions', name: 'Automatic & Manual Transmissions' },
          { id: 'clutches', name: 'Clutches' },
          { id: 'torque-converters', name: 'Torque Converters' },
          { id: 'transmission-mounts', name: 'Transmission Mounts' },
          { id: 'shift-cables-linkages', name: 'Shift Cables & Linkages' },
          { id: 'transmission-seals-gaskets', name: 'Seals & Gaskets' },
        ],
      },
      {
        id: 'ignition',
        name: 'Ignition',
        children: [
          { id: 'spark-plugs', name: 'Spark Plugs' },
          { id: 'ignition-coils', name: 'Ignition Coils' },
          { id: 'distributors', name: 'Distributors' },
          { id: 'ignition-wires', name: 'Ignition Wires' },
          { id: 'control-modules', name: 'Control Modules' },
        ],
      },
      {
        id: 'emission-control',
        name: 'Emission Control',
        children: [
          { id: 'egr-valves', name: 'EGR Valves' },
          { id: 'pcv-valves', name: 'PCV Valves' },
          { id: 'emission-catalytic-converters', name: 'Catalytic Converters' },
          { id: 'vapor-canisters', name: 'Vapor Canisters' },
          { id: 'emission-sensors', name: 'Sensors (O₂, MAP, etc.)' },
        ],
      },
      {
        id: 'electrical',
        name: 'Electrical',
        children: [
          { id: 'wiring-harnesses', name: 'Wiring Harnesses' },
          { id: 'relays-fuses', name: 'Relays & Fuses' },
          { id: 'switches-sensors', name: 'Switches & Sensors' },
          { id: 'lighting-components', name: 'Lighting Components' },
          { id: 'alternator-starter-cables', name: 'Alternator & Starter Cables' },
        ],
      },
    ],
  },
  {
    id: 'supplies',
    name: 'Supplies',
    children: [
      {
        id: 'oils-fluids',
        name: 'Oils & Fluids',
        children: [
          { id: 'engine-oil', name: 'Engine Oil' },
          { id: 'transmission-fluid', name: 'Transmission Fluid' },
          { id: 'coolant-antifreeze', name: 'Coolant/Antifreeze' },
          { id: 'brake-fluid', name: 'Brake Fluid' },
          { id: 'power-steering-fluid', name: 'Power Steering Fluid' },
          { id: 'differential-gear-oil', name: 'Differential & Gear Oil' },
        ],
      },
      {
        id: 'chemicals-lubricants',
        name: 'Chemicals & Lubricants',
        children: [
          { id: 'penetrating-oils', name: 'Penetrating Oils' },
          { id: 'grease-lubricants', name: 'Grease & Lubricants' },
          { id: 'threadlockers-sealants', name: 'Threadlockers & Sealants' },
          { id: 'cleaners-degreasers', name: 'Cleaners & Degreasers' },
        ],
      },
      {
        id: 'cleaning-supplies',
        name: 'Cleaning Supplies',
        children: [
          { id: 'degreasers', name: 'Degreasers' },
          { id: 'solvents', name: 'Solvents' },
          { id: 'wipes-rags', name: 'Wipes & Rags' },
          { id: 'spray-bottles', name: 'Spray Bottles' },
        ],
      },
      {
        id: 'detailing-supplies',
        name: 'Detailing Supplies',
        children: [
          { id: 'waxes-polishes', name: 'Waxes & Polishes' },
          { id: 'clay-bars', name: 'Clay Bars' },
          { id: 'interior-cleaners', name: 'Interior Cleaners' },
          { id: 'microfiber-towels', name: 'Microfiber Towels' },
          { id: 'applicators-brushes', name: 'Applicators & Brushes' },
        ],
      },
      {
        id: 'ppe-safety',
        name: 'PPE & Safety Equipment',
        children: [
          { id: 'gloves', name: 'Gloves' },
          { id: 'safety-glasses', name: 'Safety Glasses' },
          { id: 'ear-protection', name: 'Ear Protection' },
          { id: 'respirators-masks', name: 'Respirators & Masks' },
          { id: 'coveralls', name: 'Coveralls' },
        ],
      },
      {
        id: 'industrial-shop-supplies',
        name: 'Industrial & Shop Supplies',
        children: [
          { id: 'shop-towels', name: 'Shop Towels' },
          { id: 'absorbents', name: 'Absorbents' },
          { id: 'floor-mats', name: 'Floor Mats' },
          { id: 'storage-bins', name: 'Storage Bins' },
          { id: 'waste-oil-containers', name: 'Waste Oil Containers' },
        ],
      },
      {
        id: 'hand-tools-shop-tools',
        name: 'Hand Tools & Shop Tools',
        children: [
          { id: 'wrenches-sockets', name: 'Wrenches & Sockets' },
          { id: 'screwdrivers', name: 'Screwdrivers' },
          { id: 'pliers', name: 'Pliers' },
          { id: 'torque-wrenches', name: 'Torque Wrenches' },
          { id: 'specialty-automotive-tools', name: 'Specialty Automotive Tools' },
        ],
      },
      {
        id: 'equipment-lifts',
        name: 'Equipment & Lifts',
        children: [
          { id: 'floor-jacks', name: 'Floor Jacks' },
          { id: 'jack-stands', name: 'Jack Stands' },
          { id: 'vehicle-lifts', name: 'Vehicle Lifts' },
          { id: 'air-compressors', name: 'Air Compressors' },
          { id: 'workbenches', name: 'Workbenches' },
        ],
      },
      {
        id: 'electrical-lighting-supplies',
        name: 'Electrical & Lighting Supplies',
        children: [
          { id: 'wiring', name: 'Wiring' },
          { id: 'connectors', name: 'Connectors' },
          { id: 'fuses', name: 'Fuses' },
          { id: 'testers-multimeters', name: 'Testers & Multimeters' },
          { id: 'shop-lighting', name: 'Shop Lighting' },
        ],
      },
      {
        id: 'fasteners-hardware',
        name: 'Fasteners & Hardware',
        children: [
          { id: 'bolts-nuts-washers', name: 'Bolts, Nuts, & Washers' },
          { id: 'clamps', name: 'Clamps' },
          { id: 'rivets-clips', name: 'Rivets & Clips' },
          { id: 'threaded-rods', name: 'Threaded Rods' },
        ],
      },
      {
        id: 'filters-routine-maintenance',
        name: 'Filters & Routine Maintenance Items',
        children: [
          { id: 'oil-filters', name: 'Oil Filters' },
          { id: 'air-filters-maintenance', name: 'Air Filters' },
          { id: 'cabin-air-filters', name: 'Cabin Air Filters' },
          { id: 'fuel-filters-maintenance', name: 'Fuel Filters' },
          { id: 'wiper-blades', name: 'Wiper Blades' },
        ],
      },
      {
        id: 'hvac-ac-service-supplies',
        name: 'HVAC & A/C Service Supplies',
        children: [
          { id: 'refrigerant', name: 'Refrigerant' },
          { id: 'ac-oil', name: 'A/C Oil' },
          { id: 'leak-detectors', name: 'Leak Detectors' },
          { id: 'service-ports-fittings', name: 'Service Ports & Fittings' },
        ],
      },
      {
        id: 'tire-wheel-supplies',
        name: 'Tire & Wheel Supplies',
        children: [
          { id: 'tire-valves-cores', name: 'Tire Valves & Cores' },
          { id: 'wheel-weights', name: 'Wheel Weights' },
          { id: 'tire-repair-kits', name: 'Tire Repair Kits' },
          { id: 'mounting-paste', name: 'Mounting Paste' },
        ],
      },
      {
        id: 'service-bay-essentials',
        name: 'Service Bay Essentials',
        children: [
          { id: 'drain-pans', name: 'Drain Pans' },
          { id: 'funnels', name: 'Funnels' },
          { id: 'creepers-seats', name: 'Creepers & Seats' },
          { id: 'shop-organization-storage', name: 'Shop Organization & Storage' },
        ],
      },
    ],
  },
];

export const PART_TYPES = [
  { id: 'new', name: 'New Parts' },
  { id: 'remanufactured', name: 'Remanufactured' },
  { id: 'rebuilt', name: 'Rebuilt' },
  { id: 'used', name: 'Used Parts' },
];

/**
 * Flattens the hierarchical category structure into a simple array of category names
 * for use in dropdowns and simple selection UI
 */
export function getFlatCategoryList(): string[] {
  const flatList: string[] = [];
  
  function traverse(category: CategoryFilter) {
    // Add the category name
    flatList.push(category.name);
    
    // Recursively traverse children
    if (category.children) {
      category.children.forEach(child => traverse(child));
    }
  }
  
  // Traverse all top-level categories
  MOCK_CATEGORIES.forEach(category => traverse(category));
  
  return flatList;
}
