-- Script para actualizar el producto FULL DAY ADULTO (ID: 1176) con precio final congelado
-- Objetivo: Establecer el precio final congelado en $55,000

-- 1. Verificar datos actuales del producto 1176
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado
FROM "Product" 
WHERE id = 1176;

-- 2. Actualizar con precio final congelado de $55,000
UPDATE "Product" 
SET 
    "finalPrice" = 55000  -- Precio final congelado
WHERE id = 1176;

-- 3. Verificar que se actualizó correctamente
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado
FROM "Product" 
WHERE id = 1176;

-- 4. Verificar otros productos que tengan precios finales congelados
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado
FROM "Product" 
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 0
ORDER BY "finalPrice" DESC
LIMIT 10; 