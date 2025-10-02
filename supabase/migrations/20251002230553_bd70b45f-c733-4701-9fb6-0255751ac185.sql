-- Create storage bucket for service request images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add image_url column to service_requests table
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage policies for service images
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

CREATE POLICY "Users can update their own service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own service images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);