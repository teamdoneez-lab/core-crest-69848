-- Fix security warning by setting search_path for accept_quote_with_timer function
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
    'expires_at', (NOW() + (timer_minutes || ' minutes')::INTERVAL)::text,
    'timer_minutes', timer_minutes
  );
  
  RETURN result;
END;
$function$;