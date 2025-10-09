-- Insert all active service categories for the existing pro user
INSERT INTO pro_service_categories (pro_id, category_id)
SELECT 
  'd67656a7-b0ec-4a50-89b4-741c76cea0db'::uuid,
  id
FROM service_categories
WHERE active = true
ON CONFLICT DO NOTHING;