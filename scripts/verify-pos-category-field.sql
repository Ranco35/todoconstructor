-- Script para verificar que el campo posCategoryId fue agregado correctamente
-- Ejecutar en Supabase SQL Editor o cualquier cliente PostgreSQL

-- 1. Verificar que el campo existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name = 'posCategoryId';

-- 2. Verificar la restricción de clave foránea
SELECT 
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage fkcu ON rc.unique_constraint_name = fkcu.constraint_name
WHERE kcu.table_name = 'Product' 
AND kcu.column_name = 'posCategoryId'
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Verificar los índices creados
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Product' 
AND indexname LIKE '%pos%category%';

-- 4. Verificar que las tablas POS existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('POSProductCategory', 'POSProduct', 'POSSale', 'POSSaleItem')
ORDER BY table_name;

-- 5. Contar categorías POS existentes
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_categories,
    COUNT(CASE WHEN "cashRegisterTypeId" = 2 THEN 1 END) as restaurant_categories
FROM "POSProductCategory";

-- 6. Contar productos habilitados para POS
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN "isPOSEnabled" = true THEN 1 END) as pos_enabled_products,
    COUNT(CASE WHEN "posCategoryId" IS NOT NULL THEN 1 END) as products_with_pos_category
FROM "Product";

-- 7. Mostrar algunos productos de ejemplo
SELECT 
    id,
    name,
    "isPOSEnabled",
    "posCategoryId"
FROM "Product" 
WHERE "isPOSEnabled" = true 
LIMIT 5; 