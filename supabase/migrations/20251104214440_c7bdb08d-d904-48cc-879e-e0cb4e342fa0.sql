-- Update the accept_quote_with_timer function to use tiered referral fee calculation
CREATE OR REPLACE FUNCTION public.accept_quote_with_timer(quote_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  quote_record RECORD;
  request_record RECORD;
  result JSON;
  existing_fee_id UUID;
  timer_minutes INTEGER;
  calculated_fee NUMERIC;
BEGIN
  -- Get the quote details
  SELECT * INTO quote_record FROM quotes WHERE id = quote_id_input;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  -- Get the service request with urgency
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
  
  -- Get timer based on urgency
  timer_minutes := get_confirmation_timer_minutes(request_record.urgency);
  
  -- Calculate tiered referral fee
  IF quote_record.estimated_price < 1000 THEN
    calculated_fee := GREATEST(5.00, quote_record.estimated_price * 0.05);
  ELSIF quote_record.estimated_price < 5000 THEN
    calculated_fee := quote_record.estimated_price * 0.03;
  ELSIF quote_record.estimated_price < 10000 THEN
    calculated_fee := quote_record.estimated_price * 0.02;
  ELSE
    calculated_fee := quote_record.estimated_price * 0.01;
  END IF;
  
  -- Round to 2 decimal places
  calculated_fee := ROUND(calculated_fee, 2);
  
  -- Update the selected quote to pending_confirmation with dynamic timer
  UPDATE quotes
  SET 
    status = 'pending_confirmation',
    confirmation_timer_expires_at = NOW() + (timer_minutes || ' minutes')::INTERVAL,
    confirmation_timer_minutes = timer_minutes,
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
    -- Update existing referral fee with new calculated amount
    UPDATE referral_fees
    SET 
      quote_id = quote_id_input,
      pro_id = quote_record.pro_id,
      amount = calculated_fee,
      status = 'owed',
      updated_at = NOW()
    WHERE id = existing_fee_id;
  ELSE
    -- Create new referral fee record with calculated amount
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
      calculated_fee,
      'owed'
    );
  END IF;
  
  -- Return success with timer info and fee amount
  result := json_build_object(
    'success', true,
    'expires_at', (NOW() + (timer_minutes || ' minutes')::INTERVAL)::text,
    'timer_minutes', timer_minutes,
    'referral_fee', calculated_fee
  );
  
  RETURN result;
END;
$function$;