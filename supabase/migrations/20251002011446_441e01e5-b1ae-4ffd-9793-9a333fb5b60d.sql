-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  estimated_price DECIMAL NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Pros can create quotes for their leads"
  ON public.quotes FOR INSERT
  WITH CHECK (
    auth.uid() = pro_id 
    AND EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.request_id = quotes.request_id 
      AND leads.pro_id = auth.uid()
      AND leads.status = 'accepted'
    )
  );

CREATE POLICY "Pros can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = pro_id);

CREATE POLICY "Customers can view quotes for their requests"
  ON public.quotes FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM public.service_requests 
      WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update quote status to accepted"
  ON public.quotes FOR UPDATE
  USING (
    request_id IN (
      SELECT id FROM public.service_requests 
      WHERE customer_id = auth.uid()
    )
  )
  WITH CHECK (status IN ('accepted', 'declined'));

CREATE POLICY "Admins can view all quotes"
  ON public.quotes FOR SELECT
  USING (is_admin());

-- Add quote_id and refundable to referral_fees
ALTER TABLE public.referral_fees 
  ADD COLUMN quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  ADD COLUMN refundable BOOLEAN NOT NULL DEFAULT false;

-- Add status, final_price, and inspection_date to appointments
ALTER TABLE public.appointments 
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending_inspection',
  ADD COLUMN final_price DECIMAL,
  ADD COLUMN inspection_date TIMESTAMP WITH TIME ZONE;

-- Add trigger for quotes updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create referral fee when quote is accepted
CREATE OR REPLACE FUNCTION public.create_referral_fee_on_quote_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_percentage DECIMAL := 0.10; -- 10% referral fee
  referral_amount DECIMAL;
  request_category TEXT;
BEGIN
  -- Only proceed if status changed to accepted
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Calculate referral fee (10% of estimated price)
    referral_amount := NEW.estimated_price * referral_percentage;
    
    -- Check if this is a repair job (refundable)
    SELECT sc.name INTO request_category
    FROM service_requests sr
    JOIN service_categories sc ON sr.category_id = sc.id
    WHERE sr.id = NEW.request_id;
    
    -- Create referral fee entry
    INSERT INTO public.referral_fees (
      request_id,
      pro_id,
      quote_id,
      amount,
      status,
      refundable
    ) VALUES (
      NEW.request_id,
      NEW.pro_id,
      NEW.id,
      referral_amount,
      'owed',
      request_category LIKE '%Repair%' OR request_category LIKE '%Diagnostic%'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for creating referral fee on quote acceptance
CREATE TRIGGER create_referral_fee_trigger
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_fee_on_quote_accept();