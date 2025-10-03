-- Allow customers to view referral fees for their own service requests
CREATE POLICY "Customers can view fees for their requests"
ON public.referral_fees
FOR SELECT
TO authenticated
USING (
  request_id IN (
    SELECT id FROM public.service_requests
    WHERE customer_id = auth.uid()
  )
);