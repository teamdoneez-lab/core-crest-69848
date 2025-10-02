-- Drop the security definer view (not needed, will use function instead)
DROP VIEW IF EXISTS public.service_requests_masked;

-- Keep the security definer functions as they're necessary to avoid RLS recursion
-- These are correctly implemented and safe