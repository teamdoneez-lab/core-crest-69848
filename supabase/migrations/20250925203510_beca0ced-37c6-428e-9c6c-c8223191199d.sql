-- Create fees table for tracking payments
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'service_fee' CHECK (fee_type IN ('service_fee', 'platform_fee', 'commission')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fees
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fees
CREATE POLICY "Admins can view all fees"
ON public.fees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Pros can view their own fees"
ON public.fees
FOR SELECT
USING (auth.uid() = pro_id);

CREATE POLICY "Admins can update fees"
ON public.fees
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to automatically create fee when request is completed
CREATE OR REPLACE FUNCTION public.create_service_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create fee when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.fees (request_id, pro_id, amount, fee_type)
    VALUES (
      NEW.id,
      NEW.accepted_pro_id,
      25.00, -- Default service fee
      'service_fee'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate fees
CREATE TRIGGER create_service_fee_trigger
AFTER UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_service_fee();

-- Add trigger for fees updated_at
CREATE TRIGGER update_fees_updated_at
BEFORE UPDATE ON public.fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for admin to mark fee as paid
CREATE OR REPLACE FUNCTION public.mark_fee_paid(
  fee_id UUID,
  payment_method_input TEXT DEFAULT NULL,
  notes_input TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN '{"success": false, "error": "Unauthorized - Admin access required"}'::JSON;
  END IF;
  
  -- Update fee status
  UPDATE public.fees 
  SET 
    status = 'paid',
    paid_at = NOW(),
    payment_method = payment_method_input,
    notes = COALESCE(notes_input, notes),
    updated_at = NOW()
  WHERE id = fee_id;
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Fee not found"}'::JSON;
  END IF;
  
  RETURN '{"success": true}'::JSON;
END;
$$;

-- Create indexes for efficient admin queries
CREATE INDEX idx_fees_status ON public.fees(status);
CREATE INDEX idx_fees_pro_id ON public.fees(pro_id);
CREATE INDEX idx_fees_created_at ON public.fees(created_at);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_created_at ON public.service_requests(created_at);