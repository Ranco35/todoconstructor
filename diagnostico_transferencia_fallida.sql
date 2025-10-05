-- =====================================================
-- DIAGNÓSTICO DE TRANSFERENCIA FALLIDA
-- Verificar por qué no se transfirieron los productos
-- =====================================================

-- Paso 1: Verificar que las bodegas existen con los nombres exactos
SELECT 
    'VERIFICACION BODEGAS' as tipo,
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

-- Paso 2: Verificar categorías que contengan "gasfitería"
SELECT 
    'CATEGORIAS GASFITERIA' as tipo,
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

-- Paso 3: Verificar productos en bodega EXT. por categoría
SELECT 
    'PRODUCTOS EN EXT POR CATEGORIA' as tipo,
    w.name as bodega_nombre,
    c.id as categoria_id,
    c.name as categoria_nombre,
    COUNT(wp.id) as total_productos,
    SUM(wp.quantity) as total_cantidad
FROM "Warehouse" w
JOIN "Warehouse_Product" wp ON w.id = wp."warehouseId"
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
WHERE w.name ILIKE '%EXT%'
GROUP BY w.id, w.name, c.id, c.name
ORDER BY total_productos DESC;

-- Paso 4: Verificar productos específicos de gasfitería en EXT.
SELECT 
    'PRODUCTOS GASFITERIA EN EXT' as tipo,
    wp.id as warehouse_product_id,
    wp."productId",
    wp."warehouseId",
    wp.quantity,
    p.name as producto_nombre,
    p.sku,
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

-- Paso 5: Verificar productos en bodega Conteiner
SELECT 
    'PRODUCTOS EN CONTEINER' as tipo,
    wp.id as warehouse_product_id,
    wp."productId",
    wp."warehouseId",
    wp.quantity,
    p.name as producto_nombre,
    p.sku,
    c.name as categoria_nombre,
    w.name as bodega_nombre
FROM "Warehouse_Product" wp
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE w.name ILIKE '%conteiner%' OR w.name ILIKE '%container%'
ORDER BY p.name;

-- Paso 6: Verificar si existen movimientos de inventario recientes
SELECT 
    'MOVIMIENTOS RECIENTES' as tipo,
    im.id,
    im."productId",
    im."fromWarehouseId",
    im."toWarehouseId",
    im."movementType",
    im.quantity,
    im.reason,
    im."createdAt",
    w1.name as bodega_origen,
    w2.name as bodega_destino,
    p.name as producto_nombre
FROM "InventoryMovement" im
LEFT JOIN "Warehouse" w1 ON im."fromWarehouseId" = w1.id
LEFT JOIN "Warehouse" w2 ON im."toWarehouseId" = w2.id
LEFT JOIN "Product" p ON im."productId" = p.id
WHERE im."createdAt" >= NOW() - INTERVAL '1 hour'
ORDER BY im."createdAt" DESC;

-- Paso 7: Verificar todas las categorías para encontrar la correcta
SELECT 
    'TODAS LAS CATEGORIAS' as tipo,
    id,
    name,
    description,
    (SELECT COUNT(*) FROM "Product" WHERE "categoryid" = c.id) as total_productos
FROM "Category" c
ORDER BY name;

-- Paso 8: Contar productos totales por bodega
SELECT 
    'RESUMEN POR BODEGA' as tipo,
    w.id,
    w.name as bodega_nombre,
    COUNT(wp.id) as total_productos,
    SUM(wp.quantity) as total_cantidad
FROM "Warehouse" w
LEFT JOIN "Warehouse_Product" wp ON w.id = wp."warehouseId"
GROUP BY w.id, w.name
ORDER BY w.name;
