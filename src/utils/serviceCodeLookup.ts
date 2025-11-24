import { accordionsData } from '@/data/serviceslist-detailed';

// Create a flat map of service code to service name
const serviceCodeMap = new Map<string, string>();

// Build the lookup map from the accordions data
accordionsData.forEach((category) => {
  category.subItems.forEach((subItem) => {
    subItem.services.forEach((service) => {
      serviceCodeMap.set(service.id, service.name);
    });
  });
});

// Add guided selection service codes (rep-XXX format)
const guidedServiceCodes = new Map<string, string>([
  // Engine
  ['rep-001', 'Engine Diagnostics'],
  ['rep-002', 'Engine Tune-Up / Repair'],
  ['rep-003', 'Timing Belt / Chain Replacement'],
  ['rep-004', 'Oil Leaks / Gasket Repair'],
  ['rep-005', 'Cooling System Repair (Radiator, Water Pump, Hoses)'],
  ['rep-006', 'Fuel System Repairs (Injectors, Fuel Pump, Filters)'],
  // Brakes
  ['rep-101', 'Brake Pad / Shoe Replacement'],
  ['rep-102', 'Brake Rotor / Drum Replacement'],
  ['rep-103', 'Brake Fluid Flush'],
  ['rep-104', 'Brake Lines & Hoses Repair'],
  ['rep-105', 'ABS System Repair'],
  // Electrical
  ['rep-201', 'Battery Replacement & Testing'],
  ['rep-202', 'Starter / Alternator Repair'],
  ['rep-203', 'Wiring & Fuses Repair'],
  ['rep-204', 'Lighting Repair (Headlights, Taillights, Interior)'],
  ['rep-205', 'Sensor Diagnostics'],
  // HVAC
  ['rep-301', 'AC Recharge / Repair'],
  ['rep-302', 'Heater Core Replacement'],
  ['rep-303', 'Climate Control Diagnostics'],
  ['rep-304', 'Cabin Airflow / Blower Motor Repair'],
  // Steering & Suspension
  ['rep-401', 'Shock & Strut Replacement'],
  ['rep-402', 'Steering Rack / Power Steering Repair'],
  ['rep-403', 'Ball Joints / Tie Rods Replacement'],
  ['rep-404', 'Wheel Alignment & Suspension Diagnostics'],
  // Transmission
  ['rep-501', 'Transmission Repair / Replacement'],
  ['rep-502', 'Clutch Replacement (Manual)'],
  ['rep-503', 'Drive Shaft / Axle Repair'],
  ['rep-504', 'Differential / Transfer Case Service'],
  // Exhaust
  ['rep-601', 'Muffler / Exhaust Pipe Repair'],
  ['rep-602', 'Catalytic Converter Replacement'],
  ['rep-603', 'Oxygen Sensor Replacement'],
  ['rep-604', 'Emissions Diagnostics / Repairs'],
  // EV & Hybrid
  ['rep-701', 'Battery Pack Diagnostics & Repair'],
  ['rep-702', 'Electric Motor Service'],
  ['rep-703', 'Regenerative Braking System Repair'],
  ['rep-704', 'Charging System Repair'],
]);

// Merge guided codes into the main map
guidedServiceCodes.forEach((name, code) => {
  serviceCodeMap.set(code, name);
});

/**
 * Get service name(s) from service code(s)
 * @param codes - Single code string or array of codes
 * @returns Human-readable service name(s)
 */
export function getServiceNames(codes: string | string[] | undefined | null): string {
  if (!codes) return '';
  
  const codeArray = Array.isArray(codes) ? codes : [codes];
  
  const names = codeArray
    .map(code => serviceCodeMap.get(code))
    .filter(Boolean);
  
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  
  // For multiple services, join with " + "
  return names.join(' + ');
}

/**
 * Get a single service name from a code
 * @param code - Service code
 * @returns Service name or empty string if not found
 */
export function getServiceName(code: string | undefined | null): string {
  if (!code) return '';
  return serviceCodeMap.get(code) || '';
}
