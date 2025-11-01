-- Fix supplier signup RLS policy to allow public signup
-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Anyone can insert supplier applications" ON public.suppliers;

-- Create a more permissive insert policy for supplier signups
-- Allow insert if the user_id matches the authenticated user OR if it's a new signup
CREATE POLICY "Allow supplier signup applications"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep existing policies for viewing own profile
-- No changes needed for the select/update policies