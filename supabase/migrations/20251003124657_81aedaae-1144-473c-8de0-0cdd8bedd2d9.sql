-- Fix search_path for get_confirmation_timer_minutes function
CREATE OR REPLACE FUNCTION public.get_confirmation_timer_minutes(urgency_value TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE urgency_value
    WHEN 'immediate' THEN 15
    WHEN '1-2 days' THEN 30
    WHEN '1 week' THEN 60
    WHEN '1 month' THEN 120
    ELSE 60 -- default 1 hour
  END;
END;
$$;