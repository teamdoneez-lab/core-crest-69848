-- Fix infinite recursion in service_requests RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Pros can view requests for their service categories" ON public.service_requests;

-- Create security definer functions to break recursion
CREATE OR REPLACE FUNCTION public.user_is_verified_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pro_profiles
    WHERE pro_id = _user_id AND is_verified = true
  )
$$;

CREATE OR REPLACE FUNCTION public.pro_serves_category(_pro_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pro_service_categories
    WHERE pro_id = _pro_id AND category_id = _category_id
  )
$$;

-- Recreate the policy using security definer functions
CREATE POLICY "Pros can view requests for their service categories"
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  public.user_is_verified_pro(auth.uid()) 
  AND public.pro_serves_category(auth.uid(), category_id)
);