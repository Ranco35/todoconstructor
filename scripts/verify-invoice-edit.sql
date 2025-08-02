-- Script para verificar que las facturas tienen todos los datos necesarios para la edición

-- 1. Verificar datos completos de las facturas
SELECT 
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial_proveedor,
    supplier_id,
    warehouse_id,
    issue_date,
    due_date,
    subtotal,
    tax_amount,
    total,
    status,
    notes,
    created_at
FROM purchase_invoices 
WHERE id IN (5, 6)
ORDER BY id;

-- 2. Verificar líneas de las facturas
SELECT 
    pil.id,
    pil.purchase_invoice_id,
    pil.product_id,
    pil.description,
    pil.quantity,
    pil.unit_price,
    pil.line_total,
    pil.tax_amount,
    pil.discount_percent,
    pil.line_order,
    p.name as producto_nombre,
    p.type as producto_tipo
FROM purchase_invoice_lines pil
LEFT JOIN "Product" p ON pil.product_id = p.id
WHERE pil.purchase_invoice_id IN (5, 6)
ORDER BY pil.purchase_invoice_id, pil.line_order;

-- 3. Verificar proveedores
SELECT 
    s.id,
    s.name as proveedor_nombre,
    s.vat as rut,
    s.email,
    s.phone
FROM "Supplier" s
WHERE s.id IN (
    SELECT DISTINCT supplier_id 
    FROM purchase_invoices 
    WHERE id IN (5, 6)
);

-- 4. Verificar bodegas
SELECT 
    w.id,
    w.name as bodega_nombre,
    w.location as ubicacion
FROM "Warehouse" w
WHERE w.id IN (
    SELECT DISTINCT warehouse_id 
    FROM purchase_invoices 
    WHERE id IN (5, 6)
);

-- 5. Resumen de verificación
SELECT 
    'Facturas principales' as tipo,
    COUNT(*) as cantidad
FROM purchase_invoices 
WHERE id IN (5, 6)

UNION ALL

SELECT 
    'Líneas de facturas' as tipo,
    COUNT(*) as cantidad
FROM purchase_invoice_lines 
WHERE purchase_invoice_id IN (5, 6)

UNION ALL

SELECT 
    'Proveedores' as tipo,
    COUNT(DISTINCT supplier_id) as cantidad
FROM purchase_invoices 
WHERE id IN (5, 6)

UNION ALL

SELECT 
    'Bodegas' as tipo,
    COUNT(DISTINCT warehouse_id) as cantidad
FROM purchase_invoices 
WHERE id IN (5, 6); 