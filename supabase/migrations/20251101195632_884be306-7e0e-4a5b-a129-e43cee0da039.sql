-- Add 'supplier' to the app_role and user_role enums
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supplier';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'supplier';