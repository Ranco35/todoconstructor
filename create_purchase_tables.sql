-- Crear tabla purchase_orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by BIGINT REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla purchase_invoices
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id BIGINT REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_by BIGINT REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla purchase_payments
CREATE TABLE IF NOT EXISTS public.purchase_payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_invoice_id BIGINT REFERENCES public.purchase_invoices(id) ON DELETE RESTRICT,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('cash', 'transfer', 'check', 'credit_card')),
    amount DECIMAL(12,2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by BIGINT REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON public.purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_purchase_order_id ON public.purchase_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON public.purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_date ON public.purchase_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_purchase_payments_supplier_id ON public.purchase_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase_invoice_id ON public.purchase_payments(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_payment_date ON public.purchase_payments(payment_date);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para purchase_orders
CREATE POLICY "Users can view purchase orders" ON public.purchase_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert purchase orders" ON public.purchase_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update purchase orders" ON public.purchase_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete purchase orders" ON public.purchase_orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para purchase_invoices
CREATE POLICY "Users can view purchase invoices" ON public.purchase_invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert purchase invoices" ON public.purchase_invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update purchase invoices" ON public.purchase_invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete purchase invoices" ON public.purchase_invoices
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para purchase_payments
CREATE POLICY "Users can view purchase payments" ON public.purchase_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert purchase payments" ON public.purchase_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update purchase payments" ON public.purchase_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete purchase payments" ON public.purchase_payments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_purchase_orders_updated_at 
    BEFORE UPDATE ON public.purchase_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at 
    BEFORE UPDATE ON public.purchase_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_payments_updated_at 
    BEFORE UPDATE ON public.purchase_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 