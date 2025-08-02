-- Script para crear el producto 1146 "ONCE BUFFET NIÑOS" en POSProduct
-- Objetivo: Crear el registro faltante con precio $8,000

-- 1. Verificar categorías disponibles para POS
SELECT 
    id,
    name,
    "cashRegisterTypeId",
    "isActive"
FROM "POSProductCategory" 
WHERE "isActive" = true
ORDER BY "cashRegisterTypeId", id;

-- 2. Verificar datos del producto 1146 en Product
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    vat,
    categoryid
FROM "Product" 
WHERE id = 1146;

-- 3. Crear el registro en POSProduct
-- Usamos categoría 20 (que parece ser la categoría principal según los datos)
INSERT INTO "POSProduct" (
    name,
    description,
    sku,
    price,
    cost,
    "categoryId",
    "productId",
    "isActive",
    "stockRequired",
    "sortOrder"
) VALUES (
    'ONCE BUFFET NIÑOS',
    'Once buffet para niños',
    'ONCE-NINOS-1146',
    8000,
    6723,
    20,
    1146,
    true,
    false,
    0
);

-- 4. Verificar que se creó correctamente
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    pp."productId",
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146; 