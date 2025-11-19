-- ============================================================================
-- LEAD GENERATION SYSTEM SETUP
-- ============================================================================
-- This script sets up automatic lead generation when service requests are created.
-- Leads are created for pros that match the service category and are within the service area.

-- ============================================================================
-- FUNCTION: Generate leads for a service request
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
    RAISE NOTICE 'Service request % not found', request_id;
    RETURN 0;
  END IF;

  RAISE NOTICE 'Generating leads for service request % (category: %, zip: %)', 
    request_id, request_record.category_id, request_record.zip;

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
      RAISE NOTICE 'Pro % matched by exact ZIP', pro_record.user_id;
      
      -- Use RPC function to create lead with notification
      PERFORM create_lead_with_notification(request_id, pro_record.user_id);
      
      lead_count := lead_count + 1;
      
    ELSIF pro_record.latitude IS NOT NULL 
      AND pro_record.longitude IS NOT NULL 
      AND pro_record.service_radius IS NOT NULL THEN
      -- Distance-based matching (if ZIP coordinates are available)
      DECLARE
        distance_miles NUMERIC;
        customer_lat NUMERIC;
        customer_lon NUMERIC;
      BEGIN
        -- Try to get customer ZIP coordinates
        SELECT latitude, longitude INTO customer_lat, customer_lon
        FROM zip_codes
        WHERE zip_code = request_record.zip;

        IF FOUND THEN
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

          RAISE NOTICE 'Distance to pro %: % miles (radius: %)', 
            pro_record.user_id, distance_miles, pro_record.service_radius;

          IF distance_miles <= pro_record.service_radius THEN
            RAISE NOTICE 'Pro % matched by distance', pro_record.user_id;
            
            -- Use RPC function to create lead with notification
            PERFORM create_lead_with_notification(request_id, pro_record.user_id);
            
            lead_count := lead_count + 1;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error calculating distance for pro %: %', pro_record.user_id, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Pro % skipped - no ZIP match and missing location data', pro_record.user_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Generated % leads for service request %', lead_count, request_id;
  RETURN lead_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Trigger function to generate leads after service request insert
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_generate_leads()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the lead generation function asynchronously
  PERFORM generate_leads_for_request(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-generate leads when service request is created
-- ============================================================================
DROP TRIGGER IF EXISTS auto_generate_leads ON service_requests;
CREATE TRIGGER auto_generate_leads
  AFTER INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_leads();

-- ============================================================================
-- DEPRECATED: Trigger-based notification (replaced by RPC function)
-- ============================================================================
-- The notify_pro_new_lead trigger has been replaced by the
-- create_lead_with_notification RPC function which creates both the lead
-- and notification atomically. This ensures notifications are never missed.
--
-- Previous approach using triggers was unreliable. New approach:
-- Use create_lead_with_notification() instead of direct INSERT INTO leads.

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant necessary permissions for the functions to work
GRANT EXECUTE ON FUNCTION generate_leads_for_request TO postgres, service_role;
GRANT EXECUTE ON FUNCTION trigger_generate_leads TO postgres, service_role;

-- ============================================================================
-- NOTES FOR MANUAL SETUP
-- ============================================================================
-- 1. Enable pg_net extension (if not already enabled):
--    CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- 2. Configure Supabase settings in your database:
--    ALTER DATABASE postgres SET app.settings.supabase_url = 'https://cxraykdmlshcntqjumpc.supabase.co';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- 3. For distance-based matching, populate the zip_codes table with coordinates:
--    See ZIP_DISTANCE_SETUP.md for instructions
--
-- 4. Ensure pro profiles have:
--    - is_verified = true
--    - profile_complete = true
--    - Email confirmed (email_confirmed_at IS NOT NULL)
--    - At least one service category in pro_service_categories
--    - For distance matching: latitude, longitude, service_radius
--
-- ============================================================================
-- TESTING
-- ============================================================================
-- To test lead generation for an existing service request:
-- SELECT generate_leads_for_request('your-service-request-id');
--
-- To check generated leads:
-- SELECT * FROM leads WHERE service_request_id = 'your-service-request-id';
-- ============================================================================
