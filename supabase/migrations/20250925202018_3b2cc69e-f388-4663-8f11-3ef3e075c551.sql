-- Add job locking columns to service_requests table
ALTER TABLE public.service_requests 
ADD COLUMN accepted_pro_id UUID REFERENCES public.profiles(id),
ADD COLUMN accept_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of expired locks
CREATE INDEX idx_service_requests_accept_expires_at ON public.service_requests(accept_expires_at) WHERE accept_expires_at IS NOT NULL;

-- Update leads RLS policies to prevent accepting locked jobs
DROP POLICY IF EXISTS "Pros can update their own leads" ON public.leads;
CREATE POLICY "Pros can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (
  auth.uid() = pro_id AND 
  -- Can only accept if job is not locked or lock has expired
  (
    SELECT sr.accepted_pro_id IS NULL OR sr.accept_expires_at < NOW()
    FROM public.service_requests sr 
    WHERE sr.id = request_id
  )
);

-- Function to accept a lead and lock the job
CREATE OR REPLACE FUNCTION public.accept_lead_and_lock_job(lead_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  request_record service_requests%ROWTYPE;
  lead_record leads%ROWTYPE;
BEGIN
  -- Get the lead record
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id AND pro_id = auth.uid();
  
  if lead_record IS NULL THEN
    RETURN '{"success": false, "error": "Lead not found or unauthorized"}'::JSON;
  END IF;
  
  -- Get the service request
  SELECT * INTO request_record FROM public.service_requests WHERE id = lead_record.request_id;
  
  -- Check if job is already locked and not expired
  IF request_record.accepted_pro_id IS NOT NULL AND request_record.accept_expires_at > NOW() THEN
    RETURN '{"success": false, "error": "Job is already locked by another professional"}'::JSON;
  END IF;
  
  -- Lock the job for 24 hours
  UPDATE public.service_requests 
  SET 
    accepted_pro_id = auth.uid(),
    accept_expires_at = NOW() + INTERVAL '24 hours',
    updated_at = NOW()
  WHERE id = lead_record.request_id;
  
  -- Update lead status to accepted
  UPDATE public.leads 
  SET 
    status = 'accepted',
    updated_at = NOW()
  WHERE id = lead_id;
  
  -- Decline all other leads for this request
  UPDATE public.leads 
  SET 
    status = 'declined',
    updated_at = NOW()
  WHERE request_id = lead_record.request_id AND id != lead_id;
  
  RETURN '{"success": true, "expires_at": "' || (NOW() + INTERVAL '24 hours')::TEXT || '"}'::JSON;
END;
$$;

-- Function to release expired job locks
CREATE OR REPLACE FUNCTION public.release_expired_job_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  released_count INTEGER;
BEGIN
  -- Release expired locks
  UPDATE public.service_requests 
  SET 
    accepted_pro_id = NULL,
    accept_expires_at = NULL,
    updated_at = NOW()
  WHERE accepted_pro_id IS NOT NULL 
    AND accept_expires_at < NOW();
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  
  -- Reset leads to new status for released jobs
  UPDATE public.leads 
  SET 
    status = 'new',
    updated_at = NOW()
  WHERE request_id IN (
    SELECT sr.id 
    FROM public.service_requests sr 
    WHERE sr.accepted_pro_id IS NULL 
      AND EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.request_id = sr.id 
          AND l.status = 'declined'
      )
  ) AND status = 'declined';
  
  RETURN released_count;
END;
$$;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the expired lock release to run every hour
SELECT cron.schedule(
  'release-expired-job-locks',
  '0 * * * *', -- every hour at minute 0
  $$SELECT public.release_expired_job_locks();$$
);