-- Fix Lead Generation RLS Policies
-- This ensures service requests appear correctly in Pro Dashboard

-- 1. DROP any conflicting policies on service_requests
DROP POLICY IF EXISTS "Pros can view requests for their service categories" ON service_requests;
DROP POLICY IF EXISTS "Pros can view service requests in their area" ON service_requests;

-- 2. CREATE correct leads SELECT policy
DROP POLICY IF EXISTS "Pros can view their own leads" ON leads;
CREATE POLICY "Pros can view their own leads" 
ON leads 
FOR SELECT 
TO authenticated
USING (pro_id = auth.uid());

-- 3. CREATE correct service_requests SELECT policy
-- Pros can view service requests only if they have a lead for it
DROP POLICY IF EXISTS "Pros can view requests they have leads for" ON service_requests;
CREATE POLICY "Pros can view requests they have leads for" 
ON service_requests 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.request_id = service_requests.id
    AND leads.pro_id = auth.uid()
  )
  OR accepted_pro_id = auth.uid()
);

-- 4. Ensure leads table has RLS enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 5. Verify service_categories is readable by pros
DROP POLICY IF EXISTS "Service categories are viewable by authenticated users" ON service_categories;
CREATE POLICY "Service categories are viewable by authenticated users"
ON service_categories
FOR SELECT
TO authenticated
USING (true);
