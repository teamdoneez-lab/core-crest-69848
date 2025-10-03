-- Fix the trigger to handle existing referral fees
CREATE OR REPLACE FUNCTION public.create_referral_fee_on_quote_selection()
RETURNS TRIGGER AS $$
DECLARE
  existing_fee_id UUID;
BEGIN
  -- Only process when status changes to pending_confirmation
  IF NEW.status = 'pending_confirmation' AND (OLD.status IS NULL OR OLD.status != 'pending_confirmation') THEN
    -- Check if a referral fee already exists for this request
    SELECT id INTO existing_fee_id 
    FROM public.referral_fees 
    WHERE request_id = NEW.request_id;
    
    IF existing_fee_id IS NOT NULL THEN
      -- Update existing referral fee
      UPDATE public.referral_fees
      SET 
        quote_id = NEW.id,
        pro_id = NEW.pro_id,
        amount = NEW.estimated_price * 0.10,
        status = 'owed',
        updated_at = NOW()
      WHERE id = existing_fee_id;
    ELSE
      -- Create new referral fee record (10% of estimated price)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';