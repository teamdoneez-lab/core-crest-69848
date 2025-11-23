import { accordionsData } from '@/data/serviceslist-detailed';

/**
 * Convert service ID to human-readable service name
 * @param serviceId - Service ID in format "1-1-1", "1-2-1", etc.
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

/**
 * Get the parent category name for a service ID
 * @param serviceId - Service ID in format "1-1-1", "2-1-1", etc.
 * @returns Parent category name (e.g., "Auto Repair", "Auto Body")
 */
export const getParentCategoryName = (serviceId: string): string | null => {
  for (const category of accordionsData) {
    for (const subItem of category.subItems) {
      const service = subItem.services.find(s => s.id === serviceId);
      if (service) {
        // Return the title without the number prefix (e.g., "1. Auto Repair" -> "Auto Repair")
        return category.title.replace(/^\d+\.\s*/, '');
      }
    }
  }
  return null;
};

/**
 * Map service IDs to a category_id from service_categories table
 * @param serviceIds - Array of service IDs
 * @param categories - Array of category objects from service_categories table
 * @returns The first matching category_id or null
 */
export const mapServiceIdsToCategoryId = (
  serviceIds: string[],
  categories: Array<{ id: string; name: string }>
): string | null => {
  if (!categories || categories.length === 0 || !serviceIds || serviceIds.length === 0) {
    return null;
  }

  // Get parent category names for all selected services
  for (const serviceId of serviceIds) {
    const parentCategoryName = getParentCategoryName(serviceId);
    if (parentCategoryName) {
      // Try to find exact match in service_categories
      const matched = categories.find(
        c => c.name.toLowerCase() === parentCategoryName.toLowerCase()
      );
      if (matched) {
        return matched.id;
      }
    }
  }

  return null;
};

/**
 * Get subcategory name for a service ID
 * @param serviceId - Service ID in format "1-1-1", "1-2-1", etc.
 * @returns Subcategory name (e.g., "Brakes", "Electrical")
 */
export const getSubcategoryName = (serviceId: string): string | null => {
  for (const category of accordionsData) {
    for (const subItem of category.subItems) {
      const service = subItem.services.find(s => s.id === serviceId);
      if (service) {
        return subItem.title;
      }
    }
  }
  return null;
};
