-- VERIFICAR ESTADO ACTUAL DE BÚSQUEDA DE PRODUCTOS
-- Confirmar que el sistema muestra TODOS los productos (con y sin precio)

-- 1. TOTAL DE PRODUCTOS ACTIVOS
SELECT 
    'TOTAL PRODUCTOS ACTIVOS' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE active = true;

-- 2. PRODUCTOS CON BÚSQUEDA "masaje" (TODOS, con y sin precio)
SELECT 
    'MASAJE - TODOS' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND active = true;

-- 3. PRODUCTOS CON BÚSQUEDA "pisco" (TODOS, con y sin precio)
SELECT 
    'PISCO - TODOS' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND active = true;

-- 4. DESGLOSE DE MASAJES POR PRECIO
SELECT 
    CASE 
        WHEN saleprice IS NOT NULL THEN 'CON PRECIO'
        ELSE 'SIN PRECIO'
    END as estado,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND active = true
GROUP BY CASE WHEN saleprice IS NOT NULL THEN 'CON PRECIO' ELSE 'SIN PRECIO' END;

-- 5. DESGLOSE DE PISCO POR PRECIO
SELECT 
    CASE 
        WHEN saleprice IS NOT NULL THEN 'CON PRECIO'
        ELSE 'SIN PRECIO'
    END as estado,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
  AND active = true
GROUP BY CASE WHEN saleprice IS NOT NULL THEN 'CON PRECIO' ELSE 'SIN PRECIO' END;

-- 6. EJEMPLOS DE MASAJES SIN PRECIO (deberían aparecer en búsqueda)
SELECT 
    id,
    name,
    saleprice,
    active
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
  AND saleprice IS NULL
  AND active = true
LIMIT 5; 