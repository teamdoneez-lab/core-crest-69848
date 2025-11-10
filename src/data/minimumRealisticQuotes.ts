// Minimum Realistic Quote (MRQ) values by service type
// These represent the typical minimum cost for each service category

export interface MinimumRealisticQuote {
  serviceId: string;
  serviceName: string;
  mrq: number; // Minimum realistic quote in dollars
}

export const minimumRealisticQuotes: MinimumRealisticQuote[] = [
  // Auto Repair - Brakes
  { serviceId: '1-1-1', serviceName: 'Brake Safety Inspection', mrq: 50 },
  { serviceId: '1-1-2', serviceName: 'Brake Pad Replacement', mrq: 150 },
  { serviceId: '1-1-3', serviceName: 'Brake Rotor Replacement', mrq: 300 },
  { serviceId: '1-1-4', serviceName: 'Brake Fluid Flush', mrq: 100 },
  { serviceId: '1-1-5', serviceName: 'Brake Caliper Repair', mrq: 400 },
  { serviceId: '1-1-6', serviceName: 'Brake Master Cylinder Replacement', mrq: 350 },
  { serviceId: '1-1-7', serviceName: 'Brake Adjustment', mrq: 75 },

  // Auto Repair - Electrical
  { serviceId: '1-2-1', serviceName: 'Wiring and Electrical System Diagnosis', mrq: 100 },
  { serviceId: '1-2-2', serviceName: 'Ignition Switch Replacement', mrq: 200 },
  { serviceId: '1-2-4', serviceName: 'Battery Replacement', mrq: 150 },
  { serviceId: '1-2-7', serviceName: 'Alternator Belt Replacement', mrq: 100 },
  { serviceId: '1-2-8', serviceName: 'Alternator Replacement', mrq: 400 },
  { serviceId: '1-2-9', serviceName: 'Starter Replacement', mrq: 350 },

  // Auto Repair - Engine
  { serviceId: '1-3-1', serviceName: 'Engine Oil and Filter Change', mrq: 50 },
  { serviceId: '1-3-2', serviceName: 'Timing Belt Replacement', mrq: 600 },
  { serviceId: '1-3-3', serviceName: 'Cylinder Head Gasket Replacement', mrq: 1200 },
  { serviceId: '1-3-4', serviceName: 'Spark Plug Replacement', mrq: 150 },
  { serviceId: '1-3-5', serviceName: 'Fuel Injector Replacement', mrq: 400 },
  { serviceId: '1-3-8', serviceName: 'Fuel Pump Replacement', mrq: 500 },
  { serviceId: '1-3-9', serviceName: 'Engine Overhaul/Rebuild', mrq: 3500 },
  { serviceId: '1-3-18', serviceName: 'Turbocharger Replacement', mrq: 1500 },

  // Auto Repair - Transmission
  { serviceId: '1-9-1', serviceName: 'Transmission Fluid Change', mrq: 150 },
  { serviceId: '1-9-3', serviceName: 'Transmission Repair', mrq: 1500 },
  { serviceId: '1-9-4', serviceName: 'Transmission Rebuild', mrq: 2500 },
  { serviceId: '1-9-6', serviceName: 'Clutch Replacement (Manual Transmission)', mrq: 800 },

  // Auto Body - Dent Repair
  { serviceId: '2-1-1', serviceName: 'Dent Repair', mrq: 150 },
  { serviceId: '2-1-2', serviceName: 'Paintless Dent Repair (PDR)', mrq: 100 },
  { serviceId: '2-1-4', serviceName: 'Hail Damage Repair', mrq: 500 },

  // Auto Body - Collision Repair
  { serviceId: '2-2-1', serviceName: 'Full Collision Repair', mrq: 2000 },
  { serviceId: '2-2-3', serviceName: 'Frame Straightening', mrq: 1200 },
  { serviceId: '2-2-4', serviceName: 'Airbag Replacement', mrq: 800 },

  // Auto Body - Paint & Refinishing
  { serviceId: '2-3-1', serviceName: 'Full Vehicle Paint Job', mrq: 3000 },
  { serviceId: '2-3-2', serviceName: 'Panel Repainting', mrq: 400 },
  { serviceId: '2-3-5', serviceName: 'Bumper Repainting', mrq: 300 },

  // Auto Detailing
  { serviceId: '3-1-1', serviceName: 'Exterior Wash and Wax', mrq: 50 },
  { serviceId: '3-1-2', serviceName: 'Interior Detailing', mrq: 100 },
  { serviceId: '3-1-3', serviceName: 'Full Detailing (Interior and Exterior)', mrq: 200 },
  { serviceId: '3-1-5', serviceName: 'Engine Bay Cleaning', mrq: 75 },
  { serviceId: '3-1-8', serviceName: 'Ceramic Coating Application', mrq: 800 },
];

// Get MRQ for a specific service ID
export function getMRQForService(serviceId: string): number | null {
  const service = minimumRealisticQuotes.find(s => s.serviceId === serviceId);
  return service ? service.mrq : null;
}

// Get MRQ for multiple service IDs (returns the highest MRQ)
export function getMRQForServices(serviceIds: string[]): number | null {
  const mrqs = serviceIds
    .map(id => getMRQForService(id))
    .filter((mrq): mrq is number => mrq !== null);
  
  return mrqs.length > 0 ? Math.max(...mrqs) : null;
}

// Check if a quote is unrealistically low (< 50% of MRQ)
export function isQuoteUnrealisticallyLow(quoteAmount: number, serviceIds: string[]): boolean {
  const mrq = getMRQForServices(serviceIds);
  if (!mrq) return false; // No MRQ data available
  
  const threshold = mrq * 0.5; // 50% of MRQ
  return quoteAmount < threshold;
}
