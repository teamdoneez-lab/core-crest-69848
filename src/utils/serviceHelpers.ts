import { accordionsData } from '@/data/serviceslist-detailed';

/**
 * Convert service ID to human-readable service name
 * @param serviceId - Service ID in format "1-6-1"
 * @returns Human-readable service name or the original ID if not found
 */
export const getServiceNameById = (serviceId: string): string => {
  for (const category of accordionsData) {
    for (const subItem of category.subItems) {
      const service = subItem.services.find(s => s.id === serviceId);
      if (service) {
        return service.name;
      }
    }
  }
  return serviceId; // Return ID if not found
};

/**
 * Convert array of service IDs to human-readable names
 * @param serviceIds - Array of service IDs
 * @returns Array of human-readable service names
 */
export const getServiceNamesByIds = (serviceIds: string[]): string[] => {
  return serviceIds.map(id => getServiceNameById(id));
};
