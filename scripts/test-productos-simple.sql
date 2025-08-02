-- TEST SIMPLE DE PRODUCTOS SIN FILTROS
-- Verificar que los productos básicos estén funcionando

-- 1. CONTAR TOTAL DE PRODUCTOS
SELECT '=== TOTAL PRODUCTOS ===' as info;
SELECT COUNT(*) as total_productos FROM "Product";

-- 2. PRIMEROS 10 PRODUCTOS POR ID
SELECT '=== PRIMEROS 10 PRODUCTOS ===' as info;
SELECT 
    id,
    name,
    saleprice,
    sku
FROM "Product"
ORDER BY id DESC
LIMIT 10;

-- 3. PRODUCTOS QUE CONTENGAN "MASAJE"
SELECT '=== BUSQUEDA MASAJE ===' as info;
SELECT 
    id,
    name,
    saleprice,
    categoryid
FROM "Product"
WHERE LOWER(name) LIKE '%masaje%'
ORDER BY id;

-- 4. PRODUCTOS QUE CONTENGAN "PISCO" (PARA COMPARAR)
SELECT '=== BUSQUEDA PISCO ===' as info;
SELECT 
    id,
    name,
    saleprice,
    categoryid
FROM "Product"
WHERE LOWER(name) LIKE '%pisco%'
ORDER BY id;

-- 5. PRODUCTOS SIN PRECIO (PUEDEN CAUSAR PROBLEMAS)
SELECT '=== PRODUCTOS SIN PRECIO ===' as info;
SELECT 
    COUNT(*) as sin_precio
FROM "Product"
WHERE saleprice IS NULL OR saleprice = 0;

-- 6. PRODUCTOS SIN CATEGORÍA (PUEDEN CAUSAR PROBLEMAS)
SELECT '=== PRODUCTOS SIN CATEGORÍA ===' as info;
SELECT 
    COUNT(*) as sin_categoria
FROM "Product"
WHERE categoryid IS NULL; 