-- Script para probar la corrección del problema de edición de bodegas en productos
-- Fecha: 2025-01-05
-- Problema: Cuando se edita un producto online, no se guarda la bodega del producto

-- 1. Verificar que existan productos para probar
SELECT 
  p.id,
  p.name,
  p.sku,
  p.type,
  CASE 
    WHEN wp.id IS NOT NULL THEN 'Con bodega asignada'
    ELSE 'Sin bodega asignada'
  END as estado_bodega,
  wp."warehouseId" as bodega_id,
  w.name as bodega_nombre,
  wp.quantity as stock_actual,
  wp."minStock" as stock_min,
  wp."maxStock" as stock_max
FROM "Product" p
LEFT JOIN "Warehouse_Product" wp ON p.id = wp."productId"
LEFT JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE p.type IN ('ALMACENABLE', 'CONSUMIBLE', 'INVENTARIO')
ORDER BY p.id
LIMIT 10;

-- 2. Crear un producto de prueba si no existe
INSERT INTO "Product" (
  name,
  sku,
  type,
  description,
  "costprice",
  "saleprice",
  vat,
  "createdAt",
  "updatedAt"
) VALUES (
  'Producto Test Edición Bodega',
  'TEST-BODEGA-001',
  'ALMACENABLE',
  'Producto creado para probar la edición de bodegas',
  1000,
  1500,
  19,
  NOW(),
  NOW()
) 
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- 3. Obtener ID del producto de prueba
SELECT id, name, sku FROM "Product" WHERE sku = 'TEST-BODEGA-001';

-- 4. Verificar que existan bodegas disponibles
SELECT 
  id,
  name,
  type,
  location,
  "isActive"
FROM "Warehouse"
WHERE "isActive" = true
ORDER BY name
LIMIT 5;

-- 5. Simular asignación de bodega al producto (esto debería hacerse desde el frontend)
-- Primero, buscar el producto y una bodega disponible
WITH producto_test AS (
  SELECT id FROM "Product" WHERE sku = 'TEST-BODEGA-001'
),
bodega_disponible AS (
  SELECT id FROM "Warehouse" WHERE "isActive" = true LIMIT 1
)
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
  p.id,
  w.id,
  50,
  10,
  100,
  NOW(),
  NOW()
FROM producto_test p, bodega_disponible w
ON CONFLICT ("productId", "warehouseId") DO UPDATE SET
  quantity = EXCLUDED.quantity,
  "minStock" = EXCLUDED."minStock",
  "maxStock" = EXCLUDED."maxStock",
  "updatedAt" = NOW();

-- 6. Verificar que la asignación se haya realizado correctamente
SELECT 
  p.id as producto_id,
  p.name as producto_nombre,
  p.sku,
  wp.id as warehouse_product_id,
  wp."warehouseId" as bodega_id,
  w.name as bodega_nombre,
  wp.quantity as stock_actual,
  wp."minStock" as stock_min,
  wp."maxStock" as stock_max
FROM "Product" p
JOIN "Warehouse_Product" wp ON p.id = wp."productId"
JOIN "Warehouse" w ON wp."warehouseId" = w.id
WHERE p.sku = 'TEST-BODEGA-001';

-- 7. Preparar datos para el test del frontend
-- Esto simula lo que debería devolver getProductById
SELECT 
  p.*,
  JSON_BUILD_OBJECT(
    'min', wp."minStock",
    'max', wp."maxStock",
    'current', wp.quantity,
    'warehouseid', wp."warehouseId"
  ) as stock_object
FROM "Product" p
LEFT JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p.sku = 'TEST-BODEGA-001';

-- 8. Consulta para verificar nomenclatura de columnas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Warehouse_Product'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- INSTRUCCIONES PARA PROBAR:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Ir al frontend y editar el producto "Producto Test Edición Bodega"
-- 3. Cambiar la bodega asignada en el selector
-- 4. Guardar los cambios
-- 5. Verificar que se guarden correctamente ejecutando la consulta del paso 6

-- RESULTADO ESPERADO:
-- El producto debería mantener la bodega seleccionada después de guardar
-- Los logs del navegador deberían mostrar mensajes de debug exitosos
-- No deberían aparecer errores en la consola

-- LIMPIEZA (opcional)
-- DELETE FROM "Warehouse_Product" WHERE "productId" IN (SELECT id FROM "Product" WHERE sku = 'TEST-BODEGA-001');
-- DELETE FROM "Product" WHERE sku = 'TEST-BODEGA-001'; 