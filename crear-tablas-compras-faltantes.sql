-- ================================================================
-- CREAR TABLAS DE COMPRAS FALTANTES Y ACTIVAR MÓDULO
-- ================================================================

-- 🚀 PASO 1: CREAR SECUENCIAS NECESARIAS
CREATE SEQUENCE IF NOT EXISTS purchase_payments_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_order_lines_id_seq;

-- 🚀 PASO 2: CREAR TABLA purchase_payments
CREATE TABLE IF NOT EXISTS public.purchase_payments (
    id bigint NOT NULL DEFAULT nextval('purchase_payments_id_seq'::regclass),
    invoice_id bigint NOT NULL,
    payment_date date NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'transfer',
    reference character varying(100),
    created_by character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_payments_pkey PRIMARY KEY (id)
);

-- 🚀 PASO 3: CREAR TABLA purchase_order_lines (si no existe)
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id bigint NOT NULL DEFAULT nextval('purchase_order_lines_id_seq'::regclass),
    order_id bigint NOT NULL,
    product_id bigint,
    description character varying(255) NOT NULL,
    quantity numeric(10,3) NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    subtotal numeric(15,2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent/100)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id)
);

-- 🚀 PASO 4: AGREGAR FOREIGN KEYS
DO $$ 
BEGIN
    -- FK para purchase_payments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_payments_invoice'
    ) THEN
        ALTER TABLE public.purchase_payments 
        ADD CONSTRAINT fk_purchase_payments_invoice 
        FOREIGN KEY (invoice_id) 
        REFERENCES public.purchase_invoices(id) ON DELETE CASCADE;
    END IF;

    -- FK para purchase_order_lines
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_order_lines_order'
    ) THEN
        ALTER TABLE public.purchase_order_lines 
        ADD CONSTRAINT fk_purchase_order_lines_order 
        FOREIGN KEY (order_id) 
        REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 🎯 PASO 5: INSERTAR DATOS DE PRUEBA
DO $$
DECLARE
    order_id1 bigint;
    order_id2 bigint;
    invoice_id1 bigint;
    invoice_id2 bigint;
BEGIN
    -- Crear Orden 1
    INSERT INTO public.purchase_orders (
        number, supplier_id, status, total, currency,
        expected_delivery_date, notes, payment_terms,
        created_at, updated_at
    ) VALUES (
        'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
        4, -- Proveedor real
        'approved',
        119000,
        'CLP',
        CURRENT_DATE + INTERVAL '7 days',
        'Orden de prueba para módulo compras',
        'NET 30',
        NOW(),
        NOW()
    ) RETURNING id INTO order_id1;

    -- Crear Orden 2
    INSERT INTO public.purchase_orders (
        number, supplier_id, status, total, currency,
        notes, created_at, updated_at
    ) VALUES (
        'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002',
        9, -- Segundo proveedor
        'draft',
        75000,
        'CLP',
        'Orden en borrador',
        NOW(),
        NOW()
    ) RETURNING id INTO order_id2;

    -- Crear Factura 1 (vinculada a orden 1)
    INSERT INTO public.purchase_invoices (
        number, supplier_id, order_id, status,
        total, currency, due_date, issue_date,
        notes, payment_terms, created_at, updated_at
    ) VALUES (
        'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
        4,
        order_id1,
        'received',
        119000,
        'CLP',
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE,
        'Factura vinculada a orden',
        'NET 30',
        NOW(),
        NOW()
    ) RETURNING id INTO invoice_id1;

    -- Crear Factura 2 (independiente)
    INSERT INTO public.purchase_invoices (
        number, supplier_id, status, total, currency,
        due_date, issue_date, notes, created_at, updated_at
    ) VALUES (
        'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002',
        10, -- Tercer proveedor
        'paid',
        45000,
        'CLP',
        CURRENT_DATE + INTERVAL '15 days',
        CURRENT_DATE - INTERVAL '5 days',
        'Factura independiente completa',
        NOW(),
        NOW()
    ) RETURNING id INTO invoice_id2;

    -- Crear Pago 1 (parcial de factura 1)
    INSERT INTO public.purchase_payments (
        invoice_id, payment_date, amount,
        payment_method, reference
    ) VALUES (
        invoice_id1,
        CURRENT_DATE,
        60000,
        'transfer',
        'TRF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001'
    );

    -- Crear Pago 2 (resto de factura 1)
    INSERT INTO public.purchase_payments (
        invoice_id, payment_date, amount,
        payment_method, reference
    ) VALUES (
        invoice_id1,
        CURRENT_DATE + INTERVAL '5 days',
        59000,
        'check',
        'CHK-001'
    );

    -- Crear Pago 3 (pago completo de factura 2)
    INSERT INTO public.purchase_payments (
        invoice_id, payment_date, amount,
        payment_method, reference
    ) VALUES (
        invoice_id2,
        CURRENT_DATE - INTERVAL '3 days',
        45000,
        'transfer',
        'TRF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002'
    );

    RAISE NOTICE '✅ Creados: 2 órdenes, 2 facturas, 3 pagos';
    RAISE NOTICE '🎉 MÓDULO DE COMPRAS COMPLETAMENTE ACTIVADO';
END $$;

-- 📊 VERIFICACIÓN FINAL
SELECT 
    '📊 VERIFICACIÓN FINAL' as titulo,
    'purchase_orders' as tabla,
    COUNT(*) as registros,
    COALESCE(SUM(total), 0) as total_monto
FROM public.purchase_orders
UNION ALL
SELECT 
    '',
    'purchase_invoices',
    COUNT(*),
    COALESCE(SUM(total), 0)
FROM public.purchase_invoices
UNION ALL
SELECT 
    '',
    'purchase_payments',
    COUNT(*),
    COALESCE(SUM(amount), 0)
FROM public.purchase_payments; 