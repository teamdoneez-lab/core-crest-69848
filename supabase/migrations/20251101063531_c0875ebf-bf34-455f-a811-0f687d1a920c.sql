-- Create function to handle supplier creation after email confirmation
CREATE OR REPLACE FUNCTION public.handle_supplier_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if user has supplier_data in metadata and role is supplier
  IF (NEW.raw_user_meta_data->>'role' = 'supplier' AND NEW.raw_user_meta_data->'supplier_data' IS NOT NULL) THEN
    -- Insert supplier record
    INSERT INTO public.suppliers (
      user_id,
      business_name,
      contact_name,
      email,
      phone,
      business_address,
      city,
      state,
      zip,
      delivery_radius_km,
      pickup_available,
      product_categories,
      status
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->'supplier_data'->>'business_name',
      NEW.raw_user_meta_data->'supplier_data'->>'contact_name',
      NEW.email,
      NEW.raw_user_meta_data->'supplier_data'->>'phone',
      NEW.raw_user_meta_data->'supplier_data'->>'business_address',
      NEW.raw_user_meta_data->'supplier_data'->>'city',
      NEW.raw_user_meta_data->'supplier_data'->>'state',
      NEW.raw_user_meta_data->'supplier_data'->>'zip',
      COALESCE((NEW.raw_user_meta_data->'supplier_data'->>'delivery_radius_km')::integer, 50),
      COALESCE((NEW.raw_user_meta_data->'supplier_data'->>'pickup_available')::boolean, false),
      COALESCE(
        (SELECT array_agg(value::text) FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'supplier_data'->'product_categories')),
        ARRAY[]::text[]
      ),
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to create supplier after email confirmation
DROP TRIGGER IF EXISTS on_auth_user_created_supplier ON auth.users;
CREATE TRIGGER on_auth_user_created_supplier
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_supplier_signup();