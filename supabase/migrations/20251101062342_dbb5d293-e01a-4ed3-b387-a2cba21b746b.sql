-- Fix supplier signup RLS to allow both anon and authenticated users during signup
DROP POLICY IF EXISTS "Allow supplier signup applications" ON public.suppliers;

-- Allow supplier signup for both anon (during signup) and authenticated users
CREATE POLICY "Allow supplier signup applications"
ON public.suppliers
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id = auth.uid());

-- This allows the insert to happen right after signup when the user_id matches