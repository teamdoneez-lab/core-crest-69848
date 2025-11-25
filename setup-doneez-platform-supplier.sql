-- Setup DoneEZ Platform Supplier
-- Run this in Supabase SQL Editor to ensure correct platform supplier configuration

-- Step 1: Check for existing DoneEZ platform supplier
DO $$
DECLARE
  doneez_supplier_id UUID;
BEGIN
  -- Look for the correct DoneEZ platform supplier
  SELECT id INTO doneez_supplier_id
  FROM suppliers
  WHERE is_platform_seller = true
    AND business_name = 'DoneEZ'
    AND status = 'approved';

  -- If not found, create it
  IF doneez_supplier_id IS NULL THEN
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
      status,
      stripe_onboarding_complete,
      created_at,
      updated_at
    ) VALUES (
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
      NOW(),
      NOW()
    )
    RETURNING id INTO doneez_supplier_id;
    
    RAISE NOTICE 'Created DoneEZ platform supplier with ID: %', doneez_supplier_id;
  ELSE
    RAISE NOTICE 'DoneEZ platform supplier already exists with ID: %', doneez_supplier_id;
  END IF;

  -- Update any incorrect platform suppliers (not named DoneEZ)
  -- Mark them as regular suppliers instead
  UPDATE suppliers
  SET is_platform_seller = false,
      business_name = CONCAT('Old ', business_name)
  WHERE is_platform_seller = true
    AND business_name != 'DoneEZ'
    AND id != doneez_supplier_id;

END $$;

-- Verify the setup
SELECT 
  id,
  business_name,
  is_platform_seller,
  status,
  stripe_onboarding_complete,
  created_at
FROM suppliers
WHERE is_platform_seller = true
  AND business_name = 'DoneEZ';

-- Show all products from DoneEZ platform
SELECT 
  sp.id,
  sp.sku,
  sp.part_name,
  sp.price,
  sp.quantity,
  sp.admin_approved,
  sp.is_active,
  s.business_name as seller_name,
  s.is_platform_seller
FROM supplier_products sp
JOIN suppliers s ON sp.supplier_id = s.id
WHERE s.is_platform_seller = true
  AND s.business_name = 'DoneEZ'
ORDER BY sp.created_at DESC
LIMIT 10;
