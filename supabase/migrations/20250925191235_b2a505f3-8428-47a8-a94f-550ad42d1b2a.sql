-- Create service_requests table for Phase 3
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id),
  vehicle_make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  trim TEXT,
  mileage INTEGER,
  appointment_pref TEXT NOT NULL CHECK (appointment_pref IN ('asap', 'scheduled', 'flexible')),
  address TEXT NOT NULL,
  zip TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pro_profiles table for Phase 4
CREATE TABLE public.pro_profiles (
  pro_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  notes TEXT,
  radius_km INTEGER DEFAULT 25,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for pro service categories
CREATE TABLE public.pro_service_categories (
  pro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (pro_id, category_id)
);

-- Create pro service areas (zip codes they serve)
CREATE TABLE public.pro_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pro_id, zip)
);

-- Enable RLS on all new tables
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_service_areas ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_requests
CREATE POLICY "Customers can view their own requests" 
ON public.service_requests FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own requests" 
ON public.service_requests FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own requests" 
ON public.service_requests FOR UPDATE 
USING (auth.uid() = customer_id);

-- Pros can view requests in their service areas (simplified for now)
CREATE POLICY "Pros can view requests in their areas" 
ON public.service_requests FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'pro'
  )
);

-- RLS policies for pro_profiles
CREATE POLICY "Pros can view their own profile" 
ON public.pro_profiles FOR SELECT 
USING (auth.uid() = pro_id);

CREATE POLICY "Pros can create their own profile" 
ON public.pro_profiles FOR INSERT 
WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Pros can update their own profile" 
ON public.pro_profiles FOR UPDATE 
USING (auth.uid() = pro_id);

-- Public can view verified pro profiles
CREATE POLICY "Anyone can view verified pro profiles" 
ON public.pro_profiles FOR SELECT 
USING (is_verified = true);

-- RLS policies for pro_service_categories
CREATE POLICY "Pros can manage their service categories" 
ON public.pro_service_categories FOR ALL 
USING (auth.uid() = pro_id);

-- RLS policies for pro_service_areas
CREATE POLICY "Pros can manage their service areas" 
ON public.pro_service_areas FOR ALL 
USING (auth.uid() = pro_id);

-- Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pro_profiles_updated_at
  BEFORE UPDATE ON public.pro_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();