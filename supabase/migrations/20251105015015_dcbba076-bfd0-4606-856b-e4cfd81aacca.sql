-- Allow customers to view profiles of professionals who have submitted quotes to their service requests
CREATE POLICY "Customers can view profiles of pros who quoted them"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT q.pro_id
    FROM public.quotes q
    INNER JOIN public.service_requests sr ON sr.id = q.request_id
    WHERE sr.customer_id = auth.uid()
  )
);

-- Allow customers to view pro_profiles of professionals who have submitted quotes to their service requests
CREATE POLICY "Customers can view pro profiles who quoted them"
ON public.pro_profiles
FOR SELECT
USING (
  pro_id IN (
    SELECT DISTINCT q.pro_id
    FROM public.quotes q
    INNER JOIN public.service_requests sr ON sr.id = q.request_id
    WHERE sr.customer_id = auth.uid()
  )
);