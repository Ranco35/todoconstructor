-- Script ultra simple para corregir el producto 1146 "ONCE BUFFET NIÑOS"
-- Objetivo: Corregir precio de $0 a $8,000

-- 1. Verificar el estado actual del producto 1146
SELECT 
    id,
    name,
    saleprice as precio_actual,
    "finalPrice" as precio_final
FROM "Product" 
WHERE id = 1146;

-- 2. Corregir el precio
UPDATE "Product" 
SET 
    saleprice = 8000,
    "finalPrice" = 8000
WHERE id = 1146;

-- 3. Verificar la corrección
SELECT 
    id,
    name,
    saleprice as precio_corregido,
    "finalPrice" as precio_final_corregido
FROM "Product" 
WHERE id = 1146; 