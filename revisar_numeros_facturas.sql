-- ===================================
-- CONSULTA: Revisar Números de Facturas
-- Fecha: $(date)
-- Propósito: Verificar números de facturas guardados
-- ===================================

-- 1. FACTURAS DE COMPRAS (purchase_invoices)
SELECT 
    'COMPRAS' as tipo_factura,
    pi.id,
    pi.invoice_number as numero_factura,
    s.name as proveedor,
    pi.invoice_date as fecha_factura,
    pi.total_amount as total,
    pi.status as estado,
    pi.payment_status as estado_pago,
    pi.created_at as creada_en
FROM purchase_invoices pi
LEFT JOIN suppliers s ON pi.supplier_id = s.id
ORDER BY pi.created_at DESC
LIMIT 20;

-- 2. FACTURAS DE VENTAS (invoices)
SELECT 
    'VENTAS' as tipo_factura,
    i.id,
    i.number as numero_factura,
    c.full_name as cliente,
    i.due_date as fecha_vencimiento,
    i.total as total,
    i.status as estado,
    i.created_at as creada_en
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
ORDER BY i.created_at DESC
LIMIT 20;

-- 3. ESTADÍSTICAS DE NÚMEROS DE FACTURAS
SELECT 
    'Facturas de Compras' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN invoice_number IS NOT NULL AND invoice_number != '' THEN 1 END) as con_numero,
    COUNT(CASE WHEN invoice_number IS NULL OR invoice_number = '' THEN 1 END) as sin_numero
FROM purchase_invoices

UNION ALL

SELECT 
    'Facturas de Ventas' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN number IS NOT NULL AND number != '' THEN 1 END) as con_numero,
    COUNT(CASE WHEN number IS NULL OR number = '' THEN 1 END) as sin_numero
FROM invoices;

-- 4. VERIFICAR DUPLICADOS EN NÚMEROS DE FACTURAS DE COMPRAS
SELECT 
    supplier_id,
    invoice_number,
    COUNT(*) as duplicados
FROM purchase_invoices
WHERE invoice_number IS NOT NULL AND invoice_number != ''
GROUP BY supplier_id, invoice_number
HAVING COUNT(*) > 1;

-- 5. VERIFICAR DUPLICADOS EN NÚMEROS DE FACTURAS DE VENTAS  
SELECT 
    number,
    COUNT(*) as duplicados
FROM invoices
WHERE number IS NOT NULL AND number != ''
GROUP BY number
HAVING COUNT(*) > 1;

-- 6. ÚLTIMOS 5 NÚMEROS DE FACTURAS POR TIPO
SELECT 
    'COMPRAS - Últimos 5' as info,
    STRING_AGG(invoice_number, ', ' ORDER BY created_at DESC) as numeros
FROM (
    SELECT invoice_number, created_at 
    FROM purchase_invoices 
    WHERE invoice_number IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 5
) as sub

UNION ALL

SELECT 
    'VENTAS - Últimos 5' as info,
    STRING_AGG(number, ', ' ORDER BY created_at DESC) as numeros
FROM (
    SELECT number, created_at 
    FROM invoices 
    WHERE number IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 5
) as sub;

-- 7. COMPARAR ID vs NÚMERO OFICIAL DE FACTURA
SELECT 
    'COMPRAS' as tipo,
    id as id_interno,
    invoice_number as numero_oficial,
    CASE 
        WHEN CAST(id AS TEXT) = invoice_number THEN '⚠️ PROBLEMA: ID = Número'
        WHEN invoice_number IS NULL THEN '❌ Sin número oficial'
        ELSE '✅ Número oficial correcto'
    END as validacion
FROM purchase_invoices
ORDER BY id DESC
LIMIT 10

UNION ALL

SELECT 
    'VENTAS' as tipo,
    id as id_interno,
    number as numero_oficial,
    CASE 
        WHEN CAST(id AS TEXT) = number THEN '⚠️ PROBLEMA: ID = Número'
        WHEN number IS NULL THEN '❌ Sin número oficial'
        ELSE '✅ Número oficial correcto'
    END as validacion
FROM invoices
ORDER BY id DESC
LIMIT 10; 