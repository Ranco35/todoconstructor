-- =====================================================
-- 🔍 DEBUG FACTURA FC250801-0001 - SERVICIOS
-- =====================================================

-- 1️⃣ DATOS BÁSICOS DE LA FACTURA
SELECT 
    id,
    number as numero_factura,
    status as estado,
    warehouse_id as bodega_asignada,
    total
FROM purchase_invoices 
WHERE number = 'FC250801-0001';

-- 2️⃣ LÍNEAS DE LA FACTURA 
SELECT 
    pil.id as linea_id,
    pil.product_id,
    pil.description as descripcion,
    pil.quantity as cantidad,
    pil.unit_price as precio_unitario
FROM purchase_invoice_lines pil
JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
WHERE pi.number = 'FC250801-0001';

-- 3️⃣ ANÁLISIS DE SERVICIOS POR DESCRIPCIÓN
SELECT 
    pil.description as descripcion,
    CASE 
        WHEN LOWER(pil.description) LIKE '%servicio%' THEN '✅ ES SERVICIO'
        WHEN LOWER(pil.description) LIKE '%control%' THEN '✅ ES SERVICIO'  
        WHEN LOWER(pil.description) LIKE '%plaga%' THEN '✅ ES SERVICIO'
        WHEN LOWER(pil.description) LIKE '%fumigacion%' THEN '✅ ES SERVICIO'
        WHEN LOWER(pil.description) LIKE '%mantenimiento%' THEN '✅ ES SERVICIO'
        ELSE '❌ NO ES SERVICIO'
    END as tipo_detectado
FROM purchase_invoice_lines pil
JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
WHERE pi.number = 'FC250801-0001';

-- 4️⃣ VERIFICAR SI TIENE PRODUCTOS VINCULADOS
SELECT 
    CASE 
        WHEN pil.product_id IS NOT NULL THEN 'TIENE PRODUCTO VINCULADO'
        ELSE 'NO TIENE PRODUCTO VINCULADO'
    END as estado_vinculacion,
    pil.product_id,
    pil.description
FROM purchase_invoice_lines pil
JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
WHERE pi.number = 'FC250801-0001';

-- 5️⃣ CONCLUSIÓN FINAL
SELECT 
    '🎯 CONCLUSIÓN PARA FC250801-0001' as titulo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM purchase_invoice_lines pil
            JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
            WHERE pi.number = 'FC250801-0001'
            AND (
                LOWER(pil.description) LIKE '%servicio%' OR
                LOWER(pil.description) LIKE '%control%' OR
                LOWER(pil.description) LIKE '%plaga%' OR
                LOWER(pil.description) LIKE '%fumigacion%' OR
                LOWER(pil.description) LIKE '%mantenimiento%'
            )
        ) THEN '✅ ES SERVICIO - NO DEBE REQUERIR BODEGA'
        ELSE '❌ NO ES SERVICIO - REQUIERE BODEGA'
    END as resultado;