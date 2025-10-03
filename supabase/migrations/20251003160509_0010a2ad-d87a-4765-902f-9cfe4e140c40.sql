-- Fix the referral fee trigger to remove ON CONFLICT clause
-- since there's no unique constraint on referral_fees table

DROP TRIGGER IF EXISTS create_referral_fee_on_quote_selection ON public.quotes;
DROP TRIGGER IF EXISTS trigger_create_referral_fee ON public.quotes;
DROP FUNCTION IF EXISTS public.create_referral_fee_on_quote_selection() CASCADE;

CREATE OR REPLACE FUNCTION public.create_referral_fee_on_quote_selection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create referral fee when status changes to pending_confirmation
  IF NEW.status = 'pending_confirmation' AND (OLD.status IS NULL OR OLD.status != 'pending_confirmation') THEN
    -- Check if a referral fee already exists for this quote
    IF NOT EXISTS (
      SELECT 1 FROM public.referral_fees WHERE quote_id = NEW.id
    ) THEN
      -- Create referral fee record (10% of estimated price)
      INSERT INTO public.referral_fees (
        quote_id,
        pro_id,
        request_id,
        amount,
        status,
        created_at
      ) VALUES (
        NEW.id,
        NEW.pro_id,
        NEW.request_id,
        NEW.estimated_price * 0.10,
        'owed',
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_referral_fee_on_quote_selection
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_fee_on_quote_selection();