-- VERIFICAR QUE PRODUCTOS CORREGIDOS APARECEN EN BÚSQUEDAS
-- Este script simula las consultas que hace la interfaz

-- 1. PRODUCTOS PISCO CON PRECIO (deberían aparecer en búsqueda)
SELECT 
    id,
    name,
    sku,
    saleprice,
    categoryid,
    active
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND saleprice IS NOT NULL
  AND active = true
ORDER BY name;

-- 2. PRODUCTOS MASAJE CON PRECIO (deberían aparecer en búsqueda)
SELECT 
    id,
    name,
    sku,
    saleprice,
    categoryid,
    active
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND saleprice IS NOT NULL
  AND active = true
ORDER BY name;

-- 3. VERIFICAR FILTROS DE LA INTERFAZ
-- Contar productos que cumplen condiciones de búsqueda
SELECT 
    'PISCO ACTIVOS CON PRECIO' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND saleprice IS NOT NULL
  AND active = true

UNION ALL

SELECT 
    'MASAJES ACTIVOS CON PRECIO' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND saleprice IS NOT NULL
  AND active = true;

-- 4. PRODUCTOS SIN PRECIO (NO deberían aparecer)
SELECT 
    'PRODUCTOS SIN PRECIO TOTAL' as problema,
    COUNT(*) as cantidad
FROM "Product" 
WHERE saleprice IS NULL
  AND active = true; 