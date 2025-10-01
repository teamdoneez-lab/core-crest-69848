-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Pros can view requests in their verified service areas and cate" ON service_requests;

-- Create a new policy that allows unverified pros to see requests (for testing)
-- In production, you may want to add back the is_verified check
CREATE POLICY "Pros can view requests in their service areas and categories"
ON service_requests
FOR SELECT
TO authenticated
USING (
  -- Check if user is a pro with a profile
  EXISTS (
    SELECT 1 FROM pro_profiles pp
    WHERE pp.pro_id = auth.uid()
  )
  AND
  -- Check if pro serves the request's ZIP code
  EXISTS (
    SELECT 1 FROM pro_service_areas psa
    WHERE psa.pro_id = auth.uid() 
      AND psa.zip = service_requests.zip
  )
  AND
  -- Check if pro offers the request's service category
  EXISTS (
    SELECT 1 FROM pro_service_categories psc
    WHERE psc.pro_id = auth.uid() 
      AND psc.category_id = service_requests.category_id
  )
);