-- Script para verificar productos que están en facturas
-- Este script ayuda a identificar productos que NO se pueden eliminar

-- 1. Verificar productos en facturas de ventas
SELECT 
    'FACTURAS DE VENTAS' as tipo_factura,
    COUNT(DISTINCT il.product_id) as productos_unicos,
    COUNT(*) as total_lineas
FROM invoice_lines il
WHERE il.product_id IS NOT NULL;

-- 2. Verificar productos en facturas de compras  
SELECT 
    'FACTURAS DE COMPRAS' as tipo_factura,
    COUNT(DISTINCT pil.product_id) as productos_unicos,
    COUNT(*) as total_lineas
FROM purchase_invoice_lines pil
WHERE pil.product_id IS NOT NULL;

-- 3. Lista detallada de productos en facturas de ventas
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(il.id) as cantidad_lineas_facturas,
    COUNT(DISTINCT il.invoice_id) as facturas_diferentes,
    MIN(i.created_at)::date as primera_factura,
    MAX(i.created_at)::date as ultima_factura,
    'VENTAS' as tipo
FROM "Product" p
INNER JOIN invoice_lines il ON p.id = il.product_id
INNER JOIN invoices i ON il.invoice_id = i.id
GROUP BY p.id, p.name
ORDER BY cantidad_lineas_facturas DESC
LIMIT 20;

-- 4. Lista detallada de productos en facturas de compras
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(pil.id) as cantidad_lineas_facturas,
    COUNT(DISTINCT pil.purchase_invoice_id) as facturas_diferentes,
    MIN(pi.created_at)::date as primera_factura,
    MAX(pi.created_at)::date as ultima_factura,
    'COMPRAS' as tipo
FROM "Product" p
INNER JOIN purchase_invoice_lines pil ON p.id = pil.product_id
INNER JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
GROUP BY p.id, p.name
ORDER BY cantidad_lineas_facturas DESC
LIMIT 20;

-- 5. Productos que están en AMBOS tipos de facturas
SELECT 
    p.id as product_id,
    p.name as product_name,
    COALESCE(ventas.lineas_ventas, 0) as lineas_facturas_ventas,
    COALESCE(compras.lineas_compras, 0) as lineas_facturas_compras,
    (COALESCE(ventas.lineas_ventas, 0) + COALESCE(compras.lineas_compras, 0)) as total_lineas
FROM "Product" p
LEFT JOIN (
    SELECT product_id, COUNT(*) as lineas_ventas
    FROM invoice_lines 
    WHERE product_id IS NOT NULL
    GROUP BY product_id
) ventas ON p.id = ventas.product_id
LEFT JOIN (
    SELECT product_id, COUNT(*) as lineas_compras
    FROM purchase_invoice_lines 
    WHERE product_id IS NOT NULL
    GROUP BY product_id
) compras ON p.id = compras.product_id
WHERE ventas.product_id IS NOT NULL OR compras.product_id IS NOT NULL
ORDER BY total_lineas DESC
LIMIT 30;

-- 6. Productos "eliminables" - que NO están en facturas
SELECT 
    'PRODUCTOS ELIMINABLES (sin facturas)' as categoria,
    COUNT(*) as cantidad
FROM "Product" p
LEFT JOIN invoice_lines il ON p.id = il.product_id
LEFT JOIN purchase_invoice_lines pil ON p.id = pil.product_id
WHERE il.product_id IS NULL AND pil.product_id IS NULL;

-- 7. Productos "protegidos" - que SÍ están en facturas
SELECT 
    'PRODUCTOS PROTEGIDOS (con facturas)' as categoria,
    COUNT(DISTINCT p.id) as cantidad
FROM "Product" p
LEFT JOIN invoice_lines il ON p.id = il.product_id
LEFT JOIN purchase_invoice_lines pil ON p.id = pil.product_id
WHERE il.product_id IS NOT NULL OR pil.product_id IS NOT NULL;

-- 8. Estados de facturas que contienen productos
SELECT 
    i.status,
    COUNT(DISTINCT il.product_id) as productos_unicos,
    COUNT(*) as lineas_facturas,
    'VENTAS' as tipo_factura
FROM invoices i
INNER JOIN invoice_lines il ON i.id = il.invoice_id
WHERE il.product_id IS NOT NULL
GROUP BY i.status

UNION ALL

SELECT 
    pi.status,
    COUNT(DISTINCT pil.product_id) as productos_unicos,
    COUNT(*) as lineas_facturas,
    'COMPRAS' as tipo_factura
FROM purchase_invoices pi
INNER JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
WHERE pil.product_id IS NOT NULL
GROUP BY pi.status

ORDER BY tipo_factura, status;

-- 9. Resumen ejecutivo
SELECT 
    'RESUMEN EJECUTIVO' as seccion,
    'Total productos en sistema' as descripcion,
    COUNT(*) as cantidad
FROM "Product"

UNION ALL

SELECT 
    'RESUMEN EJECUTIVO' as seccion,
    'Productos en facturas (PROTEGIDOS)' as descripcion,
    COUNT(DISTINCT p.id) as cantidad
FROM "Product" p
LEFT JOIN invoice_lines il ON p.id = il.product_id
LEFT JOIN purchase_invoice_lines pil ON p.id = pil.product_id
WHERE il.product_id IS NOT NULL OR pil.product_id IS NOT NULL

UNION ALL

SELECT 
    'RESUMEN EJECUTIVO' as seccion,
    'Productos sin facturas (ELIMINABLES)' as descripcion,
    COUNT(*) as cantidad
FROM "Product" p
LEFT JOIN invoice_lines il ON p.id = il.product_id
LEFT JOIN purchase_invoice_lines pil ON p.id = pil.product_id
WHERE il.product_id IS NULL AND pil.product_id IS NULL

ORDER BY seccion, descripcion; 