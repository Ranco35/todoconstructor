-- VERIFICAR NOMBRES EXACTOS DE PRODUCTOS DE MASAJES
-- Para entender por qué la búsqueda "masaje" no funciona

-- 1. BUSCAR TODOS LOS PRODUCTOS QUE CONTENGAN "MASAJE" (CUALQUIER VARIACIÓN)
SELECT '=== PRODUCTOS CON MASAJE (CASE INSENSITIVE) ===' as info;
SELECT 
    p.id,
    p.name,
    LENGTH(p.name) as longitud_nombre,
    p.categoryid,
    c.name as categoria
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.name;

-- 2. VERIFICAR SI HAY CARACTERES ESPECIALES O ESPACIOS RAROS
SELECT '=== ANÁLISIS DE CARACTERES EN NOMBRES ===' as info;
SELECT 
    p.id,
    p.name,
    LENGTH(p.name) as longitud,
    ASCII(SUBSTRING(p.name, 1, 1)) as primer_caracter_ascii,
    ASCII(SUBSTRING(p.name, LENGTH(p.name), 1)) as ultimo_caracter_ascii
FROM "Product" p
WHERE LOWER(p.name) LIKE '%masaje%'
LIMIT 5;

-- 3. BUSCAR VARIACIONES DE ESCRITURA
SELECT '=== BUSCAR VARIACIONES DE MASAJE ===' as info;
SELECT 
    'Con "masaje"' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%'
UNION ALL
SELECT 
    'Con "massage"' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%massage%'
UNION ALL
SELECT 
    'Con "masage"' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masage%'
UNION ALL
SELECT 
    'Con "relax"' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%relax%'
UNION ALL
SELECT 
    'Con "spa"' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%spa%';

-- 4. MOSTRAR LOS PRIMEROS 10 PRODUCTOS DE MASAJES EXACTOS
SELECT '=== PRIMEROS 10 MASAJES EXACTOS ===' as info;
SELECT 
    p.id,
    '"' || p.name || '"' as nombre_con_comillas,
    p.sku,
    p.saleprice,
    c.name as categoria
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.id
LIMIT 10;

-- 5. VERIFICAR SI SON PRODUCTOS ACTIVOS/VÁLIDOS
SELECT '=== ESTADO DE PRODUCTOS MASAJES ===' as info;
SELECT 
    COUNT(*) as total_masajes,
    COUNT(CASE WHEN p.saleprice IS NOT NULL AND p.saleprice > 0 THEN 1 END) as con_precio,
    COUNT(CASE WHEN p.sku IS NOT NULL AND p.sku != '' THEN 1 END) as con_sku
FROM "Product" p
WHERE LOWER(p.name) LIKE '%masaje%';

-- 6. BUSCAR EN DIFERENTES CAMPOS DONDE PODRÍA ESTAR "MASAJE"
SELECT '=== BUSCAR MASAJE EN OTROS CAMPOS ===' as info;
SELECT 
    'En name' as campo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%'
UNION ALL
SELECT 
    'En sku' as campo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(sku) LIKE '%masaje%'
UNION ALL
SELECT 
    'En description' as campo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(description) LIKE '%masaje%'; 