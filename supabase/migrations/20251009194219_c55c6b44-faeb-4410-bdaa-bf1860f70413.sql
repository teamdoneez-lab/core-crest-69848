-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Pros can create quotes for service requests" ON quotes;

-- Create new policy that only checks service category, not zip code
CREATE POLICY "Pros can create quotes for service requests"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = pro_id 
  AND EXISTS (
    SELECT 1 
    FROM service_requests sr
    WHERE sr.id = quotes.request_id
    AND EXISTS (
      SELECT 1 
      FROM pro_service_categories psc
      WHERE psc.pro_id = auth.uid() 
      AND psc.category_id = sr.category_id
    )
  )
);