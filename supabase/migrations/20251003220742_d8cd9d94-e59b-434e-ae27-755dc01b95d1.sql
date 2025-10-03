
-- Fix existing paid referral fees where service_request wasn't updated
UPDATE service_requests sr
SET 
  accepted_pro_id = rf.pro_id,
  status = 'in_progress'
FROM referral_fees rf
WHERE sr.id = rf.request_id
  AND rf.status = 'paid'
  AND sr.accepted_pro_id IS NULL;

-- Fix existing appointments to confirmed status where referral fee is paid
UPDATE appointments a
SET status = 'confirmed'
FROM referral_fees rf
WHERE a.request_id = rf.request_id
  AND rf.status = 'paid'
  AND a.status = 'pending_inspection';
