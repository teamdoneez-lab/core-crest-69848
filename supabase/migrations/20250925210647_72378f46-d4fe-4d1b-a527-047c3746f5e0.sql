-- Function to promote a user to admin role
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  result json;
BEGIN
  -- Find the user by email
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_record IS NULL THEN
    RETURN '{"success": false, "error": "User not found"}'::json;
  END IF;
  
  -- Update the user's role to admin
  UPDATE public.profiles 
  SET role = 'admin'::user_role, updated_at = NOW()
  WHERE id = user_record.id;
  
  IF NOT FOUND THEN
    -- If profile doesn't exist, create it
    INSERT INTO public.profiles (id, name, role)
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'name', user_record.email),
      'admin'::user_role
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'User promoted to admin successfully',
    'user_id', user_record.id,
    'email', user_record.email
  );
END;
$$;

-- Function to create admin user if they don't exist (for initial setup)
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email text, admin_password text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  result json;
BEGIN
  -- Check if user already exists
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF user_record IS NOT NULL THEN
    -- User exists, just promote to admin
    UPDATE public.profiles 
    SET role = 'admin'::user_role, updated_at = NOW()
    WHERE id = user_record.id;
    
    IF NOT FOUND THEN
      -- If profile doesn't exist, create it
      INSERT INTO public.profiles (id, name, role)
      VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'name', user_record.email),
        'admin'::user_role
      );
    END IF;
    
    RETURN json_build_object(
      'success', true, 
      'message', 'Existing user promoted to admin',
      'user_id', user_record.id,
      'email', user_record.email
    );
  ELSE
    RETURN json_build_object(
      'success', false, 
      'error', 'User does not exist. Please sign up first, then run promote_user_to_admin function.'
    );
  END IF;
END;
$$;