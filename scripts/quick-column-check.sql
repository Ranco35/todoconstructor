-- =====================================================
-- VERIFICACIÓN RÁPIDA DE NOMBRES DE COLUMNAS
-- =====================================================

-- 1. VER COLUMNAS DE Product
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Product' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 2. VER COLUMNAS DE Warehouse_Product
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Warehouse_Product' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 3. VER DATOS DE EJEMPLO DE Warehouse_Product
SELECT 
    *
FROM 
    "Warehouse_Product"
LIMIT 3;

-- 4. VER JOIN COMPLETO CON NOMBRES CORRECTOS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.type AS product_type,
    wp."id" AS warehouse_product_id,
    wp."productId" AS wp_product_id,
    wp."warehouseId" AS wp_warehouse_id,
    wp."quantity" AS wp_quantity,
    wp."minStock" AS wp_min_stock,
    wp."maxStock" AS wp_max_stock,
    w.name AS warehouse_name
FROM 
    "Product" p
LEFT JOIN 
    "Warehouse_Product" wp ON wp."productId" = p.id
LEFT JOIN 
    "Warehouse" w ON w.id = wp."warehouseId"
WHERE 
    p.id = 25
ORDER BY 
    wp."warehouseId"; 