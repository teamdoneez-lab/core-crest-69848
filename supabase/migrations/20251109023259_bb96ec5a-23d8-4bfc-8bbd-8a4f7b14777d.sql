-- Add additional photos requested tracking to service_requests
ALTER TABLE service_requests 
ADD COLUMN additional_photos_requested boolean DEFAULT false,
ADD COLUMN photos_requested_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN service_requests.additional_photos_requested IS 'Indicates if the pro has requested more photos from the customer';
COMMENT ON COLUMN service_requests.photos_requested_at IS 'Timestamp when additional photos were requested by the pro';