-- Add missing fields to pro_profiles table for enhanced business information
ALTER TABLE public.pro_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS verified_address TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS service_radius INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Create index on zip_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_pro_profiles_zip_code ON public.pro_profiles(zip_code);

-- Create index on profile_complete for filtering
CREATE INDEX IF NOT EXISTS idx_pro_profiles_complete ON public.pro_profiles(profile_complete);

COMMENT ON COLUMN public.pro_profiles.operating_hours IS 'JSON object with day-of-week keys and time ranges';
COMMENT ON COLUMN public.pro_profiles.service_radius IS 'Service radius in miles';
COMMENT ON COLUMN public.pro_profiles.profile_complete IS 'Whether the professional has completed onboarding';