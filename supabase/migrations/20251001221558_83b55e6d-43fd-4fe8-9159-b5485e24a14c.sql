-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can update all service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can view all pro profiles" ON public.pro_profiles;
DROP POLICY IF EXISTS "Admins can update all pro profiles" ON public.pro_profiles;
DROP POLICY IF EXISTS "Admins can view all fees" ON public.fees;
DROP POLICY IF EXISTS "Admins can update fees" ON public.fees;

-- Create a security definer function to check if user is admin
-- This prevents infinite recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'::user_role
  )
$$;

-- Profiles: Allow admins to view all profiles using the security definer function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Profiles: Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Service Requests: Allow admins to view all service requests
CREATE POLICY "Admins can view all service requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Service Requests: Allow admins to update all service requests
CREATE POLICY "Admins can update all service requests"
ON public.service_requests
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Pro Profiles: Allow admins to view all pro profiles
CREATE POLICY "Admins can view all pro profiles"
ON public.pro_profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Pro Profiles: Allow admins to update all pro profiles
CREATE POLICY "Admins can update all pro profiles"
ON public.pro_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Fees: Allow admins to view all fees
CREATE POLICY "Admins can view all fees"
ON public.fees
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Fees: Allow admins to update fees
CREATE POLICY "Admins can update fees"
ON public.fees
FOR UPDATE
TO authenticated
USING (public.is_admin());