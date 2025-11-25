-- Final DoneEZ Platform Supplier Setup
-- Run this in Supabase SQL Editor to configure the official DoneEZ platform seller

-- Step 1: Ensure the official DoneEZ supplier exists with the correct ID
INSERT INTO suppliers (
  id,
  business_name,
  contact_name,
  business_address,
  city,
  state,
  zip,
  email,
  phone,
  is_platform_seller,
  status,
  stripe_onboarding_complete,
  stripe_connect_account_id,
  created_at,
  updated_at
) VALUES (
  'a52d5eb4-0504-482f-b87d-c7aedce36fda',
  'DoneEZ',
  'DoneEZ Platform',
  'Platform Headquarters',
  'Online',
  'CA',
  '00000',
  'platform@doneez.com',
  '0000000000',
  true,
  'approved',
  true,
  NULL, -- Platform seller does not need Stripe Connect
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  business_name = 'DoneEZ',
  is_platform_seller = true,
  status = 'approved',
  stripe_onboarding_complete = true,
  stripe_connect_account_id = NULL,
  updated_at = NOW();

-- Step 2: Remove platform_seller flag from any other suppliers
UPDATE suppliers
SET 
  is_platform_seller = false,
  updated_at = NOW()
WHERE 
  id != 'a52d5eb4-0504-482f-b87d-c7aedce36fda'
  AND is_platform_seller = true;

-- Step 3: Migrate any products from old platform suppliers to DoneEZ
UPDATE supplier_products
SET 
  supplier_id = 'a52d5eb4-0504-482f-b87d-c7aedce36fda',
  updated_at = NOW()
WHERE supplier_id IN (
  SELECT id FROM suppliers
  WHERE business_name ILIKE '%platform%'
    AND id != 'a52d5eb4-0504-482f-b87d-c7aedce36fda'
);

-- Step 4: Update RLS policies to allow viewing platform supplier
-- Drop and recreate the policy to ensure it includes platform seller
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

-- Verify the setup
SELECT 
  id,
  business_name,
  is_platform_seller,
  status,
  stripe_onboarding_complete,
  stripe_connect_account_id,
  created_at
FROM suppliers
WHERE id = 'a52d5eb4-0504-482f-b87d-c7aedce36fda';

-- Show count of platform products
SELECT 
  COUNT(*) as total_doneez_products,
  SUM(CASE WHEN admin_approved = true AND is_active = true THEN 1 ELSE 0 END) as active_products,
  SUM(CASE WHEN admin_approved = false THEN 1 ELSE 0 END) as pending_approval
FROM supplier_products
WHERE supplier_id = 'a52d5eb4-0504-482f-b87d-c7aedce36fda';

-- Show recent DoneEZ products
SELECT 
  sp.id,
  sp.sku,
  sp.part_name,
  sp.category,
  sp.price,
  sp.quantity,
  sp.admin_approved,
  sp.is_active,
  sp.created_at
FROM supplier_products sp
WHERE sp.supplier_id = 'a52d5eb4-0504-482f-b87d-c7aedce36fda'
ORDER BY sp.created_at DESC
LIMIT 10;
