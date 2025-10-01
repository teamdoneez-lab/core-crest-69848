-- Add new columns to service_requests table
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS service_category text[],
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS urgency text CHECK (urgency IN ('immediate', 'week', 'month', 'other')),
  ADD COLUMN IF NOT EXISTS appointment_type text CHECK (appointment_type IN ('mobile', 'shop')),
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS formatted_address text,
  ADD COLUMN IF NOT EXISTS preferred_time timestamp with time zone;

-- Update existing category_id column to be nullable since we're moving to service_category array
ALTER TABLE public.service_requests 
  ALTER COLUMN category_id DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.service_requests.service_category IS 'Array of service category IDs that user selected';
COMMENT ON COLUMN public.service_requests.urgency IS 'How urgent the service is needed: immediate (1-2 days), week, month, other';
COMMENT ON COLUMN public.service_requests.appointment_type IS 'Whether service is mobile (come to customer) or shop (customer comes to shop)';
COMMENT ON COLUMN public.service_requests.preferred_time IS 'Customer preferred date and time for the service';