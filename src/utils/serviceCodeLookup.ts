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
