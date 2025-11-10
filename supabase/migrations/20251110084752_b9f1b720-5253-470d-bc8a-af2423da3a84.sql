-- Add appointment status enum type
CREATE TYPE appointment_status AS ENUM (
  'quote_requested',
  'pending_confirmation',
  'confirmed',
  'declined',
  'expired',
  'cancelled_by_customer',
  'cancelled_after_requote',
  'cancelled_off_platform',
  'no_show',
  'completed'
);

-- Add state transition tracking table
CREATE TABLE IF NOT EXISTS public.appointment_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transitioned_by UUID REFERENCES auth.users(id),
  transition_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on state transitions
ALTER TABLE public.appointment_state_transitions ENABLE ROW LEVEL SECURITY;

-- RLS policies for state transitions
CREATE POLICY "Users can view transitions for their appointments"
ON public.appointment_state_transitions FOR SELECT
USING (
  appointment_id IN (
    SELECT a.id FROM public.appointments a
    INNER JOIN public.service_requests sr ON a.request_id = sr.id
    WHERE sr.customer_id = auth.uid() OR a.pro_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all transitions"
ON public.appointment_state_transitions FOR SELECT
USING (is_admin());

-- Add timestamp columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_expires_at TIMESTAMP WITH TIME ZONE;

-- Function to track state transitions
CREATE OR REPLACE FUNCTION public.track_appointment_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_state_transitions (
      appointment_id,
      from_status,
      to_status,
      transitioned_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
    
    -- Update timestamp columns based on new status
    CASE NEW.status
      WHEN 'confirmed' THEN
        NEW.confirmed_at = NOW();
      WHEN 'declined' THEN
        NEW.declined_at = NOW();
      WHEN 'expired' THEN
        NEW.expired_at = NOW();
      WHEN 'cancelled_by_customer', 'cancelled_after_requote', 'cancelled_off_platform', 'no_show' THEN
        NEW.cancelled_at = NOW();
      WHEN 'completed' THEN
        NEW.completed_at = NOW();
      ELSE
        -- No timestamp update
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for state tracking
DROP TRIGGER IF EXISTS track_appointment_status_change ON public.appointments;
CREATE TRIGGER track_appointment_status_change
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.track_appointment_state_change();

-- Function to create appointment from confirmed quote
CREATE OR REPLACE FUNCTION public.create_appointment_from_quote(quote_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record RECORD;
  request_record RECORD;
  timer_minutes INTEGER;
  appointment_id UUID;
BEGIN
  -- Get quote and request details
  SELECT q.*, sr.urgency, sr.customer_id
  INTO quote_record
  FROM public.quotes q
  INNER JOIN public.service_requests sr ON q.request_id = sr.id
  WHERE q.id = quote_id_input;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Quote not found');
  END IF;
  
  -- Check if customer owns this request
  IF quote_record.customer_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get confirmation timer based on urgency
  timer_minutes := get_confirmation_timer_minutes(quote_record.urgency);
  
  -- Create or update appointment
  INSERT INTO public.appointments (
    request_id,
    pro_id,
    status,
    confirmation_expires_at,
    notes
  ) VALUES (
    quote_record.request_id,
    quote_record.pro_id,
    'pending_confirmation',
    NOW() + (timer_minutes || ' minutes')::INTERVAL,
    'Awaiting mechanic confirmation'
  )
  ON CONFLICT (request_id) DO UPDATE SET
    pro_id = EXCLUDED.pro_id,
    status = EXCLUDED.status,
    confirmation_expires_at = EXCLUDED.confirmation_expires_at,
    updated_at = NOW()
  RETURNING id INTO appointment_id;
  
  RETURN json_build_object(
    'success', true,
    'appointment_id', appointment_id,
    'expires_at', NOW() + (timer_minutes || ' minutes')::INTERVAL,
    'timer_minutes', timer_minutes
  );
END;
$$;

-- Function to expire pending confirmations
CREATE OR REPLACE FUNCTION public.expire_pending_confirmations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Expire appointments where confirmation timer has run out
  UPDATE public.appointments
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending_confirmation'
    AND confirmation_expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Also expire the associated quotes
  UPDATE public.quotes q
  SET status = 'expired', updated_at = NOW()
  FROM public.appointments a
  WHERE q.request_id = a.request_id
    AND a.status = 'expired'
    AND q.status = 'pending_confirmation';
  
  RETURN expired_count;
END;
$$;

-- Function to handle mechanic confirmation
CREATE OR REPLACE FUNCTION public.confirm_appointment(appointment_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM public.appointments
  WHERE id = appointment_id_input
    AND pro_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Appointment not found or unauthorized');
  END IF;
  
  -- Check if still in pending_confirmation status
  IF appointment_record.status != 'pending_confirmation' THEN
    RETURN json_build_object('success', false, 'error', 'Appointment cannot be confirmed in current status');
  END IF;
  
  -- Check if timer has expired
  IF appointment_record.confirmation_expires_at < NOW() THEN
    UPDATE public.appointments
    SET status = 'expired', updated_at = NOW()
    WHERE id = appointment_id_input;
    
    RETURN json_build_object('success', false, 'error', 'Confirmation period has expired');
  END IF;
  
  -- Update appointment to confirmed
  UPDATE public.appointments
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = appointment_id_input;
  
  -- Update service request status
  UPDATE public.service_requests
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = appointment_record.request_id;
  
  RETURN json_build_object('success', true, 'status', 'confirmed');
END;
$$;

-- Function to decline appointment
CREATE OR REPLACE FUNCTION public.decline_appointment(appointment_id_input UUID, decline_reason TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM public.appointments
  WHERE id = appointment_id_input
    AND pro_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Appointment not found or unauthorized');
  END IF;
  
  -- Check if in pending_confirmation status
  IF appointment_record.status != 'pending_confirmation' THEN
    RETURN json_build_object('success', false, 'error', 'Appointment cannot be declined in current status');
  END IF;
  
  -- Update appointment to declined
  UPDATE public.appointments
  SET status = 'declined', notes = decline_reason, updated_at = NOW()
  WHERE id = appointment_id_input;
  
  -- Decline the associated quote
  UPDATE public.quotes
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = appointment_record.request_id
    AND pro_id = auth.uid()
    AND status = 'pending_confirmation';
  
  RETURN json_build_object('success', true, 'status', 'declined');
END;
$$;

-- Function to complete appointment
CREATE OR REPLACE FUNCTION public.complete_appointment(appointment_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM public.appointments
  WHERE id = appointment_id_input
    AND pro_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Appointment not found or unauthorized');
  END IF;
  
  -- Check if in confirmed status
  IF appointment_record.status != 'confirmed' THEN
    RETURN json_build_object('success', false, 'error', 'Only confirmed appointments can be completed');
  END IF;
  
  -- Update appointment to completed
  UPDATE public.appointments
  SET status = 'completed', updated_at = NOW()
  WHERE id = appointment_id_input;
  
  -- Update service request status
  UPDATE public.service_requests
  SET status = 'completed', updated_at = NOW()
  WHERE id = appointment_record.request_id;
  
  RETURN json_build_object('success', true, 'status', 'completed');
END;
$$;