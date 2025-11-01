-- Fix sync_profile_role to cast through text instead of direct cast
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile role based on user_roles table
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET role = (
      SELECT ur.role::text::user_role
      FROM public.user_roles ur
      WHERE ur.user_id = OLD.user_id
      LIMIT 1
    )
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSE
    -- Cast app_role to text, then to user_role
    UPDATE public.profiles
    SET role = NEW.role::text::user_role
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
END;
$$;