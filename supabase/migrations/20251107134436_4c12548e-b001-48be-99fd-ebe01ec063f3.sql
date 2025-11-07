-- Allow viewing profiles of customers who reviewed verified pros
CREATE POLICY "Anyone can view profiles of reviewers for verified pros"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT customer_id
    FROM pro_reviews
    WHERE pro_id IN (
      SELECT pro_id
      FROM pro_profiles
      WHERE is_verified = true
    )
  )
);