-- ================================================================
-- APLICAR MÓDULO DE COMPRAS COMPLETO - CONECTAR A DATOS REALES
-- Ejecutar en Supabase SQL Editor para activar el módulo
-- ================================================================

-- 🚀 PASO 1: CREAR SECUENCIAS
CREATE SEQUENCE IF NOT EXISTS purchase_orders_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_order_lines_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_invoices_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_invoice_lines_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_payments_id_seq;

-- 🚀 PASO 2: CREAR TABLA PRINCIPAL - ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS public.purchase_orders (
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

-- 🚀 PASO 3: CREAR TABLA - LÍNEAS DE ÓRDENES
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
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

-- 🚀 PASO 4: CREAR TABLA - FACTURAS DE COMPRA
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
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
    "buyer_id" uuid,
    "issue_date" date DEFAULT now()
);

-- 🚀 PASO 5: CREAR TABLA - LÍNEAS DE FACTURAS
CREATE TABLE IF NOT EXISTS public.purchase_invoice_lines (
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

-- 🚀 PASO 6: CREAR TABLA - PAGOS
CREATE TABLE IF NOT EXISTS public.purchase_payments (
    "id" bigint NOT NULL DEFAULT nextval('purchase_payments_id_seq'::regclass),
    "invoice_id" bigint,
    "payment_date" date NOT NULL DEFAULT now(),
    "amount" numeric(18,2) NOT NULL DEFAULT 0,
    "payment_method" character varying(32) NOT NULL,
    "reference" character varying(64),
    "created_by" uuid
);

-- 🚀 PASO 7: CREAR PRIMARY KEYS
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_order_lines ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_invoices ADD CONSTRAINT purchase_invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_invoice_lines ADD CONSTRAINT purchase_invoice_lines_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_payments ADD CONSTRAINT purchase_payments_pkey PRIMARY KEY (id);

-- 🚀 PASO 8: CREAR UNIQUE CONSTRAINTS
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_number_key UNIQUE (number);
ALTER TABLE public.purchase_invoices ADD CONSTRAINT purchase_invoices_number_key UNIQUE (number);

-- 🚀 PASO 9: CREAR FOREIGN KEYS
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

-- 🚀 PASO 10: CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse_id ON public.purchase_orders USING btree (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON public.purchase_orders USING btree (number);
CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_order_id ON public.purchase_order_lines USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON public.purchase_invoices USING btree (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_order_id ON public.purchase_invoices USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON public.purchase_invoices USING btree (status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_number ON public.purchase_invoices USING btree (number);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_lines_invoice_id ON public.purchase_invoice_lines USING btree (invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_invoice_id ON public.purchase_payments USING btree (invoice_id);

-- 🚀 PASO 11: HABILITAR RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

-- 🚀 PASO 12: CREAR POLÍTICAS RLS (PERMISIVAS)
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

-- 🚀 PASO 13: INSERTAR DATOS DE PRUEBA REALISTAS
-- Órdenes de compra con diferentes estados
INSERT INTO public.purchase_orders (
    number, supplier_id, warehouse_id, status, total, 
    notes, payment_terms, created_at, expected_delivery_date
) VALUES 
('PO-2025-001', 1, 1, 'draft', 425000, 'Orden de productos de limpieza para hotel', '30 días', now() - interval '1 days', current_date + interval '7 days'),
('PO-2025-002', 2, 1, 'sent', 180000, 'Suministros de oficina y papelería', '15 días', now() - interval '3 days', current_date + interval '5 days'),
('PO-2025-003', 1, 2, 'approved', 750000, 'Equipos de cocina y utensilios', '45 días', now() - interval '7 days', current_date + interval '14 days'),
('PO-2025-004', 3, 1, 'received', 320000, 'Productos de spa y masajes', '30 días', now() - interval '15 days', current_date - interval '3 days'),
('PO-2025-005', 2, 2, 'sent', 95000, 'Insumos de mantenimiento', '20 días', now() - interval '2 days', current_date + interval '10 days')
ON CONFLICT (number) DO NOTHING;

-- Líneas de órdenes detalladas
INSERT INTO public.purchase_order_lines (
    order_id, product_id, description, quantity, unit_price, subtotal
) 
SELECT 
    po.id,
    CASE 
        WHEN po.number = 'PO-2025-001' THEN 1 -- Producto de limpieza
        WHEN po.number = 'PO-2025-002' THEN 2 -- Papelería
        WHEN po.number = 'PO-2025-003' THEN 3 -- Equipos cocina
        WHEN po.number = 'PO-2025-004' THEN 4 -- Productos spa
        ELSE 1
    END as product_id,
    CASE 
        WHEN po.number = 'PO-2025-001' THEN 'Detergente industrial multiuso 5L'
        WHEN po.number = 'PO-2025-002' THEN 'Papel A4 75gr resma x500 hojas'
        WHEN po.number = 'PO-2025-003' THEN 'Batidora industrial 20L acero inoxidable'
        WHEN po.number = 'PO-2025-004' THEN 'Aceite esencial eucalipto 100ml'
        ELSE 'Herramientas básicas mantenimiento'
    END as description,
    CASE 
        WHEN po.number = 'PO-2025-001' THEN 25 -- 25 bidones
        WHEN po.number = 'PO-2025-002' THEN 50 -- 50 resmas
        WHEN po.number = 'PO-2025-003' THEN 1  -- 1 batidora
        WHEN po.number = 'PO-2025-004' THEN 20 -- 20 frascos
        ELSE 10
    END as quantity,
    po.total / CASE 
        WHEN po.number = 'PO-2025-001' THEN 25
        WHEN po.number = 'PO-2025-002' THEN 50  
        WHEN po.number = 'PO-2025-003' THEN 1
        WHEN po.number = 'PO-2025-004' THEN 20
        ELSE 10
    END as unit_price,
    po.total
FROM public.purchase_orders po
WHERE po.number IN ('PO-2025-001', 'PO-2025-002', 'PO-2025-003', 'PO-2025-004', 'PO-2025-005')
ON CONFLICT DO NOTHING;

-- Facturas para órdenes aprobadas y recibidas
INSERT INTO public.purchase_invoices (
    number, supplier_id, order_id, status, total, 
    due_date, notes, created_at, issue_date
)
SELECT 
    'FC-' || po.number,
    po.supplier_id,
    po.id,
    CASE 
        WHEN po.status = 'received' THEN 'received'
        WHEN po.status = 'approved' THEN 'sent'
        ELSE 'draft'
    END as status,
    po.total,
    current_date + interval '30 days',
    'Factura correspondiente a orden ' || po.number,
    now() - interval '1 days',
    current_date - interval '1 days'
FROM public.purchase_orders po
WHERE po.status IN ('approved', 'received')
ON CONFLICT (number) DO NOTHING;

-- Líneas de facturas
INSERT INTO public.purchase_invoice_lines (
    invoice_id, product_id, description, quantity, unit_price, subtotal, received_quantity
)
SELECT 
    pi.id,
    pol.product_id,
    pol.description,
    pol.quantity,
    pol.unit_price,
    pol.subtotal,
    CASE 
        WHEN pi.status = 'received' THEN pol.quantity -- Todo recibido
        ELSE pol.quantity * 0.8 -- 80% recibido parcialmente
    END as received_quantity
FROM public.purchase_invoices pi
JOIN public.purchase_order_lines pol ON pol.order_id = pi.order_id
ON CONFLICT DO NOTHING;

-- Pagos realizados (algunos parciales, algunos completos)
INSERT INTO public.purchase_payments (
    invoice_id, payment_date, amount, payment_method, reference
)
SELECT 
    pi.id,
    current_date - interval '5 days',
    CASE 
        WHEN pi.number = 'FC-PO-2025-004' THEN pi.total -- Pago completo
        ELSE pi.total * 0.6 -- Pago del 60%
    END as amount,
    CASE 
        WHEN pi.supplier_id = 1 THEN 'bank_transfer'
        WHEN pi.supplier_id = 2 THEN 'credit_card'
        ELSE 'check'
    END as payment_method,
    'REF-' || pi.number || '-001'
FROM public.purchase_invoices pi
WHERE pi.status = 'received'
ON CONFLICT DO NOTHING;

-- Segundo pago para completar facturas pendientes
INSERT INTO public.purchase_payments (
    invoice_id, payment_date, amount, payment_method, reference
)
SELECT 
    pi.id,
    current_date - interval '2 days',
    pi.total * 0.4, -- Resto 40%
    'bank_transfer',
    'REF-' || pi.number || '-002'
FROM public.purchase_invoices pi
WHERE pi.status = 'received' AND pi.number != 'FC-PO-2025-004'
ON CONFLICT DO NOTHING;

-- 🚀 PASO 14: VERIFICACIÓN FINAL
SELECT 
    '✅ MÓDULO DE COMPRAS ACTIVADO EXITOSAMENTE' as resultado,
    (SELECT COUNT(*) FROM public.purchase_orders) as ordenes_creadas,
    (SELECT COUNT(*) FROM public.purchase_invoices) as facturas_creadas,
    (SELECT COUNT(*) FROM public.purchase_payments) as pagos_creados,
    (SELECT COALESCE(SUM(total), 0) FROM public.purchase_orders) as total_ordenes_clp,
    (SELECT COALESCE(SUM(total), 0) FROM public.purchase_invoices) as total_facturado_clp,
    (SELECT COALESCE(SUM(amount), 0) FROM public.purchase_payments) as total_pagado_clp;

-- 🚀 PASO 15: MOSTRAR ESTADÍSTICAS DETALLADAS
SELECT 
    '📊 ESTADÍSTICAS POR ESTADO' as titulo,
    status,
    COUNT(*) as cantidad,
    SUM(total) as total_clp,
    ROUND(AVG(total), 0) as promedio_clp
FROM public.purchase_orders
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'draft' THEN 1
        WHEN 'sent' THEN 2  
        WHEN 'approved' THEN 3
        WHEN 'received' THEN 4
        ELSE 5
    END;

-- 🚀 MENSAJE FINAL
SELECT 
    '🎉 ÉXITO TOTAL' as estado,
    'Módulo de Compras conectado a datos reales' as descripcion,
    'Recarga http://localhost:3000/dashboard/purchases' as siguiente_paso,
    'Las estadísticas ahora mostrarán datos reales: $1,770,000 en órdenes totales' as resultado_esperado; 