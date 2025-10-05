-- =====================================================
-- SCRIPT CORREGIDO PARA TRANSFERIR PRODUCTOS DE GASFITERÍA
-- De "Bodega EXT." a "Conteiner" (nombres exactos)
-- =====================================================

-- Paso 1: Verificar nombres exactos de bodegas
SELECT 
    'BODEGAS EXACTAS' as tipo,
    id,
    name,
    type,
    location
FROM "Warehouse" 
WHERE name IN ('Bodega EXT.', 'Conteiner', 'Bodega Principal')
ORDER BY name;

-- Paso 2: Buscar categoría de gasfitería (todas las variantes)
SELECT 
    'CATEGORIA GASFITERIA' as tipo,
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

-- Paso 3: Crear tabla temporal con productos de gasfitería de "Bodega EXT."
CREATE TEMP TABLE temp_transfer_gasfiteria AS
SELECT 
    wp."productId",
    wp.quantity,
    wp."minStock",
    wp."maxStock",
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
   OR LOWER(c.name) LIKE '%fontaneria%');

-- Paso 4: Mostrar productos encontrados para transferir
SELECT 
    'PRODUCTOS A TRANSFERIR' as tipo,
    COUNT(*) as total_productos,
    SUM(quantity) as total_cantidad
FROM temp_transfer_gasfiteria;

-- Paso 5: Mostrar detalle de productos a transferir
SELECT 
    'DETALLE TRANSFERENCIA' as tipo,
    "productId",
    producto_nombre,
    sku,
    categoria_nombre,
    quantity
FROM temp_transfer_gasfiteria
ORDER BY producto_nombre;

-- Paso 6: Insertar productos en "Conteiner" (solo si no existen)
INSERT INTO "Warehouse_Product" ("productId", "warehouseId", quantity, "minStock", "maxStock")
SELECT 
    tt."productId",
    wc.id as "warehouseId",
    tt.quantity,
    tt."minStock",
    tt."maxStock"
FROM temp_transfer_gasfiteria tt
CROSS JOIN (SELECT id FROM "Warehouse" WHERE name = 'Conteiner') wc
WHERE NOT EXISTS (
    SELECT 1 FROM "Warehouse_Product" wp2
    WHERE wp2."productId" = tt."productId"
      AND wp2."warehouseId" = wc.id
);

-- Paso 7: Si el producto ya existe en "Conteiner", sumar las cantidades
UPDATE "Warehouse_Product" 
SET quantity = "Warehouse_Product".quantity + temp_transfer_gasfiteria.quantity,
    "updatedAt" = NOW()
FROM temp_transfer_gasfiteria
JOIN "Warehouse" wc ON wc.name = 'Conteiner'
WHERE "Warehouse_Product"."productId" = temp_transfer_gasfiteria."productId"
  AND "Warehouse_Product"."warehouseId" = wc.id
  AND EXISTS (
    SELECT 1 FROM "Warehouse_Product" wp2
    WHERE wp2."productId" = temp_transfer_gasfiteria."productId"
      AND wp2."warehouseId" = wc.id
  );

-- Paso 8: Eliminar productos de gasfitería de "Bodega EXT."
DELETE FROM "Warehouse_Product"
WHERE "productId" IN (
    SELECT "productId" FROM temp_transfer_gasfiteria
)
AND "warehouseId" = (
    SELECT id FROM "Warehouse" WHERE name = 'Bodega EXT.'
);

-- Paso 9: Registrar movimientos de inventario para trazabilidad
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
    'Script corregido: Transferencia de Bodega EXT. a Conteiner' as notes,
    (SELECT id FROM "User" WHERE email = 'admin@admintermas.cl' LIMIT 1) as "userId",
    NOW() as "createdAt"
FROM temp_transfer_gasfiteria tt
CROSS JOIN (SELECT id FROM "Warehouse" WHERE name = 'Bodega EXT.') w_ext
CROSS JOIN (SELECT id FROM "Warehouse" WHERE name = 'Conteiner') w_cont;

-- Paso 10: Verificar resultados finales
-- Productos en "Conteiner" después de la transferencia
SELECT 
    'RESULTADO EN CONTEINER' as tipo,
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
WHERE w.name = 'Conteiner'
ORDER BY p.name;

-- Productos de gasfitería que quedaron en "Bodega EXT." (debería estar vacío)
SELECT 
    'GASFITERIA EN EXT DESPUES' as tipo,
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
WHERE w.name = 'Bodega EXT.'
  AND (LOWER(c.name) LIKE '%gasfitería%' 
   OR LOWER(c.name) LIKE '%gasfiteria%'
   OR LOWER(c.name) LIKE '%plomería%'
   OR LOWER(c.name) LIKE '%plomeria%')
ORDER BY p.name;

-- Resumen final por bodega
SELECT 
    'RESUMEN FINAL' as tipo,
    w.name as bodega_nombre,
    COUNT(wp.id) as total_productos,
    SUM(wp.quantity) as total_cantidad
FROM "Warehouse" w
LEFT JOIN "Warehouse_Product" wp ON w.id = wp."warehouseId"
WHERE w.name IN ('Bodega EXT.', 'Conteiner', 'Bodega Principal')
GROUP BY w.id, w.name
ORDER BY w.name;

-- Limpiar tabla temporal
DROP TABLE temp_transfer_gasfiteria;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT 
    'Transferencia corregida completada' as estado,
    'Productos de gasfitería transferidos de Bodega EXT. a Conteiner' as descripcion,
    NOW() as fecha_ejecucion;
