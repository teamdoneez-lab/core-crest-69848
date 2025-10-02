-- Create a view that masks sensitive customer data for non-accepted professionals
CREATE OR REPLACE VIEW public.service_requests_masked AS
SELECT 
  sr.id,
  sr.customer_id,
  sr.category_id,
  sr.service_category,
  sr.vehicle_make,
  sr.model,
  sr.year,
  sr.trim,
  sr.mileage,
  -- Mask address: only show zip code area
  sr.zip,
  NULL::text as address,
  NULL::text as formatted_address,
  -- Mask contact information completely
  NULL::text as contact_email,
  NULL::text as contact_phone,
  sr.appointment_pref,
  sr.appointment_type,
  sr.urgency,
  sr.description,
  sr.notes,
  sr.status,
  sr.accepted_pro_id,
  sr.accept_expires_at,
  sr.latitude,
  sr.longitude,
  sr.preferred_time,
  sr.created_at,
  sr.updated_at
FROM public.service_requests sr;

-- Grant select on the masked view to authenticated users
GRANT SELECT ON public.service_requests_masked TO authenticated;

-- Create a security definer function to check if a pro is accepted for a request
CREATE OR REPLACE FUNCTION public.is_accepted_pro_for_request(request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.service_requests
    WHERE id = request_id
      AND accepted_pro_id = auth.uid()
      AND (accept_expires_at IS NULL OR accept_expires_at > now())
  )
$$;

-- Create a function to get full service request details (only for accepted pros and customers)
CREATE OR REPLACE FUNCTION public.get_service_request_details(request_id uuid)
RETURNS TABLE (
  id uuid,
  customer_id uuid,
  category_id uuid,
  service_category text[],
  vehicle_make text,
  model text,
  year integer,
  "trim" text,
  mileage integer,
  zip text,
  address text,
  formatted_address text,
  contact_email text,
  contact_phone text,
  appointment_pref text,
  appointment_type text,
  urgency text,
  description text,
  notes text,
  status text,
  accepted_pro_id uuid,
  accept_expires_at timestamptz,
  latitude double precision,
  longitude double precision,
  preferred_time timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sr.id,
    sr.customer_id,
    sr.category_id,
    sr.service_category,
    sr.vehicle_make,
    sr.model,
    sr.year,
    sr.trim,
    sr.mileage,
    sr.zip,
    CASE 
      -- Show full address only to customer or accepted pro
      WHEN sr.customer_id = auth.uid() THEN sr.address
      WHEN sr.accepted_pro_id = auth.uid() AND (sr.accept_expires_at IS NULL OR sr.accept_expires_at > now()) THEN sr.address
      ELSE NULL
    END as address,
    CASE 
      WHEN sr.customer_id = auth.uid() THEN sr.formatted_address
      WHEN sr.accepted_pro_id = auth.uid() AND (sr.accept_expires_at IS NULL OR sr.accept_expires_at > now()) THEN sr.formatted_address
      ELSE NULL
    END as formatted_address,
    CASE 
      -- Show contact info only to customer or accepted pro
      WHEN sr.customer_id = auth.uid() THEN sr.contact_email
      WHEN sr.accepted_pro_id = auth.uid() AND (sr.accept_expires_at IS NULL OR sr.accept_expires_at > now()) THEN sr.contact_email
      ELSE NULL
    END as contact_email,
    CASE 
      WHEN sr.customer_id = auth.uid() THEN sr.contact_phone
      WHEN sr.accepted_pro_id = auth.uid() AND (sr.accept_expires_at IS NULL OR sr.accept_expires_at > now()) THEN sr.contact_phone
      ELSE NULL
    END as contact_phone,
    sr.appointment_pref,
    sr.appointment_type,
    sr.urgency,
    sr.description,
    sr.notes,
    sr.status,
    sr.accepted_pro_id,
    sr.accept_expires_at,
    sr.latitude,
    sr.longitude,
    sr.preferred_time,
    sr.created_at,
    sr.updated_at
  FROM public.service_requests sr
  WHERE sr.id = request_id
    AND (
      sr.customer_id = auth.uid() -- Customer can see their own request
      OR (
        -- Pro can see if they're in the right area and category
        EXISTS (
          SELECT 1 FROM public.pro_service_areas psa
          WHERE psa.pro_id = auth.uid() AND psa.zip = sr.zip
        )
        AND EXISTS (
          SELECT 1 FROM public.pro_service_categories psc
          WHERE psc.pro_id = auth.uid() AND psc.category_id = sr.category_id
        )
      )
      OR EXISTS ( -- Admin can see all
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
$$;

COMMENT ON VIEW public.service_requests_masked IS 'Masked view of service requests that hides sensitive customer contact information from non-accepted professionals';
COMMENT ON FUNCTION public.is_accepted_pro_for_request IS 'Security definer function to check if the current user is the accepted professional for a specific request';
COMMENT ON FUNCTION public.get_service_request_details IS 'Returns full service request details with conditional access to sensitive customer information based on user role';