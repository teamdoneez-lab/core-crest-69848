/**
 * Service descriptions to help customers understand repair work
 * Maps service IDs to brief explanations
 */
export const serviceDescriptions: Record<string, string> = {
  // Brakes (1-1-x)
  '1-1-1': 'Complete inspection of brake system including pads, rotors, and fluid',
  '1-1-2': 'Replace worn brake pads to restore stopping power',
  '1-1-3': 'Replace damaged or warped brake rotors',
  '1-1-4': 'Remove old brake fluid and replace with fresh fluid',
  '1-1-5': 'Repair or replace brake calipers',
  '1-1-6': 'Replace faulty master cylinder',
  '1-1-7': 'Adjust brake components for optimal performance',

  // Electrical (1-2-x)
  '1-2-1': 'Diagnose and identify electrical system issues',
  '1-2-2': 'Replace ignition switch',
  '1-2-3': 'Replace ignition lock cylinder',
  '1-2-4': 'Install new battery',
  '1-2-5': 'Replace damaged battery cables',
  '1-2-6': 'Clean and service battery terminals',
  '1-2-7': 'Replace worn alternator belt',
  '1-2-8': 'Replace faulty alternator',
  '1-2-9': 'Replace starter motor',

  // Engine (1-3-x)
  '1-3-1': 'Replace engine oil and oil filter',
  '1-3-2': 'Replace timing belt to prevent engine damage',
  '1-3-3': 'Replace head gasket to fix leaks',
  '1-3-4': 'Replace spark plugs for better engine performance',
  '1-3-5': 'Replace faulty fuel injectors',
  '1-3-6': 'Replace crankshaft position sensor',
  '1-3-7': 'Replace valve cover gasket to stop oil leaks',
  '1-3-8': 'Replace fuel pump',
  '1-3-9': 'Complete engine rebuild or overhaul',
  '1-3-10': 'Replace damaged pistons',

  // Diagnostics (1-6-x)
  '1-6-1': 'Comprehensive vehicle inspection before purchase',
  '1-6-2': 'Diagnose the cause of check engine light',
  '1-6-3': 'Diagnose why vehicle won\'t start',
  '1-6-4': 'Diagnose no-start condition',
  '1-6-5': 'Emissions test for registration compliance',
  '1-6-6': 'Towing and roadside assistance services',

  // Maintenance (1-7-x)
  '1-7-1': 'Regular oil and filter change service',
  '1-7-2': 'Service and flush coolant system',
  '1-7-3': 'Replace brake fluid',
  '1-7-4': 'Service power steering fluid',
  '1-7-5': 'Replace transmission fluid',
  '1-7-6': 'Clean fuel system',
  '1-7-7': 'Replace engine air filter',
  '1-7-8': 'Replace cabin air filter for cleaner air',
  '1-7-9': 'Rotate tires for even wear',
  '1-7-10': 'Balance and align tires',

  // Heating & AC (1-5-x)
  '1-5-1': 'Replace AC compressor',
  '1-5-5': 'Replace coolant expansion tank',
  '1-5-7': 'Replace radiator',
  '1-5-11': 'Replace thermostat',
  '1-5-12': 'Replace water pump',
  '1-5-13': 'Drain and refill coolant',
};

/**
 * Get service description by ID
 * @param serviceId - Service ID in format "1-6-1"
 * @returns Service description or empty string if not found
 */
export const getServiceDescription = (serviceId: string): string => {
  return serviceDescriptions[serviceId] || '';
};
