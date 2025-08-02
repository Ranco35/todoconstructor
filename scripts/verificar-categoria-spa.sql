-- VERIFICAR CATEGORIA SPA Y PRODUCTOS DE MASAJES
-- Investigar por qué no aparecen los 30 productos de masajes en la categoría Spa

-- 1. VERIFICAR QUE CATEGORIA TIENE ID 28 (Spa según la imagen)
SELECT '=== INFORMACIÓN DE CATEGORÍA SPA (ID 28) ===' as info;
SELECT 
    id,
    name,
    description,
    "parentId"
FROM "Category" 
WHERE id = 28 OR LOWER(name) LIKE '%spa%';

-- 2. CONTAR PRODUCTOS EN CATEGORÍA SPA (ID 28)
SELECT '=== PRODUCTOS EN CATEGORÍA SPA (ID 28) ===' as info;
SELECT 
    COUNT(*) as total_productos_spa
FROM "Product" 
WHERE categoryid = 28;

-- 3. LISTAR TODOS LOS PRODUCTOS EN CATEGORÍA SPA (ID 28)
SELECT '=== LISTADO COMPLETO CATEGORÍA SPA ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."isPOSEnabled" as pos_habilitado,
    p.sku
FROM "Product" p
WHERE p.categoryid = 28
ORDER BY p.name;

-- 4. BUSCAR PRODUCTOS DE MASAJES Y VER EN QUÉ CATEGORÍA ESTÁN
SELECT '=== PRODUCTOS CON MASAJE Y SUS CATEGORÍAS ===' as info;
SELECT 
    p.id,
    p.name,
    p.categoryid,
    c.name as categoria_actual,
    p."isPOSEnabled" as pos_habilitado
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.categoryid, p.name;

-- 5. VERIFICAR SI HAY PRODUCTOS DE MASAJES EN OTRAS CATEGORÍAS
SELECT '=== MASAJES EN OTRAS CATEGORÍAS (NO SPA) ===' as info;
SELECT 
    c.id as categoria_id,
    c.name as categoria_nombre,
    COUNT(p.id) as cantidad_masajes
FROM "Category" c
LEFT JOIN "Product" p ON p.categoryid = c.id AND LOWER(p.name) LIKE '%masaje%'
WHERE c.id != 28  -- Excluir categoría Spa
GROUP BY c.id, c.name
HAVING COUNT(p.id) > 0
ORDER BY cantidad_masajes DESC;

-- 6. VERIFICAR PRODUCTOS MASAJES EN CATEGORÍA 24 (Masajes según documentación)
SELECT '=== COMPARAR CATEGORÍA 24 (MASAJES) VS 28 (SPA) ===' as info;
SELECT 
    'Categoría 24 (Masajes)' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE categoryid = 24
UNION ALL
SELECT 
    'Categoría 28 (Spa)' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE categoryid = 28
UNION ALL
SELECT 
    'Productos con "masaje" en cat 24' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE categoryid = 24 AND LOWER(name) LIKE '%masaje%'
UNION ALL
SELECT 
    'Productos con "masaje" en cat 28' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE categoryid = 28 AND LOWER(name) LIKE '%masaje%';

-- 7. VERIFICAR SI LOS MASAJES ESTÁN ACTIVOS/HABILITADOS
SELECT '=== ESTADO DE PRODUCTOS DE MASAJES ===' as info;
SELECT 
    p.id,
    p.name,
    p.categoryid,
    c.name as categoria,
    p."isPOSEnabled" as pos_habilitado,
    CASE WHEN p.saleprice IS NULL OR p.saleprice = 0 THEN 'SIN PRECIO' ELSE 'CON PRECIO' END as estado_precio
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.categoryid, p.name; 