-- Migración: Módulo de Ventas/Facturación/Presupuestos
-- Crea tablas: sales_quotes, sales_quote_lines, invoices, invoice_lines, invoice_payments

-- Tabla de presupuestos (sales_quotes)
CREATE TABLE public.sales_quotes (
    id BIGSERIAL PRIMARY KEY,
    number VARCHAR(32) NOT NULL UNIQUE,
    client_id BIGINT REFERENCES clients(id),
    reservation_id BIGINT REFERENCES reservations(id),
    status VARCHAR(16) NOT NULL DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
    expiration_date DATE,
    notes TEXT,
    payment_terms VARCHAR(64),
    company_id BIGINT REFERENCES companies(id),
    seller_id BIGINT REFERENCES users(id)
);

-- Tabla de líneas de presupuesto (sales_quote_lines)
CREATE TABLE public.sales_quote_lines (
    id BIGSERIAL PRIMARY KEY,
    quote_id BIGINT REFERENCES sales_quotes(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    description VARCHAR(255),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    taxes JSONB,
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- Tabla de facturas (invoices)
CREATE TABLE public.invoices (
    id BIGSERIAL PRIMARY KEY,
    number VARCHAR(32) NOT NULL UNIQUE,
    client_id BIGINT REFERENCES clients(id),
    reservation_id BIGINT REFERENCES reservations(id),
    quote_id BIGINT REFERENCES sales_quotes(id),
    status VARCHAR(16) NOT NULL DEFAULT 'draft', -- draft, to_pay, partially_paid, paid, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
    due_date DATE,
    notes TEXT,
    payment_terms VARCHAR(64),
    company_id BIGINT REFERENCES companies(id),
    seller_id BIGINT REFERENCES users(id)
);

-- Tabla de líneas de factura (invoice_lines)
CREATE TABLE public.invoice_lines (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    description VARCHAR(255),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    taxes JSONB,
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- Tabla de pagos de factura (invoice_payments)
CREATE TABLE public.invoice_payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT now(),
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(32) NOT NULL,
    reference VARCHAR(64),
    created_by BIGINT REFERENCES users(id)
);

-- Índices útiles
CREATE INDEX idx_sales_quotes_client_id ON sales_quotes(client_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
