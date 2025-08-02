-- Módulo de Compras - Basado en estructura de Ventas
-- Crea tablas: purchase_orders, purchase_order_lines, purchase_invoices, purchase_invoice_lines, purchase_payments

-- Tabla de órdenes de compra (purchase_orders)
CREATE TABLE public.purchase_orders (
    "id" bigint NOT NULL DEFAULT nextval('purchase_orders_id_seq'::regclass),
    "number" character varying(32) NOT NULL,
    "supplier_id" bigint,
    "warehouse_id" bigint,
    "status" character varying(16) NOT NULL DEFAULT 'draft'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "total" numeric(18,2) NOT NULL DEFAULT 0,
    "currency" character varying(8) NOT NULL DEFAULT 'CLP'::character varying,
    "expected_delivery_date" date,
    "notes" text,
    "payment_terms" character varying(64),
    "company_id" bigint,
    "buyer_id" uuid,
    "approved_by" uuid,
    "approved_at" timestamp with time zone
);

-- Tabla de líneas de órdenes de compra (purchase_order_lines)
CREATE TABLE public.purchase_order_lines (
    "id" bigint NOT NULL DEFAULT nextval('purchase_order_lines_id_seq'::regclass),
    "order_id" bigint,
    "product_id" bigint,
    "description" character varying(255),
    "quantity" numeric(10,2) NOT NULL DEFAULT 1,
    "unit_price" numeric(18,2) NOT NULL DEFAULT 0,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "taxes" jsonb,
    "subtotal" numeric(18,2) NOT NULL DEFAULT 0
);

-- Tabla de facturas de compra (purchase_invoices)
CREATE TABLE public.purchase_invoices (
    "id" bigint NOT NULL DEFAULT nextval('purchase_invoices_id_seq'::regclass),
    "number" character varying(32) NOT NULL,
    "supplier_id" bigint,
    "order_id" bigint,
    "warehouse_id" bigint,
    "status" character varying(16) NOT NULL DEFAULT 'draft'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "total" numeric(18,2) NOT NULL DEFAULT 0,
    "currency" character varying(8) NOT NULL DEFAULT 'CLP'::character varying,
    "due_date" date,
    "notes" text,
    "payment_terms" character varying(64),
    "company_id" bigint,
    "buyer_id" uuid
);

-- Tabla de líneas de facturas de compra (purchase_invoice_lines)
CREATE TABLE public.purchase_invoice_lines (
    "id" bigint NOT NULL DEFAULT nextval('purchase_invoice_lines_id_seq'::regclass),
    "invoice_id" bigint,
    "product_id" bigint,
    "description" character varying(255),
    "quantity" numeric(10,2) NOT NULL DEFAULT 1,
    "unit_price" numeric(18,2) NOT NULL DEFAULT 0,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "taxes" jsonb,
    "subtotal" numeric(18,2) NOT NULL DEFAULT 0,
    "received_quantity" numeric(10,2) DEFAULT 0
);

-- Tabla de pagos de facturas de compra (purchase_payments)
CREATE TABLE public.purchase_payments (
    "id" bigint NOT NULL DEFAULT nextval('purchase_payments_id_seq'::regclass),
    "invoice_id" bigint,
    "payment_date" date NOT NULL DEFAULT now(),
    "amount" numeric(18,2) NOT NULL DEFAULT 0,
    "payment_method" character varying(32) NOT NULL,
    "reference" character varying(64),
    "created_by" uuid
);

-- Secuencias para las nuevas tablas
CREATE SEQUENCE IF NOT EXISTS purchase_orders_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_order_lines_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_invoices_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_invoice_lines_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_payments_id_seq;

-- Foreign Keys
ALTER TABLE public.purchase_orders 
ADD CONSTRAINT purchase_orders_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES public."Supplier"(id);

ALTER TABLE public.purchase_orders 
ADD CONSTRAINT purchase_orders_warehouse_id_fkey 
FOREIGN KEY (warehouse_id) REFERENCES public."Warehouse"(id);

ALTER TABLE public.purchase_order_lines 
ADD CONSTRAINT purchase_order_lines_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_order_lines 
ADD CONSTRAINT purchase_order_lines_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public."Product"(id);

ALTER TABLE public.purchase_invoices 
ADD CONSTRAINT purchase_invoices_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES public."Supplier"(id);

ALTER TABLE public.purchase_invoices 
ADD CONSTRAINT purchase_invoices_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES public.purchase_orders(id);

ALTER TABLE public.purchase_invoices 
ADD CONSTRAINT purchase_invoices_warehouse_id_fkey 
FOREIGN KEY (warehouse_id) REFERENCES public."Warehouse"(id);

ALTER TABLE public.purchase_invoice_lines 
ADD CONSTRAINT purchase_invoice_lines_invoice_id_fkey 
FOREIGN KEY (invoice_id) REFERENCES public.purchase_invoices(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_invoice_lines 
ADD CONSTRAINT purchase_invoice_lines_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public."Product"(id);

ALTER TABLE public.purchase_payments 
ADD CONSTRAINT purchase_payments_invoice_id_fkey 
FOREIGN KEY (invoice_id) REFERENCES public.purchase_invoices(id) ON DELETE CASCADE;

-- Índices
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);
CREATE INDEX idx_purchase_orders_warehouse_id ON public.purchase_orders USING btree (warehouse_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);
CREATE INDEX idx_purchase_orders_number ON public.purchase_orders USING btree (number);
CREATE INDEX idx_purchase_order_lines_order_id ON public.purchase_order_lines USING btree (order_id);
CREATE INDEX idx_purchase_invoices_supplier_id ON public.purchase_invoices USING btree (supplier_id);
CREATE INDEX idx_purchase_invoices_order_id ON public.purchase_invoices USING btree (order_id);
CREATE INDEX idx_purchase_invoices_status ON public.purchase_invoices USING btree (status);
CREATE INDEX idx_purchase_invoices_number ON public.purchase_invoices USING btree (number);
CREATE INDEX idx_purchase_invoice_lines_invoice_id ON public.purchase_invoice_lines USING btree (invoice_id);
CREATE INDEX idx_purchase_payments_invoice_id ON public.purchase_payments USING btree (invoice_id);

-- Primary Keys
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_order_lines ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_invoices ADD CONSTRAINT purchase_invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_invoice_lines ADD CONSTRAINT purchase_invoice_lines_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_payments ADD CONSTRAINT purchase_payments_pkey PRIMARY KEY (id);

-- Unique Constraints
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_number_key UNIQUE (number);
ALTER TABLE public.purchase_invoices ADD CONSTRAINT purchase_invoices_number_key UNIQUE (number);

-- RLS Policies
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para todas las tablas de compras
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on purchase_order_lines" ON public.purchase_order_lines
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on purchase_invoices" ON public.purchase_invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on purchase_invoice_lines" ON public.purchase_invoice_lines
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on purchase_payments" ON public.purchase_payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.purchase_orders IS 'Órdenes de compra a proveedores';
COMMENT ON TABLE public.purchase_order_lines IS 'Líneas de órdenes de compra';
COMMENT ON TABLE public.purchase_invoices IS 'Facturas de compra de proveedores';
COMMENT ON TABLE public.purchase_invoice_lines IS 'Líneas de facturas de compra';
COMMENT ON TABLE public.purchase_payments IS 'Pagos de facturas de compra';

COMMENT ON COLUMN public.purchase_orders.supplier_id IS 'ID del proveedor (FK a tabla Supplier)';
COMMENT ON COLUMN public.purchase_orders.warehouse_id IS 'ID de la bodega destino (FK a tabla Warehouse)';
COMMENT ON COLUMN public.purchase_orders.status IS 'Estado: draft, sent, approved, received, cancelled';
COMMENT ON COLUMN public.purchase_orders.expected_delivery_date IS 'Fecha esperada de entrega';
COMMENT ON COLUMN public.purchase_orders.buyer_id IS 'ID del comprador (FK a tabla User)';
COMMENT ON COLUMN public.purchase_orders.approved_by IS 'ID del usuario que aprobó la orden';
COMMENT ON COLUMN public.purchase_orders.approved_at IS 'Fecha de aprobación';

COMMENT ON COLUMN public.purchase_invoices.status IS 'Estado: draft, sent, received, paid, cancelled';
COMMENT ON COLUMN public.purchase_invoices.due_date IS 'Fecha de vencimiento del pago';
COMMENT ON COLUMN public.purchase_invoices.buyer_id IS 'ID del comprador (FK a tabla User)';

COMMENT ON COLUMN public.purchase_invoice_lines.received_quantity IS 'Cantidad recibida vs cantidad ordenada';
COMMENT ON COLUMN public.purchase_payments.payment_method IS 'Método de pago: cash, bank_transfer, credit_card, check, etc.'; 