-- Fix security warnings: Add search_path to functions

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION calculate_order_amounts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_supplier_metrics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;