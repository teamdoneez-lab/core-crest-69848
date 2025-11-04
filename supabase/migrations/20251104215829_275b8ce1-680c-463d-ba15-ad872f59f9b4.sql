-- Phase 5: Add stripe_refund_id column to track Stripe refund transactions
ALTER TABLE public.referral_fees ADD COLUMN IF NOT EXISTS stripe_refund_id text;