-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('new', 'accepted', 'declined');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  pro_id UUID NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, pro_id)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads
CREATE POLICY "Pros can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = pro_id);

CREATE POLICY "Pros can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = pro_id);

-- Create function to generate leads for matching pros
CREATE OR REPLACE FUNCTION public.generate_leads_for_request(request_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  request_record service_requests%ROWTYPE;
  matching_pro_id UUID;
BEGIN
  -- Get the service request details
  SELECT * INTO request_record 
  FROM service_requests 
  WHERE id = request_id;
  
  -- Find matching pros who:
  -- 1. Serve the request's zip code
  -- 2. Offer the request's service category
  -- 3. Are verified
  FOR matching_pro_id IN 
    SELECT DISTINCT pp.pro_id
    FROM pro_profiles pp
    INNER JOIN pro_service_areas psa ON pp.pro_id = psa.pro_id
    INNER JOIN pro_service_categories psc ON pp.pro_id = psc.pro_id
    WHERE pp.is_verified = true
      AND psa.zip = request_record.zip
      AND psc.category_id = request_record.category_id
  LOOP
    -- Insert lead record for matching pro
    INSERT INTO public.leads (request_id, pro_id)
    VALUES (request_id, matching_pro_id)
    ON CONFLICT (request_id, pro_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Create trigger to automatically generate leads when service request is created
CREATE OR REPLACE FUNCTION public.handle_new_service_request()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Generate leads for the new service request
  PERFORM public.generate_leads_for_request(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_service_request_created
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_service_request();

-- Add update trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();