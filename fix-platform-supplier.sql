-- Fix Platform Supplier Setup
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Step 1: Create platform supplier if it doesn't exist
INSERT INTO suppliers (
  business_name,
  contact_name,
  business_address,
  city,
  state,
  zip,
  email,
  phone,
  is_platform_seller,
  stripe_connect_account_id,
  status,
  stripe_onboarding_complete,
  created_at,
  updated_at
) 
SELECT 
  'DoneEZ',
  'DoneEZ Platform',
  'Platform Headquarters',
  'Online',
  'CA',
  '00000',
  'platform@doneez.com',
  '0000000000',
  true,
  null,
  'approved',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers WHERE is_platform_seller = true
);

-- Step 2: Update RLS policy to allow viewing platform supplier
DROP POLICY IF EXISTS "Suppliers can view own data" ON suppliers;
CREATE POLICY "Suppliers can view own data" 
  ON suppliers FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR is_platform_seller = true
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Verify the platform supplier was created
SELECT id, business_name, is_platform_seller, status 
FROM suppliers 
WHERE is_platform_seller = true;
