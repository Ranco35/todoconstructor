-- Script simple para corregir el precio del producto 1146 "ONCE BUFFET NIÑOS"
-- Objetivo: Cambiar el precio de $0 a $8,000

-- 1. Verificar el estado actual
SELECT 
    id,
    name,
    saleprice as precio_actual,
    "finalPrice" as precio_final,
    "isPOSEnabled",
    is_active
FROM "Product" 
WHERE id = 1146;

-- 2. Corregir el precio y habilitar para POS
UPDATE "Product" 
SET 
    saleprice = 8000,
    "finalPrice" = 8000,
    "isPOSEnabled" = true
WHERE id = 1146;

-- 3. Verificar la corrección
SELECT 
    id,
    name,
    saleprice as precio_corregido,
    "finalPrice" as precio_final_corregido,
    "isPOSEnabled",
    is_active
FROM "Product" 
WHERE id = 1146;

-- 4. Verificar si existe en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp.categoryId = ppc.id
WHERE pp.productId = 1146;

-- 5. Corregir precio en POSProduct si existe
UPDATE "POSProduct" 
SET price = 8000
WHERE productId = 1146;

-- 6. Verificar corrección en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos_corregido,
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp.categoryId = ppc.id
WHERE pp.productId = 1146; 