-- Verificar estructura de las tablas para identificar nombres correctos de columnas

-- 1. Verificar estructura de la tabla Product
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla ProductPOSCategory
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ProductPOSCategory' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla Warehouse_Product
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Warehouse_Product' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Listar todas las tablas que contengan "product" en el nombre
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%product%'
ORDER BY table_name;

-- 5. Verificar si existe la tabla ProductPOSCategory
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ProductPOSCategory'
) as existe_productposcategory; 