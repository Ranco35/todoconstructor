-- Script para verificar si hay múltiples registros del producto 1146 en POSProduct
-- Objetivo: Identificar registros duplicados o conflictivos

-- 1. Verificar todos los registros del producto 1146 en POSProduct
SELECT 
    id,
    name,
    price as precio_pos,
    "productId",
    "categoryId",
    "isActive",
    "createdAt",
    "updatedAt"
FROM "POSProduct" 
WHERE "productId" = 1146
ORDER BY id;

-- 2. Verificar si hay registros con el mismo nombre pero diferente productId
SELECT 
    id,
    name,
    price as precio_pos,
    "productId",
    "categoryId",
    "isActive"
FROM "POSProduct" 
WHERE name LIKE '%ONCE BUFFET NIÑOS%'
ORDER BY id;

-- 3. Verificar si hay registros con precio $9,520
SELECT 
    id,
    name,
    price as precio_pos,
    "productId",
    "categoryId",
    "isActive"
FROM "POSProduct" 
WHERE price = 9520
ORDER BY id;

-- 4. Eliminar registros duplicados del producto 1146 (mantener solo el más reciente)
-- Primero, identificar cuáles eliminar
SELECT 
    id,
    name,
    price,
    "productId",
    "categoryId",
    "createdAt",
    ROW_NUMBER() OVER (PARTITION BY "productId", "categoryId" ORDER BY "createdAt" DESC) as rn
FROM "POSProduct" 
WHERE "productId" = 1146
ORDER BY "productId", "categoryId", "createdAt" DESC;

-- 5. Eliminar registros duplicados (ejecutar solo si hay duplicados)
-- DELETE FROM "POSProduct" 
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (PARTITION BY "productId", "categoryId" ORDER BY "createdAt" DESC) as rn
--         FROM "POSProduct" 
--         WHERE "productId" = 1146
--     ) t WHERE rn > 1
-- ); 