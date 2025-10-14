-- =====================================================
-- CREAR TABLAS DE FACTURAS (INVOICES)
-- =====================================================
-- Ejecuta este SQL en Supabase Studio > SQL Editor
-- =====================================================

-- 1. CREAR TABLA INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id BIGSERIAL PRIMARY KEY,
    number VARCHAR(32) NOT NULL UNIQUE,
    client_id BIGINT REFERENCES "Client"(id),
    reservation_id BIGINT REFERENCES reservations(id),
    quote_id BIGINT REFERENCES sales_quotes(id),
    budget_id BIGINT REFERENCES sales_quotes(id),
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
    due_date DATE,
    notes TEXT,
    payment_terms VARCHAR(64),
    company_id BIGINT REFERENCES companies(id),
    seller_id UUID REFERENCES "User"(id)
);

-- 2. CREAR TABLA INVOICE_LINES
CREATE TABLE IF NOT EXISTS public.invoice_lines (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES "Product"(id),
    modular_product_id INTEGER,
    name TEXT,
    description VARCHAR(255),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    unit VARCHAR(32),
    discount_percent NUMERIC(5,2) DEFAULT 0,
    taxes JSONB,
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- 3. CREAR TABLA INVOICE_PAYMENTS (si no existe)
CREATE TABLE IF NOT EXISTS public.invoice_payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT now(),
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(32) NOT NULL,
    reference VARCHAR(64),
    notes TEXT,
    created_by UUID REFERENCES "User"(id)
);

-- 4. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_product_id ON invoice_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON invoice_payments(payment_date);

-- 5. HABILITAR RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS RLS (permisivas para empezar)
-- INVOICES
CREATE POLICY "invoices_select_policy" ON invoices
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "invoices_insert_policy" ON invoices
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "invoices_update_policy" ON invoices
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "invoices_delete_policy" ON invoices
FOR DELETE TO authenticated, anon USING (true);

-- INVOICE_LINES
CREATE POLICY "invoice_lines_select_policy" ON invoice_lines
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "invoice_lines_insert_policy" ON invoice_lines
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "invoice_lines_update_policy" ON invoice_lines
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "invoice_lines_delete_policy" ON invoice_lines
FOR DELETE TO authenticated, anon USING (true);

-- INVOICE_PAYMENTS
CREATE POLICY "invoice_payments_select_policy" ON invoice_payments
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "invoice_payments_insert_policy" ON invoice_payments
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "invoice_payments_update_policy" ON invoice_payments
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "invoice_payments_delete_policy" ON invoice_payments
FOR DELETE TO authenticated, anon USING (true);

-- 7. COMENTARIOS
COMMENT ON TABLE invoices IS 'Facturas de venta';
COMMENT ON TABLE invoice_lines IS 'Líneas de factura';
COMMENT ON TABLE invoice_payments IS 'Pagos de facturas';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 
    'invoices' as tabla,
    count(*) as registros
FROM invoices
UNION ALL
SELECT 
    'invoice_lines' as tabla,
    count(*) as registros
FROM invoice_lines
UNION ALL
SELECT 
    'invoice_payments' as tabla,
    count(*) as registros
FROM invoice_payments;

