-- Script para verificar si la tabla POSProduct existe y tiene datos del producto 1146

-- 1. Verificar si existe la tabla POSProduct
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'POSProduct';

-- 2. Verificar estructura de la tabla POSProduct
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'POSProduct'
ORDER BY ordinal_position;

-- 3. Verificar si hay datos en POSProduct
SELECT 
    COUNT(*) as total_productos_pos
FROM "POSProduct";

-- 4. Buscar específicamente el producto 1146 en POSProduct
SELECT 
    *
FROM "POSProduct" 
WHERE "productId" = 1146;

-- 5. Si no existe, verificar todos los productos POS
SELECT 
    id,
    name,
    price,
    "productId",
    "categoryId"
FROM "POSProduct" 
LIMIT 10; 