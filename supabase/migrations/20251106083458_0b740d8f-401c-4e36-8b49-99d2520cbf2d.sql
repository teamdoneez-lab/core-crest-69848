-- Drop the problematic RLS policy
DROP POLICY IF EXISTS "Users can update their own profile (excluding role)" ON public.profiles;

-- Create a security definer function to get user's current role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can update their own profile (excluding role)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = public.get_user_role(auth.uid())
);