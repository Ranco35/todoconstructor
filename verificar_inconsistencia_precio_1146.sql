-- Script para verificar la inconsistencia del precio del producto 1146
-- Objetivo: Identificar por qué el precio congelado es $8,000 pero aparece $9,520 en POS

-- 1. Verificar datos en tabla Product
SELECT 
    id,
    name,
    saleprice as precio_neto,
    "finalPrice" as precio_congelado,
    vat,
    ROUND(saleprice * (1 + vat/100)) as precio_calculado_con_iva
FROM "Product" 
WHERE id = 1146;

-- 2. Verificar datos en tabla POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    pp."productId",
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146;

-- 3. Calcular qué precio debería mostrar el POS
-- Si finalPrice está disponible, debería usar ese precio
-- Si no, debería usar saleprice * (1 + vat/100)
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    vat,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN "finalPrice"
        ELSE ROUND(saleprice * (1 + vat/100))
    END as precio_que_deberia_mostrar_pos
FROM "Product" 
WHERE id = 1146; 