-- Phase 4: Anti-Bypass Cancellation Rules
-- Update cancel_appointment_with_validation function to enforce strict cancellation rules

CREATE OR REPLACE FUNCTION public.cancel_appointment_with_validation(appointment_id_input uuid, cancellation_reason_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  appointment_record appointments%ROWTYPE;
  quote_record quotes%ROWTYPE;
  request_record service_requests%ROWTYPE;
  is_customer BOOLEAN;
  is_pro BOOLEAN;
  revised_quote_declined BOOLEAN;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record FROM public.appointments WHERE id = appointment_id_input;
  SELECT * INTO quote_record FROM public.quotes WHERE request_id = appointment_record.request_id AND status = 'confirmed';
  SELECT * INTO request_record FROM public.service_requests WHERE id = appointment_record.request_id;
  
  -- Check if user is customer or pro
  is_customer := (request_record.customer_id = auth.uid());
  is_pro := (appointment_record.pro_id = auth.uid());
  
  -- Check if a revised quote was submitted AND declined by customer
  SELECT EXISTS(
    SELECT 1 FROM public.quotes 
    WHERE request_id = appointment_record.request_id 
      AND is_revised = true
      AND status = 'declined'
  ) INTO revised_quote_declined;
  
  -- PHASE 4: Anti-bypass logic - Prevent cancellation of confirmed jobs without declined revised quote
  IF appointment_record.status = 'confirmed' THEN
    -- Customer cannot cancel unless they declined a revised quote
    IF is_customer AND cancellation_reason_input = 'cancelled_by_customer' AND NOT revised_quote_declined THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Cancellations are only allowed if the mechanic has submitted a revised quote that you declined.'
      );
    END IF;
    
    -- Pro cannot cancel a confirmed job (except via revised quote flow)
    IF is_pro AND cancellation_reason_input NOT IN ('cancelled_after_requote', 'no_show') THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Cannot cancel confirmed appointments. Please submit a revised quote if work scope changed.'
      );
    END IF;
  END IF;
  
  -- Allow cancellation during pending_inspection phase
  IF appointment_record.status = 'pending_inspection' THEN
    IF cancellation_reason_input IN ('cancelled_by_customer', 'cancelled_after_requote') THEN
      -- Refund during inspection phase
      UPDATE public.referral_fees
      SET 
        status = 'refunded',
        cancellation_reason = cancellation_reason_input,
        updated_at = NOW()
      WHERE request_id = appointment_record.request_id
        AND status = 'paid';
    END IF;
  END IF;
  
  -- Update appointment status
  UPDATE public.appointments
  SET status = cancellation_reason_input, updated_at = NOW()
  WHERE id = appointment_id_input;
  
  -- Handle refunds and violations based on cancellation reason
  IF cancellation_reason_input = 'cancelled_after_requote' THEN
    -- Legitimate cancellation: customer declined revised quote, refund mechanic's fee
    UPDATE public.referral_fees
    SET 
      status = 'refunded',
      cancellation_reason = cancellation_reason_input,
      updated_at = NOW()
    WHERE request_id = appointment_record.request_id
      AND status = 'paid';
      
  ELSIF cancellation_reason_input = 'no_show' THEN
    -- Customer no-show: refund mechanic's fee
    UPDATE public.referral_fees
    SET 
      status = 'refunded',
      cancellation_reason = cancellation_reason_input,
      updated_at = NOW()
    WHERE request_id = appointment_record.request_id
      AND status = 'paid';
      
  ELSIF cancellation_reason_input = 'cancelled_off_platform' THEN
    -- Off-platform cancellation detected: Flag both accounts, NO refund
    UPDATE public.profiles
    SET 
      violation_flags = violation_flags + 1,
      last_violation_at = NOW()
    WHERE id IN (request_record.customer_id, appointment_record.pro_id);
    
    -- Keep the referral fee (no refund)
    UPDATE public.referral_fees
    SET 
      cancellation_reason = cancellation_reason_input,
      updated_at = NOW()
    WHERE request_id = appointment_record.request_id;
  END IF;
  
  RETURN json_build_object('success', true);
END;
$function$;