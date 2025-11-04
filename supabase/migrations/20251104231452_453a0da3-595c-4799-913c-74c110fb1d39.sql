-- Add service categories for the Pro account
INSERT INTO public.pro_service_categories (pro_id, category_id)
VALUES 
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', '798c7b86-db15-4d6b-8279-f3ecd90ad351'), -- Auto Repair
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', '9539bed5-b39f-424c-9d03-bdbe39c7e2a1'), -- Oil Change
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', 'b5b05137-7a27-450c-ae2b-2c0817699968'), -- Tire Service
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', 'bb7bd4a2-7684-45be-a904-b96c19da348a'), -- Diagnostics
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', '46aafb2b-29b6-4820-b092-3375753e7156')  -- Car Wash
ON CONFLICT (pro_id, category_id) DO NOTHING;

-- Add service areas (zip codes where service requests exist)
INSERT INTO public.pro_service_areas (pro_id, zip)
VALUES 
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', '12345'),
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', '234'),
  ('953aed5d-7d1c-43e4-9f4c-46f26581e766', '98101')
ON CONFLICT (pro_id, zip) DO NOTHING;