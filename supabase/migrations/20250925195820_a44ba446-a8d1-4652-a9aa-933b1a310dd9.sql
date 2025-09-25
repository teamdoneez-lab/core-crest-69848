-- Add foreign key constraints to leads table
ALTER TABLE public.leads 
ADD CONSTRAINT fk_leads_request_id 
FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

ALTER TABLE public.leads 
ADD CONSTRAINT fk_leads_pro_id 
FOREIGN KEY (pro_id) REFERENCES public.profiles(id) ON DELETE CASCADE;