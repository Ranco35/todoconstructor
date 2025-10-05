-- =====================================================
-- SCRIPT PARA TRANSFERIR PRODUCTOS DE GASFITERÍA
-- De bodega "EXT." a "Bodega Conteiner"
-- =====================================================

-- Paso 1: Verificar que las bodegas existen
SELECT 
    id,
    name,
    type,
    location
FROM "Warehouse" 
WHERE name IN ('EXT.', 'Bodega Conteiner')
ORDER BY name;

-- Paso 2: Verificar que la categoría "Gasfitería" existe
SELECT 
    id,
    name,
    description
FROM "Category" 
WHERE LOWER(name) LIKE '%gasfitería%' OR LOWER(name) LIKE '%gasfiteria%'
ORDER BY name;

-- Paso 3: Verificar productos de gasfitería en bodega EXT.
SELECT 
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
WHERE w.name = 'EXT.'
  AND (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%')
ORDER BY p.name;

-- Paso 4: Verificar si ya existen productos de gasfitería en Bodega Conteiner
SELECT 
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
WHERE w.name = 'Bodega Conteiner'
  AND (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%')
ORDER BY p.name;

-- =====================================================
-- TRANSFERENCIA DE PRODUCTOS
-- =====================================================

-- Paso 5: Crear tabla temporal con los datos de transferencia
CREATE TEMP TABLE temp_transfer AS
SELECT 
    wp."productId",
    wp.quantity,
    wp."minStock",
    wp."maxStock",
    p.name as producto_nombre,
    p.sku
FROM "Warehouse_Product" wp
JOIN "Product" p ON wp."productId" = p.id
JOIN "Category" c ON p."categoryid" = c.id
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE w.name = 'EXT.'
  AND (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%');

-- Paso 6: Mostrar resumen de productos a transferir
SELECT 
    COUNT(*) as total_productos,
    SUM(quantity) as total_cantidad
FROM temp_transfer;

-- Paso 7: Insertar productos en Bodega Conteiner (solo si no existen)
INSERT INTO "Warehouse_Product" ("productId", "warehouseId", quantity, "minStock", "maxStock")
SELECT 
    tt."productId",
    wc.id as "warehouseId",
    tt.quantity,
    tt."minStock",
    tt."maxStock"
FROM temp_transfer tt
CROSS JOIN (SELECT id FROM "Warehouse" WHERE name = 'Bodega Conteiner') wc
WHERE NOT EXISTS (
    SELECT 1 FROM "Warehouse_Product" wp2
    WHERE wp2."productId" = tt."productId"
      AND wp2."warehouseId" = wc.id
);

-- Paso 8: Si el producto ya existe en Bodega Conteiner, sumar las cantidades
UPDATE "Warehouse_Product" 
SET quantity = "Warehouse_Product".quantity + temp_transfer.quantity,
    "updatedAt" = NOW()
FROM temp_transfer
JOIN "Warehouse" wc ON wc.name = 'Bodega Conteiner'
WHERE "Warehouse_Product"."productId" = temp_transfer."productId"
  AND "Warehouse_Product"."warehouseId" = wc.id
  AND EXISTS (
    SELECT 1 FROM "Warehouse_Product" wp2
    WHERE wp2."productId" = temp_transfer."productId"
      AND wp2."warehouseId" = wc.id
  );

-- Paso 9: Eliminar SOLO los productos de gasfitería de bodega EXT.
DELETE FROM "Warehouse_Product"
WHERE "productId" IN (
    SELECT "productId" FROM temp_transfer
)
AND "warehouseId" = (
    SELECT id FROM "Warehouse" WHERE name = 'EXT.'
);

-- Paso 10: Registrar movimientos de inventario para trazabilidad
INSERT INTO "InventoryMovement" (
    "productId",
    "fromWarehouseId",
    "toWarehouseId",
    "movementType",
    quantity,
    reason,
    notes,
    "userId",
    "createdAt"
)
SELECT 
    tt."productId",
    w_ext.id as "fromWarehouseId",
    w_cont.id as "toWarehouseId",
    'TRANSFER' as "movementType",
    tt.quantity,
    'Transferencia masiva de productos de gasfitería' as reason,
    'Script automático: Transferencia de EXT. a Bodega Conteiner' as notes,
    (SELECT id FROM "User" WHERE email = 'admin@admintermas.cl' LIMIT 1) as "userId",
    NOW() as "createdAt"
FROM temp_transfer tt
CROSS JOIN (SELECT id FROM "Warehouse" WHERE name = 'EXT.') w_ext
CROSS JOIN (SELECT id FROM "Warehouse" WHERE name = 'Bodega Conteiner') w_cont;

-- Paso 11: Verificar resultados finales
-- Productos en Bodega Conteiner después de la transferencia
SELECT 
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
WHERE w.name = 'Bodega Conteiner'
  AND (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%')
ORDER BY p.name;

-- Productos de gasfitería que quedaron en EXT. (debería estar vacío)
SELECT 
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
WHERE w.name = 'EXT.'
  AND (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%')
ORDER BY p.name;

-- Productos que quedaron en EXT. (otros productos, no gasfitería)
SELECT 
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
WHERE w.name = 'EXT.'
  AND NOT (LOWER(c.name) LIKE '%gasfitería%' OR LOWER(c.name) LIKE '%gasfiteria%')
ORDER BY c.name, p.name;

-- Limpiar tabla temporal
DROP TABLE temp_transfer;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT 
    'Transferencia completada' as estado,
    'Productos de gasfitería transferidos de EXT. a Bodega Conteiner' as descripcion,
    NOW() as fecha_ejecucion;
