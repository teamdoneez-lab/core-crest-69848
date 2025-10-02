-- Remove the old trigger and function that creates referral fees on quote acceptance
DROP TRIGGER IF EXISTS create_referral_fee_trigger ON quotes CASCADE;
DROP FUNCTION IF EXISTS create_referral_fee_on_quote_accept() CASCADE;

-- Add a new column to track quote payment status
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status);

COMMENT ON COLUMN quotes.payment_status IS 'Tracks whether the referral fee has been paid before quote submission';