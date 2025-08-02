-- SCRIPT PARA CORREGIR PRODUCTOS DE MASAJES
-- Asignar precios y categoría correcta a los masajes que están incompletos

-- 1. VERIFICAR ESTADO ACTUAL
SELECT '=== ESTADO ACTUAL DE MASAJES ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.categoryid,
    c.name as categoria_actual
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.id;

-- 2. ENCONTRAR ID DE CATEGORÍA "MASAJES"
SELECT '=== CATEGORÍAS DISPONIBLES ===' as info;
SELECT 
    id,
    name
FROM "Category"
WHERE LOWER(name) LIKE '%masaje%' OR LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%tratamiento%'
ORDER BY name;

-- 3. CORREGIR MASAJES SIN CATEGORÍA (ASIGNAR A CATEGORÍA MASAJES ID 24)
UPDATE "Product" 
SET categoryid = 24
WHERE id IN (219, 220, 221, 222, 223, 224, 225, 226)
  AND categoryid IS NULL;

-- 4. ASIGNAR PRECIOS ESTIMADOS BASADOS EN DURACIÓN
-- Precios base sugeridos:
-- 15 minutos: $15,000
-- 30 minutos: $25,000  
-- 45 minutos: $35,000
-- 1 hora: $45,000

-- MASAJE DESCONTRACTURANTE 45M (ID 219)
UPDATE "Product" 
SET saleprice = 35000
WHERE id = 219 AND saleprice IS NULL;

-- MASAJE DESCONTRACTURANTE 1 HR (ID 220)
UPDATE "Product" 
SET saleprice = 45000
WHERE id = 220 AND saleprice IS NULL;

-- MASAJE DESCONTRACTURANTE 30 M (ID 221)
UPDATE "Product" 
SET saleprice = 25000
WHERE id = 221 AND saleprice IS NULL;

-- MASAJE MIXTO 45MIN (ID 222)
UPDATE "Product" 
SET saleprice = 35000
WHERE id = 222 AND saleprice IS NULL;

-- MASAJE NIÑO 15M (ID 223)
UPDATE "Product" 
SET saleprice = 15000
WHERE id = 223 AND saleprice IS NULL;

-- MASAJE REDUCTIVO (ID 224)
UPDATE "Product" 
SET saleprice = 40000
WHERE id = 224 AND saleprice IS NULL;

-- MASAJE RELAX 1H (ID 225)
UPDATE "Product" 
SET saleprice = 45000
WHERE id = 225 AND saleprice IS NULL;

-- MASAJE RELAX 45M (ID 226)
UPDATE "Product" 
SET saleprice = 35000
WHERE id = 226 AND saleprice IS NULL;

-- 5. VERIFICAR RESULTADO FINAL
SELECT '=== MASAJES CORREGIDOS ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.categoryid,
    c.name as categoria_final
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.id;

-- 6. CONTAR MASAJES CORREGIDOS
SELECT '=== RESUMEN FINAL ===' as info;
SELECT 
    'Masajes con precio' as estado,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' AND saleprice IS NOT NULL AND saleprice > 0
UNION ALL
SELECT 
    'Masajes en categoría Masajes' as estado,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' AND categoryid = 24
UNION ALL
SELECT 
    'Total de masajes' as estado,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%'; 