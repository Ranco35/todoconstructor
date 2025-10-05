-- =====================================================
-- SCRIPT DE VERIFICACIÓN PARA TRANSFERENCIA
-- Verificar bodegas y categoría antes de ejecutar la transferencia
-- =====================================================

-- Paso 1: Verificar todas las bodegas disponibles
SELECT 
    'BODEGAS DISPONIBLES' as tipo,
    id,
    name,
    type,
    location,
    "isActive"
FROM "Warehouse" 
WHERE "isActive" = true
ORDER BY name;

-- Paso 2: Buscar bodegas específicas (EXT. y Bodega Conteiner)
SELECT 
    'BODEGAS OBJETIVO' as tipo,
    id,
    name,
    type,
    location,
    "isActive"
FROM "Warehouse" 
WHERE name ILIKE '%EXT%' 
   OR name ILIKE '%conteiner%'
   OR name ILIKE '%container%'
ORDER BY name;

-- Paso 3: Verificar todas las categorías disponibles
SELECT 
    'CATEGORÍAS DISPONIBLES' as tipo,
    id,
    name,
    description
FROM "Category" 
ORDER BY name;

-- Paso 4: Buscar categoría de gasfitería
SELECT 
    'CATEGORÍA GASFITERÍA' as tipo,
    id,
    name,
    description
FROM "Category" 
WHERE LOWER(name) LIKE '%gasfitería%' 
   OR LOWER(name) LIKE '%gasfiteria%'
   OR LOWER(name) LIKE '%plomería%'
   OR LOWER(name) LIKE '%plomeria%'
   OR LOWER(name) LIKE '%sanitarios%'
   OR LOWER(name) LIKE '%baño%'
   OR LOWER(name) LIKE '%bano%'
ORDER BY name;

-- Paso 5: Contar productos por categoría
SELECT 
    'PRODUCTOS POR CATEGORÍA' as tipo,
    c.id as categoria_id,
    c.name as categoria_nombre,
    COUNT(p.id) as total_productos
FROM "Category" c
LEFT JOIN "Product" p ON c.id = p."categoryid"
GROUP BY c.id, c.name
HAVING COUNT(p.id) > 0
ORDER BY total_productos DESC;

-- Paso 6: Verificar productos de gasfitería en todas las bodegas
SELECT 
    'PRODUCTOS GASFITERÍA POR BODEGA' as tipo,
    w.id as bodega_id,
    w.name as bodega_nombre,
    c.id as categoria_id,
    c.name as categoria_nombre,
    COUNT(wp.id) as total_productos,
    SUM(wp.quantity) as total_cantidad
FROM "Warehouse" w
LEFT JOIN "Warehouse_Product" wp ON w.id = wp."warehouseId"
LEFT JOIN "Product" p ON wp."productId" = p.id
LEFT JOIN "Category" c ON p."categoryid" = c.id
WHERE (LOWER(c.name) LIKE '%gasfitería%' 
   OR LOWER(c.name) LIKE '%gasfiteria%'
   OR LOWER(c.name) LIKE '%plomería%'
   OR LOWER(c.name) LIKE '%plomeria%')
GROUP BY w.id, w.name, c.id, c.name
HAVING COUNT(wp.id) > 0
ORDER BY w.name, total_productos DESC;

-- Paso 7: Detalle de productos de gasfitería en bodega EXT.
SELECT 
    'DETALLE EXT.' as tipo,
    wp.id as warehouse_product_id,
    wp."productId",
    wp."warehouseId",
    wp.quantity,
    wp."minStock",
    wp."maxStock",
    p.name as producto_nombre,
    p.sku,
    p.brand,
    c.name as categoria_nombre,
    w.name as bodega_nombre
FROM "Warehouse_Product" wp
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE w.name ILIKE '%EXT%'
  AND (LOWER(c.name) LIKE '%gasfitería%' 
   OR LOWER(c.name) LIKE '%gasfiteria%'
   OR LOWER(c.name) LIKE '%plomería%'
   OR LOWER(c.name) LIKE '%plomeria%')
ORDER BY p.name;

-- Paso 8: Detalle de productos de gasfitería en Bodega Conteiner (si existe)
SELECT 
    'DETALLE CONTEINER' as tipo,
    wp.id as warehouse_product_id,
    wp."productId",
    wp."warehouseId",
    wp.quantity,
    wp."minStock",
    wp."maxStock",
    p.name as producto_nombre,
    p.sku,
    p.brand,
    c.name as categoria_nombre,
    w.name as bodega_nombre
FROM "Warehouse_Product" wp
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE (w.name ILIKE '%conteiner%' OR w.name ILIKE '%container%')
  AND (LOWER(c.name) LIKE '%gasfitería%' 
   OR LOWER(c.name) LIKE '%gasfiteria%'
   OR LOWER(c.name) LIKE '%plomería%'
   OR LOWER(c.name) LIKE '%plomeria%')
ORDER BY p.name;

-- Paso 9: Resumen para confirmación
SELECT 
    'RESUMEN PARA TRANSFERENCIA' as tipo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "Warehouse" WHERE name ILIKE '%EXT%') 
        THEN 'Bodega EXT. encontrada'
        ELSE 'Bodega EXT. NO encontrada'
    END as bodega_origen,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "Warehouse" WHERE name ILIKE '%conteiner%' OR name ILIKE '%container%') 
        THEN 'Bodega Conteiner encontrada'
        ELSE 'Bodega Conteiner NO encontrada'
    END as bodega_destino,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "Category" WHERE LOWER(name) LIKE '%gasfitería%' OR LOWER(name) LIKE '%gasfiteria%') 
        THEN 'Categoría Gasfitería encontrada'
        ELSE 'Categoría Gasfitería NO encontrada'
    END as categoria_gasfiteria,
    (SELECT COUNT(*) 
     FROM "Warehouse_Product" wp
     JOIN "Product" p ON wp."productId" = p.id
     JOIN "Category" c ON p."categoryid" = c.id
     JOIN "Warehouse" w ON wp."warehouseId" = w.id
     WHERE w.name ILIKE '%EXT%'
       AND (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%')
    ) as productos_a_transferir;
