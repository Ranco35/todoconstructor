-- =====================================================
-- VERIFICACIÓN RÁPIDA EN SUPABASE
-- Ejecuta esto en el SQL Editor de Supabase
-- =====================================================

-- 1. VER ESTRUCTURA DE Product
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Product' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 2. VER ESTRUCTURA DE Warehouse_Product
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Warehouse_Product' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 3. VER DATOS DE Warehouse_Product
SELECT 
    *
FROM 
    "Warehouse_Product"
LIMIT 5;

-- 4. VER PRODUCTO 25 CON SUS BODEGAS
SELECT 
    p.id,
    p.name,
    p.type,
    wp."productId",
    wp."warehouseId",
    wp."quantity",
    wp."minStock",
    wp."maxStock",
    w.name AS warehouse_name
FROM 
    "Product" p
LEFT JOIN 
    "Warehouse_Product" wp ON wp."productId" = p.id
LEFT JOIN 
    "Warehouse" w ON w.id = wp."warehouseId"
WHERE 
    p.id = 25; 