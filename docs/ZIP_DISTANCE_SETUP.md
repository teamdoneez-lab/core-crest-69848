# ZIP Code Distance Matching Setup

## Problem
Service requests weren't showing up on the Pro dashboard even when the Pro's ZIP code was within their service radius. The system was using exact ZIP code matching instead of distance-based matching.

## Solution
Updated the lead generation system to use geographic distance calculation between ZIP codes instead of exact matches.

## What Changed

### 1. Database Extensions Required
The system now uses PostgreSQL's `earthdistance` extension (which requires `cube`) to calculate distances between geographic coordinates.

```sql
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
```

### 2. New ZIP Codes Reference Table
Created a new `zip_codes` table to store US ZIP code coordinates:

```sql
CREATE TABLE public.zip_codes (
  zip_code TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Updated Lead Generation Function
The `generate_leads_for_request` function now:
- Normalizes all ZIP codes to 5 digits
- Looks up coordinates for customer ZIP code
- Calculates distance in miles between customer and pro locations
- Matches pros within their configured `service_radius` (defaults to 100 miles)
- Falls back to exact ZIP matching if coordinates aren't available
- Still respects manually specified ZIP codes in `pro_service_areas`

## Setup Instructions

### Manual SQL Execution (Recommended)
Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Create ZIP codes table
CREATE TABLE IF NOT EXISTS public.zip_codes (
  zip_code TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zip_codes_coordinates ON public.zip_codes(latitude, longitude);

ALTER TABLE public.zip_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ZIP codes are publicly readable"
ON public.zip_codes FOR SELECT
USING (true);

-- Helper function to get ZIP coordinates
CREATE OR REPLACE FUNCTION public.get_zip_coordinates(zip_input TEXT)
RETURNS TABLE(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_lat DOUBLE PRECISION;
  result_lon DOUBLE PRECISION;
BEGIN
  zip_input := SUBSTRING(TRIM(zip_input) FROM 1 FOR 5);
  
  SELECT latitude, longitude INTO result_lat, result_lon
  FROM zip_codes
  WHERE zip_code = zip_input;
  
  IF result_lat IS NOT NULL THEN
    RETURN QUERY SELECT result_lat, result_lon;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION;
END;
$$;

-- Update lead generation function
CREATE OR REPLACE FUNCTION public.generate_leads_for_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record service_requests%ROWTYPE;
  matching_pro_id UUID;
  request_lat DOUBLE PRECISION;
  request_lon DOUBLE PRECISION;
  pro_lat DOUBLE PRECISION;
  pro_lon DOUBLE PRECISION;
  pro_radius INTEGER;
  distance_miles DOUBLE PRECISION;
BEGIN
  SELECT * INTO request_record 
  FROM service_requests sr
  WHERE sr.id = request_id;
  
  request_record.zip := SUBSTRING(TRIM(request_record.zip) FROM 1 FOR 5);
  
  SELECT lat, lon INTO request_lat, request_lon
  FROM get_zip_coordinates(request_record.zip);
  
  IF request_lat IS NULL THEN
    FOR matching_pro_id IN 
      SELECT DISTINCT pp.pro_id
      FROM pro_profiles pp
      INNER JOIN pro_service_areas psa ON pp.pro_id = psa.pro_id
      INNER JOIN pro_service_categories psc ON pp.pro_id = psc.pro_id
      WHERE pp.is_verified = true
        AND pp.profile_complete = true
        AND SUBSTRING(TRIM(psa.zip) FROM 1 FOR 5) = request_record.zip
        AND psc.category_id = request_record.category_id
    LOOP
      INSERT INTO public.leads (request_id, pro_id)
      VALUES (request_id, matching_pro_id)
      ON CONFLICT (request_id, pro_id) DO NOTHING;
    END LOOP;
    RETURN;
  END IF;
  
  FOR matching_pro_id IN 
    SELECT DISTINCT pp.pro_id
    FROM pro_profiles pp
    INNER JOIN pro_service_categories psc ON pp.pro_id = psc.pro_id
    WHERE pp.is_verified = true
      AND pp.profile_complete = true
      AND psc.category_id = request_record.category_id
      AND pp.latitude IS NOT NULL
      AND pp.longitude IS NOT NULL
  LOOP
    SELECT latitude, longitude, COALESCE(service_radius, 100)
    INTO pro_lat, pro_lon, pro_radius
    FROM pro_profiles
    WHERE pro_id = matching_pro_id;
    
    distance_miles := earth_distance(
      ll_to_earth(request_lat, request_lon),
      ll_to_earth(pro_lat, pro_lon)
    ) * 0.000621371;
    
    IF distance_miles <= pro_radius THEN
      INSERT INTO public.leads (request_id, pro_id)
      VALUES (request_id, matching_pro_id)
      ON CONFLICT (request_id, pro_id) DO NOTHING;
    END IF;
  END LOOP;
  
  FOR matching_pro_id IN 
    SELECT DISTINCT pp.pro_id
    FROM pro_profiles pp
    INNER JOIN pro_service_areas psa ON pp.pro_id = psa.pro_id
    INNER JOIN pro_service_categories psc ON pp.pro_id = psc.pro_id
    WHERE pp.is_verified = true
      AND pp.profile_complete = true
      AND SUBSTRING(TRIM(psa.zip) FROM 1 FOR 5) = request_record.zip
      AND psc.category_id = request_record.category_id
      AND NOT EXISTS (
        SELECT 1 FROM leads l 
        WHERE l.request_id = generate_leads_for_request.request_id 
        AND l.pro_id = pp.pro_id
      )
  LOOP
    INSERT INTO public.leads (request_id, pro_id)
    VALUES (request_id, matching_pro_id)
    ON CONFLICT (request_id, pro_id) DO NOTHING;
  END LOOP;
END;
$$;
```

### Loading ZIP Code Data
You need to populate the `zip_codes` table with US ZIP code coordinates. Options:

1. **Use a ZIP code database**: Download from sources like:
   - https://www.unitedstateszipcodes.org/zip-code-database/
   - https://simplemaps.com/data/us-zips
   
2. **Sample data** (for testing):
   ```sql
   INSERT INTO public.zip_codes (zip_code, latitude, longitude, city, state) VALUES
   ('10001', 40.7506, -73.9971, 'New York', 'NY'),
   ('90001', 33.9731, -118.2479, 'Los Angeles', 'CA'),
   ('60601', 41.8857, -87.6180, 'Chicago', 'IL')
   -- Add more as needed
   ON CONFLICT (zip_code) DO NOTHING;
   ```

## Pro Profile Requirements
For distance matching to work, pros must have:
- `latitude` and `longitude` set in their `pro_profiles`
- `service_radius` configured (defaults to 100 miles if not set)
- `is_verified = true`
- `profile_complete = true`
- At least one service category configured

## Fallback Behavior
If ZIP coordinates aren't available, the system falls back to exact ZIP matching using the `pro_service_areas` table.

## Testing
After setup:
1. Create a new service request with a ZIP code
2. Check that leads are created for all pros within the specified radius
3. Verify the distance calculation is working by checking pros at known distances

## Future Enhancements
- Integrate real-time ZIP code lookup API for missing ZIPs
- Add ZIP code validation on form submission
- Display distance to pro in the UI
- Allow pros to see how many requests are in their area
