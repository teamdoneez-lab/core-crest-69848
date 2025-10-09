-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Pros can view requests in their service areas and categories" ON public.service_requests;

-- Create new policy that allows pros to view all requests regardless of location
-- Only filter by service categories they offer
CREATE POLICY "Pros can view requests for their service categories"
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  -- Check if user has a pro profile
  EXISTS (
    SELECT 1 FROM pro_profiles pp
    WHERE pp.pro_id = auth.uid()
  )
  AND
  -- Check if pro offers this service category
  EXISTS (
    SELECT 1 FROM pro_service_categories psc
    WHERE psc.pro_id = auth.uid() 
    AND psc.category_id = service_requests.category_id
  )
);