-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Pros can create quotes for their leads" ON public.quotes;

-- Create a new policy that allows pros to create quotes for service requests in their area and category
CREATE POLICY "Pros can create quotes for service requests" ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = pro_id
  AND EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.id = quotes.request_id
      AND EXISTS (
        SELECT 1 FROM public.pro_service_areas psa
        WHERE psa.pro_id = auth.uid() AND psa.zip = sr.zip
      )
      AND EXISTS (
        SELECT 1 FROM public.pro_service_categories psc
        WHERE psc.pro_id = auth.uid() AND psc.category_id = sr.category_id
      )
  )
);