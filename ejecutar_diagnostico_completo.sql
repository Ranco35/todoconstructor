-- Ejecutar TODOS los pasos del diagnóstico para identificar el problema

-- Paso 1: Verificar nombres exactos de bodegas
SELECT 
    'PASO 1 - BODEGAS EXACTAS' as tipo,
    id,
    name,
    type,
    location
FROM "Warehouse" 
ORDER BY name;

-- Paso 2: Buscar categorías que contengan "gasfitería"
SELECT 
    'PASO 2 - CATEGORIAS GASFITERIA' as tipo,
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
   OR LOWER(name) LIKE '%fontanería%'
   OR LOWER(name) LIKE '%fontaneria%'
ORDER BY name;

-- Paso 3: Verificar productos en bodega EXT. por categoría
SELECT 
    'PASO 3 - PRODUCTOS EN EXT POR CATEGORIA' as tipo,
    w.name as bodega_nombre,
    c.id as categoria_id,
    c.name as categoria_nombre,
    COUNT(wp.id) as total_productos,
    SUM(wp.quantity) as total_cantidad
FROM "Warehouse" w
JOIN "Warehouse_Product" wp ON w.id = wp."warehouseId"
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
WHERE w.name = 'Bodega EXT.'
GROUP BY w.id, w.name, c.id, c.name
ORDER BY total_productos DESC
LIMIT 10;

-- Paso 4: Verificar productos específicos de gasfitería en EXT.
SELECT 
    'PASO 4 - PRODUCTOS GASFITERIA EN EXT' as tipo,
    wp.id as warehouse_product_id,
    wp."productId",
    wp.quantity,
    p.name as producto_nombre,
    p.sku,
    c.name as categoria_nombre
FROM "Warehouse_Product" wp
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE w.name = 'Bodega EXT.'
  AND (LOWER(c.name) LIKE '%gasfitería%' 
   OR LOWER(c.name) LIKE '%gasfiteria%'
   OR LOWER(c.name) LIKE '%plomería%'
   OR LOWER(c.name) LIKE '%plomeria%'
   OR LOWER(c.name) LIKE '%sanitarios%'
   OR LOWER(c.name) LIKE '%baño%'
   OR LOWER(c.name) LIKE '%bano%'
   OR LOWER(c.name) LIKE '%fontanería%'
   OR LOWER(c.name) LIKE '%fontaneria%')
ORDER BY p.name
LIMIT 5;

-- Paso 5: Si no hay productos de gasfitería, mostrar todas las categorías en EXT.
SELECT 
    'PASO 5 - TODAS LAS CATEGORIAS EN EXT' as tipo,
    c.id as categoria_id,
    c.name as categoria_nombre,
    COUNT(wp.id) as total_productos,
    SUM(wp.quantity) as total_cantidad
FROM "Warehouse_Product" wp
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE w.name = 'Bodega EXT.'
GROUP BY c.id, c.name
ORDER BY total_productos DESC;
