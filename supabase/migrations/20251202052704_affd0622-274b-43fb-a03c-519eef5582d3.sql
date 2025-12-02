-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'pro', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create enum for offer types
CREATE TYPE public.offer_type AS ENUM ('pro_perk', 'exclusive', 'limited_time');

-- Create partner_offers table
CREATE TABLE public.partner_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  offer_title TEXT NOT NULL,
  description TEXT NOT NULL,
  offer_type public.offer_type NOT NULL,
  cta_label TEXT NOT NULL,
  cta_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  promo_code TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage partner offers"
  ON public.partner_offers
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Pro users can view active offers
CREATE POLICY "Pro users can view active offers"
  ON public.partner_offers
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
    AND public.has_role(auth.uid(), 'pro')
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_partner_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_offers_updated_at
  BEFORE UPDATE ON public.partner_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partner_offers_updated_at();

-- Create storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for partner logos storage
CREATE POLICY "Admins can upload partner logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'partner-logos' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update partner logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'partner-logos' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete partner logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'partner-logos' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Public can view partner logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'partner-logos');