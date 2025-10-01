-- Update admin user email to aleksnadarpetkovic@gmail.com
-- This function will promote the user to admin role after they sign up

DROP FUNCTION IF EXISTS public.ensure_admin_user();

CREATE OR REPLACE FUNCTION public.ensure_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if aleksnadarpetkovic@gmail.com exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'aleksnadarpetkovic@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- User exists, ensure they have admin profile
    INSERT INTO public.profiles (id, name, role)
    VALUES (admin_user_id, 'Admin User', 'admin'::user_role)
    ON CONFLICT (id) 
    DO UPDATE SET role = 'admin'::user_role;
    
    RAISE NOTICE 'Admin user promoted successfully';
  ELSE
    RAISE NOTICE 'User aleksnadarpetkovic@gmail.com not found. Please sign up first with this email and password: 123456';
  END IF;
END;
$$;

-- Try to promote the admin user (will succeed only if they've signed up)
SELECT public.ensure_admin_user();