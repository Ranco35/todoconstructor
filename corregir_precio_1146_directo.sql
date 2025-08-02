-- Script directo para corregir el precio del producto 1146 en POSProduct
-- Objetivo: Cambiar el precio de $9,520 a $8,000 para que coincida con el precio congelado

-- 1. Verificar el estado actual en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_actual_pos,
    pp."productId",
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146;

-- 2. Actualizar el precio en POSProduct para que coincida con el precio congelado
UPDATE "POSProduct" 
SET price = 8000
WHERE "productId" = 1146;

-- 3. Verificar la corrección en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_corregido_pos,
    pp."productId",
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146;

-- 4. Verificar que el producto en Product tenga el precio correcto
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    vat
FROM "Product" 
WHERE id = 1146; 