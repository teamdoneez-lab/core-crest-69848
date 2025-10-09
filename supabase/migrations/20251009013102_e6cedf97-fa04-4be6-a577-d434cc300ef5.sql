-- Allow pros to update their own quotes to declined status
CREATE POLICY "Pros can decline their own quotes"
ON public.quotes
FOR UPDATE
USING (auth.uid() = pro_id AND status = 'pending_confirmation')
WITH CHECK (auth.uid() = pro_id AND status = 'declined');