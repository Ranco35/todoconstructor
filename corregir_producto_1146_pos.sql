-- Script para corregir el producto 1146 "ONCE BUFFET NIÑOS" en POS
-- Objetivo: Verificar y corregir el precio que aparece como $0 en POS

-- 1. Verificar el estado actual del producto 1146
SELECT 
    id,
    name,
    saleprice as precio_venta,
    "finalPrice" as precio_final_congelado,
    is_active,
    categoryid,
    created_at,
    updated_at
FROM "Product" 
WHERE id = 1146;

-- 2. Verificar si existe en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    pp.cost as costo_pos,
    pp.isActive,
    pp.categoryId,
    ppc.name as categoria_pos,
    ppc.cashRegisterTypeId as tipo_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp.categoryId = ppc.id
WHERE pp.productId = 1146;

-- 3. Corregir el precio del producto 1146 si es necesario
UPDATE "Product" 
SET 
    saleprice = 8000,
    "finalPrice" = 8000,
    is_active = true
WHERE id = 1146;

-- 4. Verificar después de la corrección
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    is_active
FROM "Product" 
WHERE id = 1146;

-- 5. Forzar resincronización de productos POS
-- Esto se debe hacer desde la interfaz o llamando a la función syncPOSProducts()

-- 6. Verificar productos POS después de sincronización
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    pp.cost as costo_pos,
    pp.isActive,
    ppc.name as categoria_pos,
    ppc.cashRegisterTypeId as tipo_pos,
    p.saleprice as precio_original,
    p."finalPrice" as precio_final_original
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp.categoryId = ppc.id
LEFT JOIN "Product" p ON pp.productId = p.id
WHERE pp.productId = 1146
ORDER BY ppc.cashRegisterTypeId;

-- 7. Verificar otros productos con precio 0 en POS
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    ppc.name as categoria_pos,
    ppc.cashRegisterTypeId as tipo_pos,
    p.saleprice as precio_original,
    p.name as nombre_original
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp.categoryId = ppc.id
LEFT JOIN "Product" p ON pp.productId = p.id
WHERE pp.price = 0 AND pp.isActive = true
ORDER BY ppc.cashRegisterTypeId, pp.name;

-- 8. Corregir todos los productos POS con precio 0
UPDATE "POSProduct" 
SET price = p.saleprice
FROM "Product" p
WHERE "POSProduct".productId = p.id 
  AND "POSProduct".price = 0 
  AND p.saleprice > 0;

-- 9. Verificar corrección
SELECT 
    'Productos POS corregidos' as accion,
    COUNT(*) as cantidad
FROM "POSProduct" pp
JOIN "Product" p ON pp.productId = p.id
WHERE pp.price = p.saleprice 
  AND pp.price > 0; 