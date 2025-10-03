-- Add revised quote support to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS is_revised BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_quote_id UUID REFERENCES public.quotes(id),
ADD COLUMN IF NOT EXISTS revised_at TIMESTAMP WITH TIME ZONE;

-- Update quotes status enum to include new states
ALTER TABLE public.quotes
DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'pending_confirmation', 'confirmed', 'expired'));

-- Add confirmation timer fields to quotes
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS confirmation_timer_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_timer_minutes INTEGER;

-- Update appointments status to support new cancellation states
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN (
  'pending_inspection', 
  'completed', 
  'cancelled',
  'cancelled_by_customer',
  'cancelled_after_requote',
  'cancelled_off_platform',
  'no_show'
));

-- Add flag for account violations
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS violation_flags INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_violation_at TIMESTAMP WITH TIME ZONE;

-- Add referral fee payment tracking to quotes
ALTER TABLE public.referral_fees
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Function to calculate confirmation timer based on urgency
CREATE OR REPLACE FUNCTION public.get_confirmation_timer_minutes(urgency_value TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN CASE urgency_value
    WHEN 'immediate' THEN 15
    WHEN '1-2 days' THEN 30
    WHEN '1 week' THEN 60
    WHEN '1 month' THEN 120
    ELSE 60 -- default 1 hour
  END;
END;
$$;

-- Function to handle quote acceptance with timer
CREATE OR REPLACE FUNCTION public.accept_quote_with_timer(quote_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record quotes%ROWTYPE;
  request_record service_requests%ROWTYPE;
  timer_minutes INTEGER;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get quote and request details
  SELECT * INTO quote_record FROM public.quotes WHERE id = quote_id_input;
  SELECT * INTO request_record FROM public.service_requests WHERE id = quote_record.request_id;
  
  -- Check if customer owns the request
  IF request_record.customer_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Calculate timer
  timer_minutes := public.get_confirmation_timer_minutes(request_record.urgency);
  expires_at := NOW() + (timer_minutes || ' minutes')::INTERVAL;
  
  -- Update quote to pending_confirmation
  UPDATE public.quotes
  SET 
    status = 'pending_confirmation',
    confirmation_timer_expires_at = expires_at,
    confirmation_timer_minutes = timer_minutes,
    updated_at = NOW()
  WHERE id = quote_id_input;
  
  -- Decline other quotes
  UPDATE public.quotes
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = quote_record.request_id 
    AND id != quote_id_input
    AND status = 'pending';
  
  RETURN json_build_object(
    'success', true, 
    'expires_at', expires_at,
    'timer_minutes', timer_minutes
  );
END;
$$;

-- Function to check and expire timed-out quotes
CREATE OR REPLACE FUNCTION public.expire_timed_out_quotes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending_confirmation'
    AND confirmation_timer_expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Function to prevent off-platform cancellation
CREATE OR REPLACE FUNCTION public.cancel_appointment_with_validation(
  appointment_id_input UUID,
  cancellation_reason_input TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record appointments%ROWTYPE;
  quote_record quotes%ROWTYPE;
  request_record service_requests%ROWTYPE;
  is_customer BOOLEAN;
  revised_quote_exists BOOLEAN;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record FROM public.appointments WHERE id = appointment_id_input;
  SELECT * INTO quote_record FROM public.quotes WHERE request_id = appointment_record.request_id AND status = 'confirmed';
  SELECT * INTO request_record FROM public.service_requests WHERE id = appointment_record.request_id;
  
  -- Check if user is customer
  is_customer := (request_record.customer_id = auth.uid());
  
  -- Check if revised quote exists
  SELECT EXISTS(
    SELECT 1 FROM public.quotes 
    WHERE request_id = appointment_record.request_id 
      AND is_revised = true
      AND status = 'declined'
  ) INTO revised_quote_exists;
  
  -- Anti-bypass logic for customers
  IF is_customer AND appointment_record.status IN ('pending_inspection', 'confirmed') THEN
    IF cancellation_reason_input = 'cancelled_by_customer' AND NOT revised_quote_exists THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Cancellations are only allowed if the mechanic has submitted a revised quote that you declined. Please contact support if you need assistance.'
      );
    END IF;
  END IF;
  
  -- Update appointment status
  UPDATE public.appointments
  SET status = cancellation_reason_input, updated_at = NOW()
  WHERE id = appointment_id_input;
  
  -- Handle refunds based on cancellation reason
  IF cancellation_reason_input IN ('cancelled_by_customer', 'cancelled_after_requote', 'no_show') THEN
    -- Refund referral fee
    UPDATE public.referral_fees
    SET 
      status = 'refunded',
      cancellation_reason = cancellation_reason_input,
      updated_at = NOW()
    WHERE request_id = appointment_record.request_id
      AND status = 'paid';
  ELSIF cancellation_reason_input = 'cancelled_off_platform' THEN
    -- Flag accounts
    UPDATE public.profiles
    SET 
      violation_flags = violation_flags + 1,
      last_violation_at = NOW()
    WHERE id IN (request_record.customer_id, appointment_record.pro_id);
    
    -- No refund
    UPDATE public.referral_fees
    SET cancellation_reason = cancellation_reason_input
    WHERE request_id = appointment_record.request_id;
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;