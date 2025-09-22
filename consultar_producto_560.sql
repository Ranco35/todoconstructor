-- =====================================================
-- Script para consultar producto ID: 560
-- Copiar y pegar este contenido en el SQL Editor de Supabase
-- =====================================================

-- 1. Consultar datos básicos del producto
SELECT 
    '=== DATOS BÁSICOS DEL PRODUCTO ===' as seccion,
    p.id,
    p.name,
    p.sku,
    p.description,
    p.costprice,
    p.saleprice,
    p."finalPrice",
    p.vat,
    p."isActive",
    p."isForSale",
    p.type,
    p.brand,
    p."salesUnitId",
    p."purchaseUnitId",
    p."categoryId",
    p."supplierId",
    p."createdAt",
    p."updatedAt"
FROM "Product" p
WHERE p.id = 560;

-- 2. Consultar stock del producto
SELECT 
    '=== STOCK DEL PRODUCTO ===' as seccion,
    wp.id as warehouse_product_id,
    wp."warehouseId",
    wp."productId",
    wp.quantity,
    wp."minStock",
    wp."maxStock",
    wp."createdAt",
    wp."updatedAt",
    w.name as warehouse_name
FROM "Warehouse_Product" wp
LEFT JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE wp."productId" = 560;

-- 3. Consultar categoría del producto
SELECT 
    '=== CATEGORÍA DEL PRODUCTO ===' as seccion,
    c.id as category_id,
    c.name as category_name,
    c.description as category_description,
    c."isActive" as category_active
FROM "Product" p
LEFT JOIN "Category" c ON p."categoryId" = c.id
WHERE p.id = 560;

-- 4. Consultar proveedor del producto
SELECT 
    '=== PROVEEDOR DEL PRODUCTO ===' as seccion,
    s.id as supplier_id,
    s.name as supplier_name,
    s.email as supplier_email,
    s.phone as supplier_phone,
    s."isActive" as supplier_active
FROM "Product" p
LEFT JOIN "Supplier" s ON p."supplierId" = s.id
WHERE p.id = 560;

-- 5. Consultar unidades del producto
SELECT 
    '=== UNIDADES DEL PRODUCTO ===' as seccion,
    p.id as product_id,
    p.name as product_name,
    su.id as sales_unit_id,
    su.name as sales_unit_name,
    su.symbol as sales_unit_symbol,
    pu.id as purchase_unit_id,
    pu.name as purchase_unit_name,
    pu.symbol as purchase_unit_symbol
FROM "Product" p
LEFT JOIN "Unit" su ON p."salesUnitId" = su.id
LEFT JOIN "Unit" pu ON p."purchaseUnitId" = pu.id
WHERE p.id = 560;

-- 6. Consultar historial de precios (si existe)
SELECT 
    '=== HISTORIAL DE PRECIOS ===' as seccion,
    ph.id,
    ph."productId",
    ph."oldCostPrice",
    ph."newCostPrice",
    ph."oldSalePrice",
    ph."newSalePrice",
    ph."oldFinalPrice",
    ph."newFinalPrice",
    ph."changeReason",
    ph."changedBy",
    ph."changedAt"
FROM "PriceHistory" ph
WHERE ph."productId" = 560
ORDER BY ph."changedAt" DESC
LIMIT 10;

-- 7. Verificar si existen triggers activos en la tabla Product
SELECT 
    '=== TRIGGERS ACTIVOS ===' as seccion,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'Product'
ORDER BY trigger_name;

-- 8. Consultar estructura de la tabla Product
SELECT 
    '=== ESTRUCTURA TABLA PRODUCT ===' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;
