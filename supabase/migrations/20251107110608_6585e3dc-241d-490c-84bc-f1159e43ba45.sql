-- Fix RLS policy for pro_reviews table to allow customer inserts
DROP POLICY IF EXISTS "Customers can create their own reviews" ON public.pro_reviews;

CREATE POLICY "Customers can create their own reviews"
ON public.pro_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);