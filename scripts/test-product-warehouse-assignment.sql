-- Script para asignar bodega a producto sin bodega asignada
-- Fecha: 2025-01-05

-- 1. Encontrar producto "Cloro gel bidón 5L" (ID 292)
SELECT 
  p.id,
  p.name,
  p.sku,
  p.type
FROM "Product" p
WHERE p.id = 292;

-- 2. Verificar que no tenga bodega asignada
SELECT 
  wp.id,
  wp."productId",
  wp."warehouseId"
FROM "Warehouse_Product" wp
WHERE wp."productId" = 292;

-- 3. Obtener primera bodega disponible
SELECT 
  id,
  name,
  type,
  "isActive"
FROM "Warehouse"
WHERE "isActive" = true
ORDER BY id
LIMIT 1;

-- 4. Asignar bodega al producto
INSERT INTO "Warehouse_Product" (
  "productId",
  "warehouseId", 
  quantity,
  "minStock",
  "maxStock",
  "createdAt",
  "updatedAt"
)
SELECT 
  292,
  w.id,
  0,
  0,
  100,
  NOW(),
  NOW()
FROM "Warehouse" w
WHERE w."isActive" = true
ORDER BY w.id
LIMIT 1
ON CONFLICT ("productId", "warehouseId") DO UPDATE SET
  "updatedAt" = NOW();

-- 5. Verificar que se asignó correctamente
SELECT 
  p.id as producto_id,
  p.name as producto_nombre,
  wp."warehouseId" as bodega_id,
  w.name as bodega_nombre,
  wp.quantity,
  wp."minStock",
  wp."maxStock"
FROM "Product" p
JOIN "Warehouse_Product" wp ON p.id = wp."productId"
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE p.id = 292;

-- RESULTADO ESPERADO:
-- El producto debería tener una bodega asignada
-- Ahora puedes probar editar el producto en el frontend 