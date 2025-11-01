-- Fix the handle_new_user function to work with text values instead of casting between enums
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text text;
BEGIN
  -- Get role as text
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  -- Create profile (cast text directly to user_role)
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    user_role_text::user_role
  );

  -- Create role entry in secure table (cast text to app_role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_text::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;