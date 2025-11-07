-- Drop the restrictive policy and keep the simple one
DROP POLICY IF EXISTS "Customers can create reviews for their appointments" ON public.pro_reviews;
DROP POLICY IF EXISTS "Customers can create their own reviews" ON public.pro_reviews;

-- Create a simple policy that allows customers to create reviews
CREATE POLICY "Customers can insert their reviews"
ON public.pro_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);