-- Fix accept_quote_with_timer to handle existing referral fees
CREATE OR REPLACE FUNCTION accept_quote_with_timer(quote_id_input UUID)
RETURNS JSON AS $$
DECLARE
  quote_record RECORD;
  request_record RECORD;
  result JSON;
  existing_fee_id UUID;
BEGIN
  -- Get the quote details
  SELECT * INTO quote_record FROM quotes WHERE id = quote_id_input;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  -- Verify the quote belongs to a request owned by the current user
  SELECT * INTO request_record FROM service_requests 
  WHERE id = quote_record.request_id AND customer_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Check if there's already an accepted quote for this request
  IF EXISTS (
    SELECT 1 FROM quotes 
    WHERE request_id = quote_record.request_id 
    AND status IN ('pending_confirmation', 'confirmed')
    AND id != quote_id_input
  ) THEN
    RAISE EXCEPTION 'Another quote has already been accepted for this request';
  END IF;
  
  -- Update the selected quote to pending_confirmation with 60 minute timer
  UPDATE quotes
  SET 
    status = 'pending_confirmation',
    confirmation_timer_expires_at = NOW() + INTERVAL '60 minutes',
    confirmation_timer_minutes = 60,
    updated_at = NOW()
  WHERE id = quote_id_input;
  
  -- Decline all other quotes for this request
  UPDATE quotes
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = quote_record.request_id 
  AND id != quote_id_input
  AND status = 'pending';
  
  -- Check if referral fee already exists for this request
  SELECT id INTO existing_fee_id 
  FROM referral_fees 
  WHERE request_id = quote_record.request_id;
  
  IF existing_fee_id IS NOT NULL THEN
    -- Update existing referral fee
    UPDATE referral_fees
    SET 
      quote_id = quote_id_input,
      pro_id = quote_record.pro_id,
      amount = quote_record.estimated_price * 0.10,
      status = 'owed',
      updated_at = NOW()
    WHERE id = existing_fee_id;
  ELSE
    -- Create new referral fee record
    INSERT INTO referral_fees (
      quote_id,
      pro_id,
      request_id,
      amount,
      status
    ) VALUES (
      quote_id_input,
      quote_record.pro_id,
      quote_record.request_id,
      quote_record.estimated_price * 0.10,
      'owed'
    );
  END IF;
  
  -- Return success with timer info
  result := json_build_object(
    'success', true,
    'expires_at', (NOW() + INTERVAL '60 minutes')::text,
    'timer_minutes', 60
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;