-- Create supplier_status enum
CREATE TYPE supplier_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create order_status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'fulfilled', 'cancelled', 'paid');

-- Create payout_status enum
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  delivery_radius_km INTEGER DEFAULT 50,
  pickup_available BOOLEAN DEFAULT false,
  product_categories TEXT[] DEFAULT '{}',
  status supplier_status DEFAULT 'pending',
  stripe_connect_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Performance metrics
  total_orders INTEGER DEFAULT 0,
  fulfilled_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
  on_time_rate DECIMAL(5,2) DEFAULT 0.00
);

-- Supplier documents table (for licenses, W9s, etc.)
CREATE TABLE public.supplier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'resale_license', 'w9', 'business_certificate'
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Supplier products/inventory table
CREATE TABLE public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  part_name TEXT NOT NULL,
  oem_cross_ref TEXT,
  condition TEXT NOT NULL, -- 'new', 'refurbished', 'used'
  warranty_months INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  region TEXT,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  admin_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(supplier_id, sku)
);

-- Supplier orders table
CREATE TABLE public.supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  product_id UUID NOT NULL REFERENCES public.supplier_products(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  supplier_payout DECIMAL(10,2) NOT NULL,
  
  status order_status DEFAULT 'pending',
  tracking_number TEXT,
  delivery_method TEXT, -- 'shipping', 'pickup'
  
  confirmed_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  stripe_payment_intent TEXT,
  stripe_transfer_id TEXT,
  
  customer_notes TEXT,
  supplier_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Supplier payouts table
CREATE TABLE public.supplier_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  order_id UUID NOT NULL REFERENCES public.supplier_orders(id),
  
  amount DECIMAL(10,2) NOT NULL,
  commission_deducted DECIMAL(10,2) NOT NULL,
  stripe_transfer_id TEXT,
  status payout_status DEFAULT 'pending',
  
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Suppliers can view their own profile"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can update their own profile"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suppliers"
  ON public.suppliers FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all suppliers"
  ON public.suppliers FOR UPDATE
  USING (is_admin());

CREATE POLICY "Anyone can insert supplier applications"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for supplier_documents
CREATE POLICY "Suppliers can manage their own documents"
  ON public.supplier_documents FOR ALL
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all documents"
  ON public.supplier_documents FOR SELECT
  USING (is_admin());

-- RLS Policies for supplier_products
CREATE POLICY "Suppliers can manage their own products"
  ON public.supplier_products FOR ALL
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can view approved products"
  ON public.supplier_products FOR SELECT
  USING (admin_approved = true AND is_active = true);

CREATE POLICY "Admins can manage all products"
  ON public.supplier_products FOR ALL
  USING (is_admin());

-- RLS Policies for supplier_orders
CREATE POLICY "Suppliers can view their orders"
  ON public.supplier_orders FOR SELECT
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can update their orders"
  ON public.supplier_orders FOR UPDATE
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view their orders"
  ON public.supplier_orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all orders"
  ON public.supplier_orders FOR ALL
  USING (is_admin());

-- RLS Policies for supplier_payouts
CREATE POLICY "Suppliers can view their payouts"
  ON public.supplier_payouts FOR SELECT
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all payouts"
  ON public.supplier_payouts FOR ALL
  USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at
  BEFORE UPDATE ON public.supplier_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_payouts_updated_at
  BEFORE UPDATE ON public.supplier_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order amounts with commission
CREATE OR REPLACE FUNCTION calculate_order_amounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal := NEW.quantity * NEW.unit_price;
  NEW.commission_amount := NEW.subtotal * (NEW.commission_rate / 100);
  NEW.total_amount := NEW.subtotal;
  NEW.supplier_payout := NEW.subtotal - NEW.commission_amount;
  
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_supplier_order_amounts
  BEFORE INSERT OR UPDATE ON public.supplier_orders
  FOR EACH ROW EXECUTE FUNCTION calculate_order_amounts();

-- Function to update supplier performance metrics
CREATE OR REPLACE FUNCTION update_supplier_metrics()
RETURNS TRIGGER AS $$
DECLARE
  supplier_record RECORD;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'fulfilled') as fulfilled,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
  INTO supplier_record
  FROM public.supplier_orders
  WHERE supplier_id = NEW.supplier_id;
  
  UPDATE public.suppliers
  SET 
    total_orders = supplier_record.total,
    fulfilled_orders = supplier_record.fulfilled,
    cancelled_orders = supplier_record.cancelled,
    acceptance_rate = CASE 
      WHEN supplier_record.total > 0 
      THEN (supplier_record.fulfilled::DECIMAL / supplier_record.total) * 100 
      ELSE 0 
    END,
    updated_at = now()
  WHERE id = NEW.supplier_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_performance_metrics
  AFTER INSERT OR UPDATE ON public.supplier_orders
  FOR EACH ROW EXECUTE FUNCTION update_supplier_metrics();

-- Add supplier role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('customer', 'pro', 'admin', 'supplier');
  ELSE
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supplier';
  END IF;
END $$;

-- Update user_role enum to include supplier
DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supplier';
END $$;