-- Script para insertar datos de prueba en las tablas de compras
-- IMPORTANTE: Ejecutar solo después de crear las tablas

-- 1. Insertar orden de compra de prueba
INSERT INTO public.purchase_orders (
    order_number,
    supplier_id,
    order_date,
    expected_delivery_date,
    status,
    total_amount,
    notes,
    created_by
) VALUES (
    'PO-2024-001',
    1, -- Asegúrate de que existe un supplier con ID 1
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'pending',
    150000.00,
    'Orden de prueba para verificar funcionalidad',
    1 -- Asegúrate de que existe un usuario con ID 1
) ON CONFLICT (order_number) DO NOTHING;

-- 2. Insertar factura de compra de prueba
INSERT INTO public.purchase_invoices (
    invoice_number,
    purchase_order_id,
    supplier_id,
    invoice_date,
    due_date,
    subtotal,
    tax_amount,
    total_amount,
    status,
    notes,
    created_by
) VALUES (
    'INV-2024-001',
    1, -- ID de la orden de compra creada arriba
    1, -- Mismo supplier
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    126050.42, -- Subtotal sin IVA
    23949.58,  -- IVA 19%
    150000.00, -- Total con IVA
    'pending',
    'Factura de prueba para verificar funcionalidad',
    1 -- Mismo usuario
) ON CONFLICT (invoice_number) DO NOTHING;

-- 3. Insertar pago de compra de prueba
INSERT INTO public.purchase_payments (
    payment_number,
    purchase_invoice_id,
    supplier_id,
    payment_date,
    payment_method,
    amount,
    reference_number,
    notes,
    created_by
) VALUES (
    'PAY-2024-001',
    1, -- ID de la factura creada arriba
    1, -- Mismo supplier
    CURRENT_DATE,
    'transfer',
    75000.00, -- Pago parcial
    'TRX-123456789',
    'Pago parcial de prueba',
    1 -- Mismo usuario
) ON CONFLICT (payment_number) DO NOTHING;

-- 4. Verificar datos insertados
SELECT 
    'purchase_orders' as tabla,
    COUNT(*) as total_registros
FROM public.purchase_orders
UNION ALL
SELECT 
    'purchase_invoices' as tabla,
    COUNT(*) as total_registros
FROM public.purchase_invoices
UNION ALL
SELECT 
    'purchase_payments' as tabla,
    COUNT(*) as total_registros
FROM public.purchase_payments;

-- 5. Mostrar datos de prueba
SELECT 
    'Orden de Compra' as tipo,
    order_number,
    supplier_id,
    order_date,
    status,
    total_amount
FROM public.purchase_orders
WHERE order_number = 'PO-2024-001';

SELECT 
    'Factura de Compra' as tipo,
    invoice_number,
    purchase_order_id,
    supplier_id,
    invoice_date,
    status,
    total_amount
FROM public.purchase_invoices
WHERE invoice_number = 'INV-2024-001';

SELECT 
    'Pago de Compra' as tipo,
    payment_number,
    purchase_invoice_id,
    supplier_id,
    payment_date,
    payment_method,
    amount
FROM public.purchase_payments
WHERE payment_number = 'PAY-2024-001'; 