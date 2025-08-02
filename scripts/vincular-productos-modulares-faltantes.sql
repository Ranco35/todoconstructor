-- ═══════════════════════════════════════════════════════════════
-- 🔗 VINCULACIÓN AUTOMÁTICA DE PRODUCTOS FALTANTES AL SISTEMA MODULAR
-- ═══════════════════════════════════════════════════════════════

-- VINCULACIÓN PRODUCTOS DE CATEGORÍA 27 (Programas por el Día) → 'comida'
INSERT INTO products_modular (
    code,
    name,
    description,
    price,
    category,
    per_person,
    is_active,
    sort_order,
    original_id,
    sku,
    created_at,
    updated_at
)
SELECT 
    LOWER(REPLACE(REPLACE(p.name, ' ', '_'), 'ñ', 'n')) || '_' || p.id as code,
    p.name,
    p.description,
    p.saleprice,
    'comida' as category,
    true as per_person,
    true as is_active,
    0 as sort_order,
    p.id as original_id,
    p.sku,
    NOW() as created_at,
    NOW() as updated_at
FROM "Product" p
LEFT JOIN products_modular pm ON pm.original_id = p.id
WHERE p.categoryid = 27  -- Categoría "Programas por el Día"
  AND p.saleprice IS NOT NULL
  AND p.saleprice > 0
  AND pm.id IS NULL  -- Solo productos que NO estén ya vinculados
  AND p.id IN (946, 1171, 1172, 1175, 1176, 1177, 1186, 1174, 1173, 1201, 1202);

-- VINCULACIÓN PRODUCTOS DE CATEGORÍA 28 (Spa) → 'spa'
INSERT INTO products_modular (
    code,
    name,
    description,
    price,
    category,
    per_person,
    is_active,
    sort_order,
    original_id,
    sku,
    created_at,
    updated_at
)
SELECT 
    LOWER(REPLACE(REPLACE(p.name, ' ', '_'), 'ñ', 'n')) || '_' || p.id as code,
    p.name,
    p.description,
    p.saleprice,
    'spa' as category,
    true as per_person,
    true as is_active,
    0 as sort_order,
    p.id as original_id,
    p.sku,
    NOW() as created_at,
    NOW() as updated_at
FROM "Product" p
LEFT JOIN products_modular pm ON pm.original_id = p.id
WHERE p.categoryid = 28  -- Categoría "Spa"
  AND p.saleprice IS NOT NULL
  AND p.saleprice > 0
  AND pm.id IS NULL  -- Solo productos que NO estén ya vinculados
  AND p.id IN (258, 1193);  -- Solo productos con precios válidos

-- VERIFICACIÓN: Mostrar productos vinculados
SELECT '=== PRODUCTOS VINCULADOS EXITOSAMENTE ===' as info;
SELECT 
    pm.id,
    pm.code,
    pm.name,
    pm.category,
    pm.price,
    pm.original_id,
    p.name as nombre_original
FROM products_modular pm
JOIN "Product" p ON p.id = pm.original_id
WHERE pm.original_id IN (946, 1171, 1172, 1175, 1176, 1177, 1186, 1174, 1173, 1201, 1202, 258, 1193)
ORDER BY pm.category, pm.name;

-- ESTADÍSTICAS FINALES
SELECT '=== ESTADÍSTICAS FINALES ===' as info;
SELECT 
    category,
    COUNT(*) as productos_vinculados
FROM products_modular 
WHERE is_active = true
GROUP BY category
ORDER BY category; 