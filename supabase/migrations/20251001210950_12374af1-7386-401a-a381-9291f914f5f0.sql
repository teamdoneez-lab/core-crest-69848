-- Update existing service requests to set category_id based on service_category array
-- This maps the service ID prefixes to the appropriate category_id

-- First, let's get the category IDs we'll use
DO $$
DECLARE
  auto_repair_id UUID;
  oil_change_id UUID;
  tire_service_id UUID;
  car_wash_id UUID;
  diagnostics_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO auto_repair_id FROM service_categories WHERE name = 'Auto Repair';
  SELECT id INTO oil_change_id FROM service_categories WHERE name = 'Oil Change';
  SELECT id INTO tire_service_id FROM service_categories WHERE name = 'Tire Service';
  SELECT id INTO car_wash_id FROM service_categories WHERE name = 'Car Wash';
  SELECT id INTO diagnostics_id FROM service_categories WHERE name = 'Diagnostics';
  
  -- Update service requests based on the first service in their service_category array
  -- Services starting with "1-" are Auto Repair
  UPDATE service_requests
  SET category_id = auto_repair_id
  WHERE category_id IS NULL 
    AND service_category IS NOT NULL 
    AND array_length(service_category, 1) > 0
    AND service_category[1] LIKE '1-%';
  
  -- Services starting with "2-" are Oil Change
  UPDATE service_requests
  SET category_id = oil_change_id
  WHERE category_id IS NULL 
    AND service_category IS NOT NULL 
    AND array_length(service_category, 1) > 0
    AND service_category[1] LIKE '2-%';
  
  -- Services starting with "3-" are Tire Service
  UPDATE service_requests
  SET category_id = tire_service_id
  WHERE category_id IS NULL 
    AND service_category IS NOT NULL 
    AND array_length(service_category, 1) > 0
    AND service_category[1] LIKE '3-%';
  
  -- Services starting with "4-" are Car Wash
  UPDATE service_requests
  SET category_id = car_wash_id
  WHERE category_id IS NULL 
    AND service_category IS NOT NULL 
    AND array_length(service_category, 1) > 0
    AND service_category[1] LIKE '4-%';
  
  -- Services starting with "5-" are Diagnostics
  UPDATE service_requests
  SET category_id = diagnostics_id
  WHERE category_id IS NULL 
    AND service_category IS NOT NULL 
    AND array_length(service_category, 1) > 0
    AND service_category[1] LIKE '5-%';
END $$;