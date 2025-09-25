-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id) -- One appointment per service request
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
CREATE POLICY "Customers can view appointments for their requests"
ON public.appointments
FOR SELECT
USING (
  request_id IN (
    SELECT id FROM public.service_requests 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Pros can view their own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = pro_id);

CREATE POLICY "Pros can create appointments for accepted requests"
ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() = pro_id AND
  request_id IN (
    SELECT id FROM public.service_requests 
    WHERE accepted_pro_id = auth.uid() 
      AND accept_expires_at > NOW()
  )
);

CREATE POLICY "Pros can update their own appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = pro_id);

-- Update service_requests status to include full workflow
ALTER TABLE public.service_requests 
DROP CONSTRAINT IF EXISTS service_requests_status_check;

-- Add constraint for new status values
ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled'));

-- Create function to schedule appointment and update request status
CREATE OR REPLACE FUNCTION public.schedule_appointment(
  request_id UUID,
  appointment_time TIMESTAMP WITH TIME ZONE,
  appointment_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  request_record service_requests%ROWTYPE;
BEGIN
  -- Get the service request
  SELECT * INTO request_record 
  FROM public.service_requests 
  WHERE id = request_id AND accepted_pro_id = auth.uid();
  
  IF request_record IS NULL THEN
    RETURN '{"success": false, "error": "Request not found or not authorized"}'::JSON;
  END IF;
  
  -- Check if job is still locked to this pro
  IF request_record.accept_expires_at <= NOW() THEN
    RETURN '{"success": false, "error": "Job lock has expired"}'::JSON;
  END IF;
  
  -- Check if appointment time is in the future
  IF appointment_time <= NOW() THEN
    RETURN '{"success": false, "error": "Appointment time must be in the future"}'::JSON;
  END IF;
  
  -- Create or update appointment
  INSERT INTO public.appointments (request_id, pro_id, starts_at, notes)
  VALUES (request_id, auth.uid(), appointment_time, appointment_notes)
  ON CONFLICT (request_id) 
  DO UPDATE SET 
    starts_at = EXCLUDED.starts_at,
    notes = EXCLUDED.notes,
    updated_at = NOW();
  
  -- Update request status to scheduled
  UPDATE public.service_requests 
  SET 
    status = 'scheduled',
    updated_at = NOW()
  WHERE id = request_id;
  
  RETURN '{"success": true, "appointment_time": "' || appointment_time::TEXT || '"}'::JSON;
END;
$$;

-- Create function to update request status
CREATE OR REPLACE FUNCTION public.update_request_status(
  request_id UUID,
  new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  request_record service_requests%ROWTYPE;
BEGIN
  -- Get the service request
  SELECT * INTO request_record 
  FROM public.service_requests 
  WHERE id = request_id AND accepted_pro_id = auth.uid();
  
  IF request_record IS NULL THEN
    RETURN '{"success": false, "error": "Request not found or not authorized"}'::JSON;
  END IF;
  
  -- Validate status transition
  IF new_status NOT IN ('in_progress', 'completed', 'cancelled') THEN
    RETURN '{"success": false, "error": "Invalid status"}'::JSON;
  END IF;
  
  -- Update request status
  UPDATE public.service_requests 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = request_id;
  
  RETURN '{"success": true, "status": "' || new_status || '"}'::JSON;
END;
$$;

-- Add trigger for appointments updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient appointment queries
CREATE INDEX idx_appointments_pro_id ON public.appointments(pro_id);
CREATE INDEX idx_appointments_request_id ON public.appointments(request_id);
CREATE INDEX idx_appointments_starts_at ON public.appointments(starts_at);