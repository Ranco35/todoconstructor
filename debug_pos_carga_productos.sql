-- Script para debuggear exactamente qué datos está cargando el POS
-- Simula la consulta que hace getPOSProductsByType

-- 1. Verificar categorías activas para tipo de POS 2 (Restaurante)
SELECT 
    id,
    name,
    "cashRegisterTypeId",
    "isActive"
FROM "POSProductCategory" 
WHERE "cashRegisterTypeId" = 2 
  AND "isActive" = true
ORDER BY "sortOrder";

-- 2. Verificar productos POS que debería cargar el POS
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    pp."productId",
    pp."categoryId",
    pp."isActive",
    ppc.name as categoria_nombre,
    ppc."cashRegisterTypeId",
    p."isPOSEnabled"
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
LEFT JOIN "Product" p ON pp."productId" = p.id
WHERE pp."isActive" = true
  AND ppc."cashRegisterTypeId" = 2
  AND pp."productId" IS NOT NULL
  AND p."isPOSEnabled" = true
ORDER BY pp."sortOrder";

-- 3. Verificar específicamente el producto 1146 en todas las categorías
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    pp."productId",
    pp."categoryId",
    pp."isActive",
    ppc.name as categoria_nombre,
    ppc."cashRegisterTypeId"
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146
ORDER BY ppc."cashRegisterTypeId", pp."categoryId";

-- 4. Verificar si hay algún registro con precio $9,520 en cualquier lugar
SELECT 
    'POSProduct' as tabla,
    id,
    name,
    price as precio,
    "productId",
    "categoryId"
FROM "POSProduct" 
WHERE price = 9520

UNION ALL

SELECT 
    'Product' as tabla,
    id,
    name,
    saleprice as precio,
    NULL as "productId",
    categoryid as "categoryId"
FROM "Product" 
WHERE saleprice = 9520 OR "finalPrice" = 9520; 