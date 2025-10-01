-- Create referral_fees table
CREATE TABLE public.referral_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'owed' CHECK (status IN ('owed', 'paid', 'canceled')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(request_id)
);

-- Create platform_settings table
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value) VALUES
  ('referral_fee_type', '"flat"'::jsonb),
  ('referral_fee_value', '25.00'::jsonb),
  ('free_jobs_limit', '0'::jsonb);

-- Enable RLS
ALTER TABLE public.referral_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_fees
CREATE POLICY "Pros can view their own fees"
ON public.referral_fees
FOR SELECT
TO authenticated
USING (auth.uid() = pro_id);

CREATE POLICY "Admins can view all fees"
ON public.referral_fees
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update fees"
ON public.referral_fees
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- RLS Policies for platform_settings
CREATE POLICY "Admins can view settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update settings"
ON public.platform_settings
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Trigger to update updated_at
CREATE TRIGGER update_referral_fees_updated_at
BEFORE UPDATE ON public.referral_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();