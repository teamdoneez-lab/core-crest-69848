
-- Fix infinite recursion in service_requests RLS policies
-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Customers can view pros who quoted their requests" ON public.profiles;
DROP POLICY IF EXISTS "Customers can view pro_profiles of those who quoted their requests" ON public.pro_profiles;

-- Recreate the policies without infinite recursion
-- Allow customers to view profiles of pros who have submitted quotes to their service requests
CREATE POLICY "Customers can view profiles of pros who quoted their requests"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT q.pro_id
    FROM public.quotes q
    WHERE q.request_id IN (
      SELECT sr.id
      FROM public.service_requests sr
      WHERE sr.customer_id = auth.uid()
    )
  )
);

-- Allow customers to view pro_profiles of pros who have submitted quotes to their service requests
CREATE POLICY "Customers can view pro_profiles of pros who quoted their requests"
ON public.pro_profiles
FOR SELECT
USING (
  pro_id IN (
    SELECT DISTINCT q.pro_id
    FROM public.quotes q
    WHERE q.request_id IN (
      SELECT sr.id
      FROM public.service_requests sr
      WHERE sr.customer_id = auth.uid()
    )
  )
);
