-- Fix security vulnerability: Restrict pro access to service requests based on their actual service areas and categories

-- Drop the current overly permissive policy
DROP POLICY "Pros can view requests in their areas" ON public.service_requests;

-- Create a new restrictive policy that only allows pros to see requests in their actual service areas and categories
CREATE POLICY "Pros can view requests in their verified service areas and categories"
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  -- Only verified pros can see requests
  EXISTS (
    SELECT 1 
    FROM public.pro_profiles pp
    WHERE pp.pro_id = auth.uid() 
      AND pp.is_verified = true
  )
  AND
  -- Pro must serve the zip code of the request
  EXISTS (
    SELECT 1
    FROM public.pro_service_areas psa
    WHERE psa.pro_id = auth.uid()
      AND psa.zip = service_requests.zip
  )
  AND
  -- Pro must offer the service category requested
  EXISTS (
    SELECT 1
    FROM public.pro_service_categories psc
    WHERE psc.pro_id = auth.uid()
      AND psc.category_id = service_requests.category_id
  )
);