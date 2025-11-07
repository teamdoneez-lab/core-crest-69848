-- Add foreign key constraint for customer_id in pro_reviews
ALTER TABLE public.pro_reviews
ADD CONSTRAINT pro_reviews_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;