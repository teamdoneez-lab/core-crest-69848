-- ============================================================================
-- FIX PRO SERVICE REQUEST VISIBILITY
-- ============================================================================
-- This fixes the issue where pros cannot see service requests on their dashboard
-- after the Phase 1 workflow update.

-- ============================================================================
-- 1. FIX LEADS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Pros can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Pros can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Service role can insert leads" ON public.leads;

-- Recreate policies with correct permissions
CREATE POLICY "Pros can view their own leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (auth.uid() = pro_id);

CREATE POLICY "Pros can update their own leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (auth.uid() = pro_id);

-- Allow service_role to insert leads (for triggers)
CREATE POLICY "Service role can insert leads" 
ON public.leads 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- ============================================================================
-- 2. FIX SERVICE_REQUESTS TABLE POLICIES FOR PROS
-- ============================================================================

-- Drop old policies that might be blocking
DROP POLICY IF EXISTS "Pros can view requests for their service categories" ON public.service_requests;
DROP POLICY IF EXISTS "Pros can view service requests in their area" ON public.service_requests;
DROP POLICY IF EXISTS "Pros can view requests they have leads for" ON public.service_requests;

-- Create correct policy: pros can see requests where they have a lead OR they're the accepted pro
CREATE POLICY "Pros can view requests they have leads for" 
ON public.service_requests 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.request_id = service_requests.id
    AND leads.pro_id = auth.uid()
  )
  OR accepted_pro_id = auth.uid()
);

-- ============================================================================
-- 3. UPDATE LEAD GENERATION FUNCTION TO USE DISTANCE-BASED MATCHING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_leads_for_request(p_request_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  lead_count INTEGER := 0;
  pro_record RECORD;
  request_record RECORD;
  distance_miles NUMERIC;
  customer_lat NUMERIC;
  customer_lon NUMERIC;
BEGIN
  -- Fetch the service request details
  SELECT * INTO request_record
  FROM service_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Service request % not found', p_request_id;
    RETURN 0;
  END IF;

  RAISE NOTICE 'Generating leads for request % (category: %, zip: %)', 
    p_request_id, request_record.category_id, request_record.zip;

  -- Get customer coordinates from request or ZIP lookup
  IF request_record.latitude IS NOT NULL AND request_record.longitude IS NOT NULL THEN
    customer_lat := request_record.latitude;
    customer_lon := request_record.longitude;
    RAISE NOTICE 'Using request coordinates: lat=%, lon=%', customer_lat, customer_lon;
  ELSE
    -- Try to get coordinates from zip_codes table
    SELECT latitude, longitude INTO customer_lat, customer_lon
    FROM zip_codes
    WHERE zip_code = request_record.zip
    LIMIT 1;
    
    IF FOUND THEN
      RAISE NOTICE 'Using ZIP code coordinates: lat=%, lon=%', customer_lat, customer_lon;
    ELSE
      RAISE NOTICE 'No coordinates found for ZIP %', request_record.zip;
    END IF;
  END IF;

  -- Find matching pros who serve the request's service category and are verified
  FOR pro_record IN
    SELECT DISTINCT
      pp.user_id,
      pp.latitude,
      pp.longitude,
      pp.service_radius,
      pp.zip as pro_zip,
      p.email,
      p.name
    FROM pro_profiles pp
    INNER JOIN profiles p ON p.id = pp.user_id
    INNER JOIN pro_service_categories psc ON psc.pro_id = pp.user_id
    WHERE psc.category_id = request_record.category_id
      AND pp.is_verified = true
      AND pp.profile_complete = true
      AND p.email_confirmed_at IS NOT NULL
  LOOP
    RAISE NOTICE 'Checking pro: % (email: %, zip: %)', 
      pro_record.user_id, pro_record.email, pro_record.pro_zip;

    -- Strategy 1: Exact ZIP match (always create lead)
    IF pro_record.pro_zip = request_record.zip THEN
      RAISE NOTICE 'Pro % matched by exact ZIP', pro_record.user_id;
      
      -- Create lead with notification
      PERFORM create_lead_with_notification(p_request_id, pro_record.user_id);
      
      lead_count := lead_count + 1;
      
    -- Strategy 2: Distance-based matching (if coordinates available)
    ELSIF pro_record.latitude IS NOT NULL 
      AND pro_record.longitude IS NOT NULL 
      AND pro_record.service_radius IS NOT NULL 
      AND customer_lat IS NOT NULL 
      AND customer_lon IS NOT NULL THEN
      
      BEGIN
        -- Calculate distance using Haversine formula
        distance_miles := (
          3959 * acos(
            cos(radians(customer_lat)) * 
            cos(radians(pro_record.latitude)) * 
            cos(radians(pro_record.longitude) - radians(customer_lon)) + 
            sin(radians(customer_lat)) * 
            sin(radians(pro_record.latitude))
          )
        );

        RAISE NOTICE 'Distance to pro %: % miles (service radius: % miles)', 
          pro_record.user_id, distance_miles, pro_record.service_radius;

        IF distance_miles <= pro_record.service_radius THEN
          RAISE NOTICE 'Pro % matched by distance', pro_record.user_id;
          
          -- Create lead with notification
          PERFORM create_lead_with_notification(p_request_id, pro_record.user_id);
          
          lead_count := lead_count + 1;
        ELSE
          RAISE NOTICE 'Pro % outside service radius', pro_record.user_id;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error calculating distance for pro %: %', pro_record.user_id, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Pro % skipped - no ZIP match and missing location data', pro_record.user_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Generated % leads for service request %', lead_count, p_request_id;
  RETURN lead_count;
END;
$$;

-- ============================================================================
-- 4. ENSURE TRIGGER IS ACTIVE
-- ============================================================================

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS on_service_request_created ON public.service_requests;
DROP TRIGGER IF EXISTS auto_generate_leads ON public.service_requests;

CREATE OR REPLACE FUNCTION public.trigger_generate_leads()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Generate leads asynchronously
  PERFORM generate_leads_for_request(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_leads
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_leads();

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_leads_for_request TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION trigger_generate_leads TO postgres, service_role;

-- ============================================================================
-- 6. VERIFY SERVICE_CATEGORIES POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Service categories are viewable by authenticated users" ON service_categories;
CREATE POLICY "Service categories are viewable by authenticated users"
ON service_categories
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running this script, verify with:
--
-- 1. Check if triggers exist:
-- SELECT * FROM pg_trigger WHERE tgname = 'auto_generate_leads';
--
-- 2. Check if policies exist:
-- SELECT * FROM pg_policies WHERE tablename IN ('leads', 'service_requests');
--
-- 3. Test lead generation manually:
-- SELECT generate_leads_for_request('your-test-request-id');
--
-- 4. Check generated leads:
-- SELECT * FROM leads WHERE request_id = 'your-test-request-id';
-- ============================================================================
