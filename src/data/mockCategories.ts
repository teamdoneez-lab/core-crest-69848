// Three-level hierarchical category structure
export interface CategoryFilter {
  id: string;
  name: string;
  children?: CategoryFilter[];
}

export const MOCK_CATEGORIES: CategoryFilter[] = [
  {
    id: 'engine',
    name: 'Engine Components',
    children: [
      {
        id: 'engine-cooling',
        name: 'Cooling System',
        children: [
          { id: 'radiators', name: 'Radiators' },
          { id: 'water-pumps', name: 'Water Pumps' },
          { id: 'thermostats', name: 'Thermostats' },
          { id: 'coolant-hoses', name: 'Coolant Hoses' },
        ],
      },
      {
        id: 'engine-ignition',
        name: 'Ignition System',
        children: [
          { id: 'spark-plugs', name: 'Spark Plugs' },
          { id: 'ignition-coils', name: 'Ignition Coils' },
          { id: 'distributors', name: 'Distributors' },
        ],
      },
      {
        id: 'engine-fuel',
        name: 'Fuel System',
        children: [
          { id: 'fuel-pumps', name: 'Fuel Pumps' },
          { id: 'fuel-injectors', name: 'Fuel Injectors' },
          { id: 'fuel-filters', name: 'Fuel Filters' },
        ],
      },
    ],
  },
  {
    id: 'brakes',
    name: 'Brake System',
    children: [
      {
        id: 'brakes-disc',
        name: 'Disc Brakes',
        children: [
          { id: 'brake-pads', name: 'Brake Pads' },
          { id: 'brake-rotors', name: 'Brake Rotors' },
          { id: 'brake-calipers', name: 'Brake Calipers' },
        ],
      },
      {
        id: 'brakes-drum',
        name: 'Drum Brakes',
        children: [
          { id: 'brake-shoes', name: 'Brake Shoes' },
          { id: 'brake-drums', name: 'Brake Drums' },
          { id: 'wheel-cylinders', name: 'Wheel Cylinders' },
        ],
      },
      {
        id: 'brakes-hydraulic',
        name: 'Hydraulic Components',
        children: [
          { id: 'master-cylinders', name: 'Master Cylinders' },
          { id: 'brake-lines', name: 'Brake Lines' },
          { id: 'brake-fluid', name: 'Brake Fluid' },
        ],
      },
    ],
  },
  {
    id: 'suspension',
    name: 'Suspension & Steering',
    children: [
      {
        id: 'suspension-front',
        name: 'Front Suspension',
        children: [
          { id: 'struts', name: 'Struts' },
          { id: 'control-arms', name: 'Control Arms' },
          { id: 'ball-joints', name: 'Ball Joints' },
        ],
      },
      {
        id: 'suspension-rear',
        name: 'Rear Suspension',
        children: [
          { id: 'shocks', name: 'Shock Absorbers' },
          { id: 'leaf-springs', name: 'Leaf Springs' },
          { id: 'coil-springs', name: 'Coil Springs' },
        ],
      },
      {
        id: 'steering',
        name: 'Steering Components',
        children: [
          { id: 'tie-rods', name: 'Tie Rods' },
          { id: 'steering-racks', name: 'Steering Racks' },
          { id: 'power-steering-pumps', name: 'Power Steering Pumps' },
        ],
      },
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical System',
    children: [
      {
        id: 'electrical-starting',
        name: 'Starting & Charging',
        children: [
          { id: 'batteries', name: 'Batteries' },
          { id: 'starters', name: 'Starters' },
          { id: 'alternators', name: 'Alternators' },
        ],
      },
      {
        id: 'electrical-lighting',
        name: 'Lighting',
        children: [
          { id: 'headlights', name: 'Headlights' },
          { id: 'tail-lights', name: 'Tail Lights' },
          { id: 'fog-lights', name: 'Fog Lights' },
        ],
      },
    ],
  },
  {
    id: 'body',
    name: 'Body & Exterior',
    children: [
      {
        id: 'body-panels',
        name: 'Body Panels',
        children: [
          { id: 'doors', name: 'Doors' },
          { id: 'hoods', name: 'Hoods' },
          { id: 'fenders', name: 'Fenders' },
        ],
      },
      {
        id: 'body-glass',
        name: 'Glass',
        children: [
          { id: 'windshields', name: 'Windshields' },
          { id: 'side-windows', name: 'Side Windows' },
          { id: 'mirrors', name: 'Mirrors' },
        ],
      },
    ],
  },
];

export const PART_TYPES = [
  { id: 'new', name: 'New Parts' },
  { id: 'remanufactured', name: 'Remanufactured' },
  { id: 'used', name: 'Used Parts' },
];
