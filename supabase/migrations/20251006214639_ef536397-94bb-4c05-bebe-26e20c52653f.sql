-- Fix ambiguous request_id reference in generate_leads_for_request function
CREATE OR REPLACE FUNCTION public.generate_leads_for_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_record service_requests%ROWTYPE;
  matching_pro_id UUID;
BEGIN
  -- Get the service request details
  SELECT * INTO request_record 
  FROM service_requests sr
  WHERE sr.id = request_id;
  
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
$function$;