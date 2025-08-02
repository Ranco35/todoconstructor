-- BUSCAR PRODUCTOS CON "ONCE" - DEBUG ESPECÍFICO
-- Verificar por qué no aparecen resultados

-- 1. BUSQUEDA EXACTA "once"
SELECT 
    id,
    name,
    sku,
    saleprice,
    active,
    'BUSQUEDA: once' as tipo
FROM "Product" 
WHERE LOWER(name) LIKE '%once%' 
  AND active = true
LIMIT 10;

-- 2. BUSQUEDA "masaje" para comparar
SELECT 
    id,
    name,
    sku,
    saleprice,
    active,
    'BUSQUEDA: masaje' as tipo
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND active = true
LIMIT 5;

-- 3. BUSQUEDA "pisco" para comparar
SELECT 
    id,
    name,
    sku,
    saleprice,
    active,
    'BUSQUEDA: pisco' as tipo
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND active = true
LIMIT 5;

-- 4. CONTAR TOTALES
SELECT 
    'ONCE' as busqueda,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%once%' 
  AND active = true

UNION ALL

SELECT 
    'MASAJE' as busqueda,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND active = true

UNION ALL

SELECT 
    'PISCO' as busqueda,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND active = true; 