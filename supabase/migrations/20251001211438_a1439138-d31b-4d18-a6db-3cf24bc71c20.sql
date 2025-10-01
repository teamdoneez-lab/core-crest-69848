-- Create admin user account
-- Note: The user must first sign up at admin@gmail.com with password 123456
-- Then this script will promote them to admin

-- Function to create and promote admin user
CREATE OR REPLACE FUNCTION public.ensure_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin@gmail.com exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- User exists, ensure they have admin profile
    INSERT INTO public.profiles (id, name, role)
    VALUES (admin_user_id, 'Admin User', 'admin'::user_role)
    ON CONFLICT (id) 
    DO UPDATE SET role = 'admin'::user_role;
    
    RAISE NOTICE 'Admin user promoted successfully';
  ELSE
    RAISE NOTICE 'User admin@gmail.com not found. Please sign up first with email: admin@gmail.com and password: 123456';
  END IF;
END;
$$;

-- Try to promote the admin user (will succeed only if they've signed up)
SELECT public.ensure_admin_user();