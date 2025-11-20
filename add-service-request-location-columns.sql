-- ============================================================================
-- Add Location Columns to Service Requests Table
-- ============================================================================
-- This migration adds latitude, longitude, and formatted_address columns
-- to the service_requests table to support geocoded location data.

ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN service_requests.latitude IS 'Geocoded latitude from address (nullable)';
COMMENT ON COLUMN service_requests.longitude IS 'Geocoded longitude from address (nullable)';
COMMENT ON COLUMN service_requests.formatted_address IS 'Google Maps formatted address (nullable)';
