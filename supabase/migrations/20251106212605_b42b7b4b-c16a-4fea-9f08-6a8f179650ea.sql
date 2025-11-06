-- Create pro_reviews table for customer reviews of professionals
CREATE TABLE public.pro_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  pro_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id, appointment_id)
);

-- Enable RLS
ALTER TABLE public.pro_reviews ENABLE ROW LEVEL SECURITY;

-- Customers can create reviews for their own appointments
CREATE POLICY "Customers can create reviews for their appointments"
ON public.pro_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id AND
  appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN service_requests sr ON sr.id = a.request_id
    WHERE sr.customer_id = auth.uid() AND a.status = 'completed'
  )
);

-- Customers can view their own reviews
CREATE POLICY "Customers can view their own reviews"
ON public.pro_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Pros can view reviews about them
CREATE POLICY "Pros can view their reviews"
ON public.pro_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = pro_id);

-- Anyone can view reviews for verified pros (public display)
CREATE POLICY "Anyone can view reviews for verified pros"
ON public.pro_reviews
FOR SELECT
TO authenticated
USING (
  pro_id IN (
    SELECT pro_id FROM pro_profiles WHERE is_verified = true
  )
);

-- Customers can update their own reviews within 30 days
CREATE POLICY "Customers can update their reviews"
ON public.pro_reviews
FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id AND
  created_at > (now() - interval '30 days')
)
WITH CHECK (
  auth.uid() = customer_id
);

-- Create trigger for updated_at
CREATE TRIGGER update_pro_reviews_updated_at
BEFORE UPDATE ON public.pro_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();