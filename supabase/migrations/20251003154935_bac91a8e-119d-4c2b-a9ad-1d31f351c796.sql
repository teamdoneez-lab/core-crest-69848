-- Create trigger to automatically create referral fee when quote is selected
CREATE OR REPLACE FUNCTION public.create_referral_fee_on_quote_selection()
RETURNS TRIGGER AS $$
DECLARE
  quote_price NUMERIC;
  pro_user_id UUID;
  req_id UUID;
BEGIN
  -- Only proceed if status changed to pending_confirmation
  IF NEW.status = 'pending_confirmation' AND (OLD.status IS NULL OR OLD.status != 'pending_confirmation') THEN
    -- Get quote details
    quote_price := NEW.estimated_price;
    pro_user_id := NEW.pro_id;
    req_id := NEW.request_id;
    
    -- Create referral fee record (10% of quote price)
    INSERT INTO public.referral_fees (
      request_id,
      quote_id,
      pro_id,
      amount,
      status
    ) VALUES (
      req_id,
      NEW.id,
      pro_user_id,
      quote_price * 0.10,
      'owed'
    )
    ON CONFLICT (quote_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_referral_fee ON public.quotes;
CREATE TRIGGER trigger_create_referral_fee
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_fee_on_quote_selection();