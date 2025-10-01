-- Manually promote aleksnadarpetkovic@gmail.com to admin role
UPDATE public.profiles 
SET role = 'admin'::user_role
WHERE id = '05fc94cf-9ed7-46a7-b74c-fcce44bdbe41';