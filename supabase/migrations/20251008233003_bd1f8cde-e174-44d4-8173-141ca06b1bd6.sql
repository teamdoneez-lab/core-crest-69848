-- Update the appointment_type check constraint to allow 'either' as a valid value
ALTER TABLE service_requests 
DROP CONSTRAINT IF EXISTS service_requests_appointment_type_check;

ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_appointment_type_check 
CHECK (appointment_type IN ('mobile', 'shop', 'either'));