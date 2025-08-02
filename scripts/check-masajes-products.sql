-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: Verificar productos de masajes 
-- PROPÓSITO: Buscar todos los productos relacionados con masajes
-- FECHA: 2025-01-26
-- ═══════════════════════════════════════════════════════════════

-- 1. BUSCAR PRODUCTOS DE MASAJES POR NOMBRE
SELECT '=== PRODUCTOS DE MASAJES POR NOMBRE ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."finalPrice",
    p.categoryid,
    c.name as category_name,
    p."isPOSEnabled",
    p.active
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%' 
   OR LOWER(p.name) LIKE '%relax%' 
   OR LOWER(p.name) LIKE '%descontracturante%'
   OR LOWER(p.name) LIKE '%facial%'
   OR LOWER(p.name) LIKE '%spa%'
   OR LOWER(p.name) LIKE '%mixto%'
   OR LOWER(p.name) LIKE '%niño%'
   OR LOWER(p.name) LIKE '%fangoterapia%'
ORDER BY p.id;

-- 2. BUSCAR CATEGORÍAS QUE PUEDEN CONTENER MASAJES
SELECT '=== CATEGORÍAS RELACIONADAS CON MASAJES ===' as info;
SELECT 
    c.id,
    c.name,
    c.description,
    COUNT(p.id) as productos_count
FROM "Category" c
LEFT JOIN "Product" p ON p.categoryid = c.id
WHERE LOWER(c.name) LIKE '%masaje%' 
   OR LOWER(c.name) LIKE '%spa%'
   OR LOWER(c.name) LIKE '%tratamiento%'
   OR LOWER(c.name) LIKE '%facial%'
   OR LOWER(c.name) LIKE '%bienestar%'
   OR LOWER(c.name) LIKE '%relajacion%'
GROUP BY c.id, c.name, c.description
ORDER BY productos_count DESC;

-- 3. PRODUCTOS EN CATEGORÍA MASAJES (ID 24 según documentación)
SELECT '=== PRODUCTOS EN CATEGORÍA MASAJES (ID 24) ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."finalPrice",
    p."isPOSEnabled",
    p."isActive",
    p.sku
FROM "Product" p
WHERE p.categoryid = 24
ORDER BY p.id;

-- 4. PRODUCTOS HABILITADOS PARA POS DE RECEPCIÓN
SELECT '=== PRODUCTOS POS HABILITADOS PARA RECEPCIÓN ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."finalPrice",
    c.name as category_name,
    pc.id as pos_category_id,
    pc.name as pos_category_name,
    pc."cashRegisterTypeId"
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
LEFT JOIN "POSProductCategory" pc ON p."posCategoryId" = pc.id
WHERE p."isPOSEnabled" = true 
  AND (pc."cashRegisterTypeId" = 1 OR pc."cashRegisterTypeId" IS NULL)
  AND (
    LOWER(p.name) LIKE '%masaje%' 
    OR LOWER(p.name) LIKE '%relax%' 
    OR LOWER(p.name) LIKE '%spa%'
    OR LOWER(c.name) LIKE '%masaje%'
    OR LOWER(c.name) LIKE '%spa%'
  )
ORDER BY p.id;

-- 5. TODOS LOS PRODUCTOS CON PRECIOS EN CATEGORÍAS DE SPA/MASAJES
SELECT '=== TODOS LOS PRODUCTOS EN CATEGORÍAS SPA/MASAJES ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."finalPrice",
    p.categoryid,
    c.name as category_name,
    p."isPOSEnabled",
    p."isActive"
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE (
    LOWER(c.name) LIKE '%masaje%' 
    OR LOWER(c.name) LIKE '%spa%'
    OR LOWER(c.name) LIKE '%tratamiento%'
    OR LOWER(c.name) LIKE '%facial%'
    OR LOWER(c.name) LIKE '%bienestar%'
    OR c.id = 24  -- ID específico de masajes según documentación
)
AND p.saleprice IS NOT NULL 
AND p.saleprice > 0
ORDER BY c.name, p.name;

-- 6. VERIFICAR SI HAY PRODUCTOS EN POS PRODUCT CON MASAJES
SELECT '=== PRODUCTOS DE MASAJES EN TABLA POSPRODUCT ===' as info;
SELECT 
    pos.id,
    pos.name,
    pos.price,
    pos."categoryId",
    pc.name as pos_category_name,
    pc."cashRegisterTypeId",
    pos."productId",
    p.name as original_product_name
FROM "POSProduct" pos
LEFT JOIN "POSProductCategory" pc ON pos."categoryId" = pc.id
LEFT JOIN "Product" p ON pos."productId" = p.id
WHERE LOWER(pos.name) LIKE '%masaje%' 
   OR LOWER(pos.name) LIKE '%relax%' 
   OR LOWER(pos.name) LIKE '%spa%'
   OR LOWER(pos.name) LIKE '%facial%'
   OR LOWER(pos.name) LIKE '%descontracturante%'
ORDER BY pos.id;

-- 7. RESUMEN FINAL
SELECT '=== RESUMEN FINAL ===' as info;
SELECT 
    'Total productos con "masaje" en nombre' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%'
UNION ALL
SELECT 
    'Total productos con "spa" en nombre' as tipo,
    COUNT(*) as cantidad
FROM "Product" 
WHERE LOWER(name) LIKE '%spa%'
UNION ALL
SELECT 
    'Total productos POS habilitados para recepción' as tipo,
    COUNT(*) as cantidad
FROM "Product" p
LEFT JOIN "POSProductCategory" pc ON p."posCategoryId" = pc.id
WHERE p."isPOSEnabled" = true 
  AND (pc."cashRegisterTypeId" = 1 OR pc."cashRegisterTypeId" IS NULL); 