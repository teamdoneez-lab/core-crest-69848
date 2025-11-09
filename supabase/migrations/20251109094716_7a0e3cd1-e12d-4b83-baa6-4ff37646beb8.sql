-- Add is_platform_seller field to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS is_platform_seller BOOLEAN NOT NULL DEFAULT false;

-- Make user_id nullable to support platform seller (no real user account)
ALTER TABLE public.suppliers 
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.suppliers.is_platform_seller IS 'Indicates if this is the platform seller (DoneEZ) - bypasses Stripe Connect requirements';
COMMENT ON COLUMN public.suppliers.user_id IS 'User ID from auth.users - NULL for platform seller';