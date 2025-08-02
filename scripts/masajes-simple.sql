-- SCRIPT SIMPLE: Buscar productos de masajes perdidos
-- Solo las consultas esenciales con columnas que sabemos que existen

-- 1. BUSCAR TODOS LOS PRODUCTOS QUE CONTENGAN "MASAJE" EN EL NOMBRE
SELECT '=== PRODUCTOS CON MASAJE EN EL NOMBRE ===' as seccion;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.categoryid,
    c.name as categoria,
    p."isPOSEnabled" as pos_habilitado
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%'
ORDER BY p.id;

-- 2. BUSCAR PRODUCTOS CON TÉRMINOS RELACIONADOS A SPA
SELECT '=== PRODUCTOS RELACIONADOS CON SPA/RELAX ===' as seccion;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.categoryid,
    c.name as categoria,
    p."isPOSEnabled" as pos_habilitado
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%relax%' 
   OR LOWER(p.name) LIKE '%descontracturante%'
   OR LOWER(p.name) LIKE '%facial%'
   OR LOWER(p.name) LIKE '%spa%'
   OR LOWER(p.name) LIKE '%fangoterapia%'
ORDER BY p.name;

-- 3. BUSCAR CATEGORÍAS RELACIONADAS CON MASAJES
SELECT '=== CATEGORÍAS DE MASAJES/SPA ===' as seccion;
SELECT 
    c.id,
    c.name as categoria,
    COUNT(p.id) as cantidad_productos
FROM "Category" c
LEFT JOIN "Product" p ON p.categoryid = c.id
WHERE LOWER(c.name) LIKE '%masaje%' 
   OR LOWER(c.name) LIKE '%spa%'
   OR LOWER(c.name) LIKE '%tratamiento%'
   OR c.id = 24
GROUP BY c.id, c.name
ORDER BY cantidad_productos DESC;

-- 4. PRODUCTOS EN CATEGORÍA MASAJES (ID 24)
SELECT '=== PRODUCTOS EN CATEGORÍA ID 24 ===' as seccion;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."isPOSEnabled" as pos_habilitado,
    p.sku
FROM "Product" p
WHERE p.categoryid = 24
ORDER BY p.id;

-- 5. PRODUCTOS EN POS DE RECEPCIÓN CON MASAJE
SELECT '=== MASAJES EN POS RECEPCIÓN ===' as seccion;
SELECT 
    pos.id as pos_id,
    pos.name as nombre_pos,
    pos.price as precio_pos,
    pc.name as categoria_pos,
    pc."cashRegisterTypeId" as tipo_caja,
    pos."productId" as producto_original_id
FROM "POSProduct" pos
LEFT JOIN "POSProductCategory" pc ON pos."categoryId" = pc.id
WHERE LOWER(pos.name) LIKE '%masaje%' 
   OR LOWER(pos.name) LIKE '%relax%' 
   OR LOWER(pos.name) LIKE '%spa%'
   OR LOWER(pos.name) LIKE '%facial%'
ORDER BY pos.name;

-- 6. RESUMEN FINAL
SELECT '=== RESUMEN FINAL ===' as seccion;
SELECT 
    'Productos con masaje en nombre' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%'
UNION ALL
SELECT 
    'Productos con spa/relax en nombre' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%relax%'
UNION ALL
SELECT 
    'Productos en categoría ID 24' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE categoryid = 24; 