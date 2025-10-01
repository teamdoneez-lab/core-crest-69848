-- Add RLS policies to allow admins to view and manage all data

-- Profiles: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Profiles: Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Service Requests: Allow admins to view all service requests
CREATE POLICY "Admins can view all service requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Service Requests: Allow admins to update all service requests
CREATE POLICY "Admins can update all service requests"
ON public.service_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Pro Profiles: Allow admins to view all pro profiles
CREATE POLICY "Admins can view all pro profiles"
ON public.pro_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Pro Profiles: Allow admins to update all pro profiles
CREATE POLICY "Admins can update all pro profiles"
ON public.pro_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);