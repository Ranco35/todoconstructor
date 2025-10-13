-- ===================================================================
-- Crear Tablas del Módulo de Presupuestos
-- ===================================================================

-- Crear secuencias
CREATE SEQUENCE IF NOT EXISTS sales_quotes_id_seq;
CREATE SEQUENCE IF NOT EXISTS sales_quote_lines_id_seq;

-- TABLA: sales_quotes
CREATE TABLE IF NOT EXISTS sales_quotes (
    id BIGINT NOT NULL DEFAULT nextval('sales_quotes_id_seq'::regclass),
    number VARCHAR(32) NOT NULL,
    client_id BIGINT,
    reservation_id BIGINT,
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
    expiration_date DATE,
    notes TEXT,
    internal_notes TEXT,
    payment_terms VARCHAR(64),
    company_id BIGINT,
    seller_id UUID,
    CONSTRAINT sales_quotes_pkey PRIMARY KEY (id),
    CONSTRAINT sales_quotes_number_key UNIQUE (number)
);

ALTER SEQUENCE sales_quotes_id_seq OWNED BY sales_quotes.id;

-- TABLA: sales_quote_lines
CREATE TABLE IF NOT EXISTS sales_quote_lines (
    id BIGINT NOT NULL DEFAULT nextval('sales_quote_lines_id_seq'::regclass),
    quote_id BIGINT NOT NULL,
    product_id BIGINT,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    taxes JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT sales_quote_lines_pkey PRIMARY KEY (id)
);

ALTER SEQUENCE sales_quote_lines_id_seq OWNED BY sales_quote_lines.id;

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_sales_quotes_client_id ON sales_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_number ON sales_quotes(number);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_created_at ON sales_quotes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_quote_lines_quote_id ON sales_quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_quote_lines_product_id ON sales_quote_lines(product_id);

-- PERMISOS
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_quotes TO authenticated, anon;
GRANT ALL ON sales_quotes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON sales_quote_lines TO authenticated, anon;
GRANT ALL ON sales_quote_lines TO service_role;

GRANT USAGE, SELECT ON SEQUENCE sales_quotes_id_seq TO authenticated, anon, service_role;
GRANT USAGE, SELECT ON SEQUENCE sales_quote_lines_id_seq TO authenticated, anon, service_role;

-- RLS
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quote_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_quotes_select_policy ON sales_quotes;
DROP POLICY IF EXISTS sales_quotes_insert_policy ON sales_quotes;
DROP POLICY IF EXISTS sales_quotes_update_policy ON sales_quotes;
DROP POLICY IF EXISTS sales_quotes_delete_policy ON sales_quotes;

CREATE POLICY sales_quotes_select_policy ON sales_quotes 
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY sales_quotes_insert_policy ON sales_quotes 
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY sales_quotes_update_policy ON sales_quotes 
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY sales_quotes_delete_policy ON sales_quotes 
FOR DELETE TO authenticated, anon USING (true);

DROP POLICY IF EXISTS sales_quote_lines_select_policy ON sales_quote_lines;
DROP POLICY IF EXISTS sales_quote_lines_insert_policy ON sales_quote_lines;
DROP POLICY IF EXISTS sales_quote_lines_update_policy ON sales_quote_lines;
DROP POLICY IF EXISTS sales_quote_lines_delete_policy ON sales_quote_lines;

CREATE POLICY sales_quote_lines_select_policy ON sales_quote_lines 
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY sales_quote_lines_insert_policy ON sales_quote_lines 
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY sales_quote_lines_update_policy ON sales_quote_lines 
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY sales_quote_lines_delete_policy ON sales_quote_lines 
FOR DELETE TO authenticated, anon USING (true);

