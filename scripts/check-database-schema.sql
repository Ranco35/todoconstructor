-- =====================================================
-- SCRIPT PARA VERIFICAR ESTRUCTURA DE TABLAS
-- Product y Warehouse_Product
-- =====================================================

-- 1. VER ESTRUCTURA DE LA TABLA Product
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Product' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 2. VER ESTRUCTURA DE LA TABLA Warehouse_Product
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Warehouse_Product' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 3. VER TODAS LAS TABLAS QUE CONTIENEN "product" EN EL NOMBRE
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables 
WHERE 
    table_name ILIKE '%product%' 
    AND table_schema = 'public'
ORDER BY 
    table_name;

-- 4. VER RELACIONES (FOREIGN KEYS) DE LA TABLA Product
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'Product'
    AND tc.table_schema = 'public';

-- 5. VER RELACIONES (FOREIGN KEYS) DE LA TABLA Warehouse_Product
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'Warehouse_Product'
    AND tc.table_schema = 'public';

-- 6. VER DATOS DE EJEMPLO DE Product
SELECT 
    *
FROM 
    "Product"
LIMIT 3;

-- 7. VER DATOS DE EJEMPLO DE Warehouse_Product
SELECT 
    *
FROM 
    "Warehouse_Product"
LIMIT 5;

-- 8. VER JOIN COMPLETO PARA VERIFICAR RELACIÓN
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

-- 9. VER TODAS LAS COLUMNAS CON SUS NOMBRES EXACTOS (INCLUYENDO COMILLAS)
SELECT 
    schemaname,
    tablename,
    attname AS column_name,
    format_type(atttypid, atttypmod) AS data_type,
    attnotnull AS is_not_null,
    pg_get_expr(adbin, adrelid) AS default_value
FROM 
    pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
WHERE 
    n.nspname = 'public'
    AND c.relname IN ('Product', 'Warehouse_Product')
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY 
    c.relname, 
    a.attnum; 