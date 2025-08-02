-- CORREGIR PRODUCTOS SIN PRECIO - SOLUCIÓN COMPLETA
-- Este script asigna precios por defecto a productos que tienen saleprice NULL

-- 1. PRODUCTOS PISCO - Asignar precios basados en tamaño/tipo
UPDATE "Product" 
SET saleprice = CASE 
    WHEN LOWER(name) LIKE '%sour%' THEN 4000
    WHEN LOWER(name) LIKE '%1000%' OR LOWER(name) LIKE '%1 litro%' THEN 8000
    WHEN LOWER(name) LIKE '%750%' THEN 6000
    WHEN LOWER(name) LIKE '%piscola%' THEN 3000
    WHEN LOWER(name) LIKE '%alto del carmen%' THEN 7000
    WHEN LOWER(name) LIKE '%tres erres%' OR LOWER(name) LIKE '%3r%' THEN 6500
    WHEN LOWER(name) LIKE '%licores%' THEN 5000
    ELSE 5000
END
WHERE LOWER(name) LIKE '%pisco%' 
  AND saleprice IS NULL;

-- 2. PRODUCTOS MASAJE - Asignar precios basados en duración
UPDATE "Product" 
SET saleprice = CASE 
    WHEN LOWER(name) LIKE '%15%' OR LOWER(name) LIKE '%niño%' THEN 12000
    WHEN LOWER(name) LIKE '%30%' THEN 18000
    WHEN LOWER(name) LIKE '%45%' THEN 25000
    WHEN LOWER(name) LIKE '%1 hr%' OR LOWER(name) LIKE '%1h%' OR LOWER(name) LIKE '%60%' THEN 30000
    WHEN LOWER(name) LIKE '%reductivo%' THEN 35000
    WHEN LOWER(name) LIKE '%facial%' THEN 20000
    ELSE 22000
END
WHERE LOWER(name) LIKE '%masaje%' 
  AND saleprice IS NULL;

-- 3. ASIGNAR CATEGORÍAS FALTANTES
-- Pisco con categoría null → categoría 5 (Bebidas)
UPDATE "Product" 
SET categoryid = 5
WHERE LOWER(name) LIKE '%pisco%' 
  AND categoryid IS NULL;

-- Masajes con categoría null → categoría 24 (Masajes)
UPDATE "Product" 
SET categoryid = 24
WHERE LOWER(name) LIKE '%masaje%' 
  AND categoryid IS NULL;

-- 4. VERIFICACIÓN - Mostrar productos corregidos
SELECT 
    'PISCO CORREGIDOS' as tipo,
    COUNT(*) as cantidad,
    MIN(saleprice) as precio_min,
    MAX(saleprice) as precio_max
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND saleprice IS NOT NULL

UNION ALL

SELECT 
    'MASAJES CORREGIDOS' as tipo,
    COUNT(*) as cantidad,
    MIN(saleprice) as precio_min,
    MAX(saleprice) as precio_max
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND saleprice IS NOT NULL; 