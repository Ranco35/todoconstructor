-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: Buscar los 13 masajes perdidos específicos
-- PROPÓSITO: Encontrar los masajes mencionados en la documentación
-- FECHA: 2025-01-26
-- ═══════════════════════════════════════════════════════════════

-- Según la documentación del memory ID 3374125, deberían existir:
-- 13 masajes en categoría "Masajes" (ID 24) de recepción incluyendo:
-- MASAJE RELAX (30M/45M/1H), DESCONTRACTURANTE (30M/45M/1H), 
-- MIXTO, NIÑO, faciales, fangoterapia, Full Day Spa

-- 1. BUSCAR MASAJES ESPECÍFICOS POR NOMBRE
SELECT '=== MASAJES ESPECÍFICOS MENCIONADOS EN DOCUMENTACIÓN ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."finalPrice",
    p.categoryid,
    c.name as category_name,
    p."isPOSEnabled",
    p."isActive",
    p.sku
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje relax%' 
   OR LOWER(p.name) LIKE '%descontracturante%'
   OR LOWER(p.name) LIKE '%masaje mixto%'
   OR LOWER(p.name) LIKE '%masaje niño%'
   OR LOWER(p.name) LIKE '%facial%'
   OR LOWER(p.name) LIKE '%fangoterapia%'
   OR LOWER(p.name) LIKE '%full day spa%'
   OR LOWER(p.name) LIKE '%30m%'
   OR LOWER(p.name) LIKE '%45m%'
   OR LOWER(p.name) LIKE '%1h%'
ORDER BY p.name;

-- 2. BUSCAR PRODUCTOS CON SKU QUE TERMINEN EN "-MASAJES"
SELECT '=== PRODUCTOS CON SKU TERMINADO EN -MASAJES ===' as info;
SELECT 
    p.id,
    p.name,
    p.sku,
    p.saleprice,
    p."finalPrice",
    p.categoryid,
    c.name as category_name,
    p."isPOSEnabled"
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.sku) LIKE '%-masajes'
   OR LOWER(p.sku) LIKE '%masaje%'
ORDER BY p.sku;

-- 3. BUSCAR EN CATEGORÍA RESTAURANTE (donde estaban mal categorizados)
SELECT '=== MASAJES MAL CATEGORIZADOS EN RESTAURANTE ===' as info;
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p."finalPrice",
    p.categoryid,
    c.name as category_name,
    p."isPOSEnabled"
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE (
    LOWER(p.name) LIKE '%masaje%' 
    OR LOWER(p.name) LIKE '%relax%'
    OR LOWER(p.name) LIKE '%descontracturante%'
    OR LOWER(p.name) LIKE '%facial%'
    OR LOWER(p.name) LIKE '%fangoterapia%'
)
AND (
    LOWER(c.name) LIKE '%restaurante%'
    OR LOWER(c.name) LIKE '%cena%'
    OR LOWER(c.name) LIKE '%comida%'
    OR LOWER(c.name) LIKE '%bebida%'
)
ORDER BY p.name;

-- 4. BUSCAR TODOS LOS PRODUCTOS QUE PODRÍAN SER MASAJES
SELECT '=== TODOS LOS POSIBLES MASAJES EN EL SISTEMA ===' as info;
SELECT 
    p.id,
    p.name,
    p.sku,
    p.saleprice,
    p."finalPrice",
    p.categoryid,
    c.name as category_name,
    p."isPOSEnabled",
    p."isActive",
    p."createdAt"
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE LOWER(p.name) LIKE '%masaje%' 
   OR LOWER(p.name) LIKE '%relax%'
   OR LOWER(p.name) LIKE '%descontracturante%'
   OR LOWER(p.name) LIKE '%mixto%'
   OR LOWER(p.name) LIKE '%facial%'
   OR LOWER(p.name) LIKE '%fangoterapia%'
   OR LOWER(p.name) LIKE '%spa%'
   OR LOWER(p.description) LIKE '%masaje%'
   OR LOWER(p.description) LIKE '%spa%'
ORDER BY p."createdAt" DESC, p.name;

-- 5. VERIFICAR CATEGORÍAS DISPONIBLES PARA RECEPCIÓN
SELECT '=== CATEGORÍAS DISPONIBLES PARA RECEPCIÓN ===' as info;
SELECT 
    id,
    name,
    description
FROM "Category"
WHERE LOWER(name) LIKE '%masaje%'
   OR LOWER(name) LIKE '%spa%'
   OR LOWER(name) LIKE '%recepcion%'
   OR LOWER(name) LIKE '%servicio%'
   OR id = 24  -- ID específico mencionado en documentación
ORDER BY id;

-- 6. CONTAR PRODUCTOS POR CATEGORÍA RELACIONADA CON SPA
SELECT '=== CONTEO POR CATEGORÍAS SPA/MASAJES ===' as info;
SELECT 
    c.id,
    c.name as category_name,
    COUNT(p.id) as total_productos,
    COUNT(CASE WHEN p."isPOSEnabled" = true THEN 1 END) as pos_enabled,
    COUNT(CASE WHEN p.saleprice IS NOT NULL AND p.saleprice > 0 THEN 1 END) as con_precio
FROM "Category" c
LEFT JOIN "Product" p ON p.categoryid = c.id
WHERE LOWER(c.name) LIKE '%masaje%'
   OR LOWER(c.name) LIKE '%spa%'
   OR LOWER(c.name) LIKE '%tratamiento%'
   OR c.id = 24
GROUP BY c.id, c.name
ORDER BY total_productos DESC;

-- 7. VERIFICAR EN TABLA POSPRODUCT DE RECEPCIÓN
SELECT '=== MASAJES EN POSPRODUCT PARA RECEPCIÓN ===' as info;
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
WHERE pc."cashRegisterTypeId" = 1  -- Recepción
  AND (
    LOWER(pos.name) LIKE '%masaje%' 
    OR LOWER(pos.name) LIKE '%relax%' 
    OR LOWER(pos.name) LIKE '%spa%'
    OR LOWER(pos.name) LIKE '%facial%'
    OR LOWER(pos.name) LIKE '%descontracturante%'
  )
ORDER BY pos.name; 