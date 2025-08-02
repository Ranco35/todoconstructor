-- Script de prueba para verificar el campo isPOSEnabled

-- 1. Verificar que el campo existe
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    col_description((table_schema||'.'||table_name)::regclass, ordinal_position) as comment
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name = 'isPOSEnabled';

-- 2. Verificar productos actuales y su estado POS
SELECT 
    id,
    name,
    sku,
    "isPOSEnabled",
    CASE 
        WHEN "isPOSEnabled" = true THEN '✅ Habilitado para POS'
        WHEN "isPOSEnabled" = false THEN '❌ Deshabilitado para POS'
        ELSE '❓ Estado desconocido'
    END as estado_pos
FROM "Product" 
ORDER BY "isPOSEnabled" DESC, name;

-- 3. Contar productos por estado POS
SELECT 
    "isPOSEnabled",
    COUNT(*) as cantidad,
    CASE 
        WHEN "isPOSEnabled" = true THEN 'Habilitados para POS'
        WHEN "isPOSEnabled" = false THEN 'Deshabilitados para POS'
        ELSE 'Estado desconocido'
    END as descripcion
FROM "Product" 
GROUP BY "isPOSEnabled"
ORDER BY "isPOSEnabled" DESC;

-- 4. Verificar productos que están en POSProduct
SELECT 
    p.id,
    p.name,
    p."isPOSEnabled",
    pos.id as pos_product_id,
    pos.name as pos_product_name,
    CASE 
        WHEN p."isPOSEnabled" = true AND pos.id IS NOT NULL THEN '✅ Sincronizado'
        WHEN p."isPOSEnabled" = true AND pos.id IS NULL THEN '⚠️ Pendiente sincronización'
        WHEN p."isPOSEnabled" = false AND pos.id IS NOT NULL THEN '❌ Deshabilitado pero en POS'
        ELSE '❓ Estado inconsistente'
    END as estado_sincronizacion
FROM "Product" p
LEFT JOIN "POSProduct" pos ON p.id = pos."productId"
ORDER BY p."isPOSEnabled" DESC, p.name;

-- 5. Productos pendientes de sincronización
SELECT 
    p.id,
    p.name,
    p.sku,
    p."isPOSEnabled"
FROM "Product" p
WHERE p."isPOSEnabled" = true
AND p.id NOT IN (
    SELECT "productId" 
    FROM "POSProduct" 
    WHERE "productId" IS NOT NULL
)
ORDER BY p.name;

-- 6. Productos en POSProduct que deberían estar deshabilitados
SELECT 
    pos.id as pos_product_id,
    pos.name as pos_product_name,
    p.id as product_id,
    p.name as product_name,
    p."isPOSEnabled"
FROM "POSProduct" pos
JOIN "Product" p ON pos."productId" = p.id
WHERE p."isPOSEnabled" = false
ORDER BY p.name; 