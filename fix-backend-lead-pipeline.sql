-- ============================================================================
-- BACKEND FIX: Lead Generation and Visibility Pipeline
-- ============================================================================
-- This script fixes the backend lead generation system without UI changes.
-- It ensures category_id is populated, leads are generated, and RLS works.

-- ============================================================================
-- 1. FIX RLS POLICIES FOR LEADS
-- ============================================================================

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Pros can view requests for their service categories" ON service_requests;
DROP POLICY IF EXISTS "Pros can view service requests in their area" ON service_requests;
DROP POLICY IF EXISTS "Pros can view their own leads" ON leads;
DROP POLICY IF EXISTS "Pros can view requests they have leads for" ON service_requests;

-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow pros to view their own leads
CREATE POLICY "Pros can view their own leads" 
ON leads 
FOR SELECT 
TO authenticated
USING (pro_id = auth.uid());

-- Allow pros to view service requests only if they have a lead for it
CREATE POLICY "Pros can view requests they have leads for" 
ON service_requests 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.request_id = service_requests.id
    AND leads.pro_id = auth.uid()
  )
  OR accepted_pro_id = auth.uid()
  OR customer_id = auth.uid()
);

-- Ensure service_categories is readable by authenticated users
DROP POLICY IF EXISTS "Service categories are viewable by authenticated users" ON service_categories;
CREATE POLICY "Service categories are viewable by authenticated users"
ON service_categories
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 2. ADD CATEGORY_ID FALLBACK FUNCTION
-- ============================================================================
-- This function ensures category_id is never null by providing a fallback

CREATE OR REPLACE FUNCTION ensure_category_id()
RETURNS TRIGGER AS $$
DECLARE
  auto_repair_id UUID;
BEGIN
  -- If category_id is null, try to derive it from service_category array
  IF NEW.category_id IS NULL AND NEW.service_category IS NOT NULL THEN
    -- Extract first service ID from array (e.g., "rep-101" -> "rep")
    DECLARE
      first_service TEXT;
      category_prefix TEXT;
      category_name TEXT;
    BEGIN
      first_service := NEW.service_category[1];
      
      IF first_service IS NOT NULL THEN
        -- Extract the prefix (everything before first dash)
        category_prefix := split_part(first_service, '-', 1);
        
        -- Map prefix to category name
        category_name := CASE category_prefix
          WHEN '1' THEN 'Auto Repair'
          WHEN '2' THEN 'Oil Change'
          WHEN '3' THEN 'Tire Service'
          WHEN '4' THEN 'Car Wash'
          WHEN '5' THEN 'Diagnostics'
          WHEN 'rep' THEN 'Auto Repair'
          WHEN 'oil' THEN 'Oil Change'
          WHEN 'tire' THEN 'Tire Service'
          WHEN 'wash' THEN 'Car Wash'
          WHEN 'diag' THEN 'Diagnostics'
          ELSE 'Auto Repair'
        END;
        
        -- Look up the category_id
        SELECT id INTO NEW.category_id
        FROM service_categories
        WHERE name = category_name
        AND active = true
        LIMIT 1;
        
        RAISE NOTICE 'Mapped service % to category %: %', first_service, category_name, NEW.category_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error mapping category from service_category: %', SQLERRM;
    END;
  END IF;
  
  -- If still null, use Auto Repair as fallback
  IF NEW.category_id IS NULL THEN
    SELECT id INTO auto_repair_id
    FROM service_categories
    WHERE name = 'Auto Repair'
    AND active = true
    LIMIT 1;
    
    IF auto_repair_id IS NOT NULL THEN
      NEW.category_id := auto_repair_id;
      RAISE NOTICE 'Using Auto Repair fallback for category_id: %', auto_repair_id;
    ELSE
      -- Last resort: use first active category
      SELECT id INTO NEW.category_id
      FROM service_categories
      WHERE active = true
      ORDER BY name
      LIMIT 1;
      
      RAISE NOTICE 'Using first active category as fallback: %', NEW.category_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ADD TRIGGER TO ENSURE CATEGORY_ID
-- ============================================================================
DROP TRIGGER IF EXISTS ensure_category_id_trigger ON service_requests;
CREATE TRIGGER ensure_category_id_trigger
  BEFORE INSERT OR UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION ensure_category_id();

-- ============================================================================
-- 4. UPDATE LEAD GENERATION FUNCTION WITH BETTER LOGGING
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_leads_for_request(request_id UUID)
RETURNS INTEGER AS $$
DECLARE
  lead_count INTEGER := 0;
  pro_record RECORD;
  request_record RECORD;
BEGIN
  -- Fetch the service request details
  SELECT * INTO request_record
  FROM service_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service request % not found', request_id;
  END IF;

  -- Log request details
  RAISE NOTICE '=== LEAD GENERATION START ===';
  RAISE NOTICE 'Request ID: %', request_id;
  RAISE NOTICE 'Category ID: %', request_record.category_id;
  RAISE NOTICE 'Service Category: %', request_record.service_category;
  RAISE NOTICE 'ZIP: %', request_record.zip;
  RAISE NOTICE 'Status: %', request_record.status;

  -- Verify category_id is valid
  IF request_record.category_id IS NULL THEN
    RAISE EXCEPTION 'Service request % has NULL category_id - this should not happen', request_id;
  END IF;

  -- Find matching pros
  FOR pro_record IN
    SELECT DISTINCT
      pp.user_id,
      p.email,
      p.name,
      pp.business_name,
      pp.latitude,
      pp.longitude,
      pp.service_radius,
      pp.zip as pro_zip
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

    -- Match by ZIP code (exact match or distance-based if coordinates available)
    IF pro_record.pro_zip = request_record.zip THEN
      -- Exact ZIP match
      RAISE NOTICE '✓ Pro % matched by exact ZIP', pro_record.user_id;
      
      -- Use RPC function to create lead with notification
      PERFORM create_lead_with_notification(request_id, pro_record.user_id);
      
      lead_count := lead_count + 1;
      
    ELSIF pro_record.latitude IS NOT NULL 
      AND pro_record.longitude IS NOT NULL 
      AND pro_record.service_radius IS NOT NULL THEN
      -- Distance-based matching using request coordinates or ZIP lookup
      DECLARE
        distance_miles NUMERIC;
        customer_lat NUMERIC;
        customer_lon NUMERIC;
      BEGIN
        -- Use request coordinates if available, otherwise try ZIP lookup
        IF request_record.latitude IS NOT NULL AND request_record.longitude IS NOT NULL THEN
          customer_lat := request_record.latitude;
          customer_lon := request_record.longitude;
          RAISE NOTICE 'Using request coordinates: %, %', customer_lat, customer_lon;
        ELSE
          -- Fallback to ZIP code lookup
          SELECT latitude, longitude INTO customer_lat, customer_lon
          FROM zip_codes
          WHERE zip_code = request_record.zip;
          
          IF FOUND THEN
            RAISE NOTICE 'Using ZIP code coordinates: %, %', customer_lat, customer_lon;
          ELSE
            RAISE NOTICE '⚠ No coordinates available for ZIP: %', request_record.zip;
          END IF;
        END IF;

        -- Only calculate distance if we have customer coordinates
        IF customer_lat IS NOT NULL AND customer_lon IS NOT NULL THEN
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

          RAISE NOTICE 'Distance: % miles (radius: %)', distance_miles, pro_record.service_radius;

          IF distance_miles <= pro_record.service_radius THEN
            RAISE NOTICE '✓ Pro % matched by distance', pro_record.user_id;
            
            -- Use RPC function to create lead with notification
            PERFORM create_lead_with_notification(request_id, pro_record.user_id);
            
            lead_count := lead_count + 1;
          ELSE
            RAISE NOTICE '✗ Pro % outside service radius', pro_record.user_id;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Error calculating distance for pro %: %', pro_record.user_id, SQLERRM;
      END;
    ELSE
      RAISE NOTICE '✗ Pro % skipped - no ZIP match and missing location data', pro_record.user_id;
    END IF;
  END LOOP;

  RAISE NOTICE '=== LEAD GENERATION COMPLETE ===';
  RAISE NOTICE 'Generated % leads for service request %', lead_count, request_id;
  
  -- If no leads were generated, log a warning
  IF lead_count = 0 THEN
    RAISE WARNING 'No leads generated for request % - check if pros exist for category %', 
      request_id, request_record.category_id;
  END IF;
  
  RETURN lead_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION ensure_category_id TO postgres, service_role;
GRANT EXECUTE ON FUNCTION generate_leads_for_request TO postgres, service_role, authenticated;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup:
--
-- Check if Auto Repair category exists:
-- SELECT id, name FROM service_categories WHERE name = 'Auto Repair';
--
-- Check if pros have service categories:
-- SELECT pp.user_id, p.name, sc.name as category
-- FROM pro_profiles pp
-- JOIN profiles p ON p.id = pp.user_id
-- JOIN pro_service_categories psc ON psc.pro_id = pp.user_id
-- JOIN service_categories sc ON sc.id = psc.category_id;
--
-- Test lead generation for a specific request:
-- SELECT generate_leads_for_request('your-request-id');
--
-- Check generated leads:
-- SELECT l.id, l.status, sr.id as request_id, p.name as pro_name
-- FROM leads l
-- JOIN service_requests sr ON sr.id = l.request_id
-- JOIN profiles p ON p.id = l.pro_id
-- ORDER BY l.created_at DESC;
-- ============================================================================
