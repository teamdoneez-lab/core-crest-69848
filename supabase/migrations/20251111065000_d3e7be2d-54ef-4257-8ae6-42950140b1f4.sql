-- Function to manually confirm an appointment after payment
CREATE OR REPLACE FUNCTION public.admin_confirm_appointment(
  p_referral_fee_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_referral_fee RECORD;
  v_request RECORD;
  v_appointment_id UUID;
  v_result JSON;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized - Admin access required'
    );
  END IF;

  -- Get referral fee details
  SELECT * INTO v_referral_fee
  FROM referral_fees
  WHERE id = p_referral_fee_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Referral fee not found'
    );
  END IF;

  -- Check if already confirmed
  IF v_referral_fee.status = 'paid' AND EXISTS (
    SELECT 1 FROM appointments 
    WHERE request_id = v_referral_fee.request_id 
    AND status = 'confirmed'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Appointment already confirmed'
    );
  END IF;

  -- Get service request details
  SELECT * INTO v_request
  FROM service_requests
  WHERE id = v_referral_fee.request_id;

  -- Update quote to confirmed
  UPDATE quotes
  SET 
    status = 'confirmed',
    payment_status = 'paid',
    updated_at = NOW()
  WHERE id = v_referral_fee.quote_id;

  -- Update service request status
  UPDATE service_requests
  SET 
    status = 'scheduled',
    updated_at = NOW()
  WHERE id = v_referral_fee.request_id;

  -- Create or update appointment
  INSERT INTO appointments (
    request_id,
    pro_id,
    status,
    starts_at,
    notes
  ) VALUES (
    v_referral_fee.request_id,
    v_referral_fee.pro_id,
    'confirmed',
    NOW() + INTERVAL '1 day',
    COALESCE(p_admin_notes, 'Manually confirmed by admin after payment issue')
  )
  ON CONFLICT (request_id) 
  DO UPDATE SET
    status = 'confirmed',
    notes = COALESCE(p_admin_notes, 'Manually confirmed by admin after payment issue'),
    updated_at = NOW()
  RETURNING id INTO v_appointment_id;

  -- Log the manual confirmation in appointment transitions
  INSERT INTO appointment_state_transitions (
    appointment_id,
    from_status,
    to_status,
    transitioned_by,
    transition_reason
  ) VALUES (
    v_appointment_id,
    NULL,
    'confirmed',
    auth.uid(),
    'Manual confirmation by admin: ' || COALESCE(p_admin_notes, 'Payment processed but auto-confirmation failed')
  );

  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'message', 'Appointment confirmed successfully'
  );
END;
$$;