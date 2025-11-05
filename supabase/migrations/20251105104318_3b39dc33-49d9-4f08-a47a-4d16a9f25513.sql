
-- Fix infinite recursion by using security definer functions
-- Drop the problematic policies again
DROP POLICY IF EXISTS "Customers can view profiles of pros who quoted their requests" ON public.profiles;
DROP POLICY IF EXISTS "Customers can view pro_profiles of pros who quoted their requests" ON public.pro_profiles;

-- Create security definer function to check if pro quoted customer's request
CREATE OR REPLACE FUNCTION public.pro_quoted_customer_request(_pro_id uuid, _customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quotes q
    INNER JOIN public.service_requests sr ON q.request_id = sr.id
    WHERE q.pro_id = _pro_id
      AND sr.customer_id = _customer_id
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Customers can view profiles of pros who quoted their requests"
ON public.profiles
FOR SELECT
USING (
  public.pro_quoted_customer_request(id, auth.uid())
);

CREATE POLICY "Customers can view pro_profiles of pros who quoted their requests"
ON public.pro_profiles
FOR SELECT
USING (
  public.pro_quoted_customer_request(pro_id, auth.uid())
);
