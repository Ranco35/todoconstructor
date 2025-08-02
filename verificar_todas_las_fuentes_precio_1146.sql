-- Script para verificar todas las posibles fuentes de precio del producto 1146
-- Objetivo: Identificar de dónde viene el precio $9,520

-- 1. Verificar Product (tabla principal)
SELECT 
    'Product' as fuente,
    id,
    name,
    saleprice as precio_neto,
    "finalPrice" as precio_congelado,
    vat,
    ROUND(saleprice * (1 + vat/100)) as precio_calculado_con_iva
FROM "Product" 
WHERE id = 1146;

-- 2. Verificar POSProduct (tabla del POS)
SELECT 
    'POSProduct' as fuente,
    id,
    name,
    price as precio_pos,
    "productId",
    "categoryId"
FROM "POSProduct" 
WHERE "productId" = 1146;

-- 3. Verificar si hay otros registros con el mismo nombre
SELECT 
    'POSProduct por nombre' as fuente,
    id,
    name,
    price as precio_pos,
    "productId",
    "categoryId"
FROM "POSProduct" 
WHERE name LIKE '%ONCE BUFFET NIÑOS%';

-- 4. Verificar si hay productos similares
SELECT 
    'Productos similares' as fuente,
    id,
    name,
    saleprice,
    "finalPrice",
    vat
FROM "Product" 
WHERE name LIKE '%ONCE%' OR name LIKE '%NIÑOS%';

-- 5. Verificar si hay caché o datos temporales
SELECT 
    'Todos los productos POS' as fuente,
    COUNT(*) as total_productos_pos
FROM "POSProduct";

-- 6. Verificar la categoría específica donde aparece
SELECT 
    ppc.id,
    ppc.name as categoria,
    ppc."cashRegisterTypeId",
    COUNT(pp.id) as productos_en_categoria
FROM "POSProductCategory" ppc
LEFT JOIN "POSProduct" pp ON ppc.id = pp."categoryId"
WHERE ppc.name LIKE '%Menu%' OR ppc.name LIKE '%Cena%'
GROUP BY ppc.id, ppc.name, ppc."cashRegisterTypeId"; 