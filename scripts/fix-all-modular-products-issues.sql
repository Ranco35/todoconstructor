-- =====================================================
-- SCRIPT COMPLETO: Resolver Problemas de Productos Modulares
-- =====================================================

-- 1. CREAR CATEGORÍA "Sistema Reservas"
-- =====================================================
INSERT INTO "Category" (name, description, is_active, parentId, sort_order, created_at, updated_at)
VALUES (
    'Sistema Reservas',
    'Categoría especial para productos del sistema de reservas de habitaciones. No se puede eliminar desde gestión de productos.',
    true,
    NULL,
    999, -- Orden alto para que aparezca al final
    NOW(),
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- 2. LIMPIAR PRODUCTOS MODULARES DUPLICADOS
-- =====================================================

-- Primero: Verificar duplicados existentes
SELECT 
    'DUPLICADOS ENCONTRADOS:' as info,
    code,
    name,
    COUNT(*) as count
FROM products_modular 
WHERE code LIKE 'habitacion_%'
GROUP BY code, name
HAVING COUNT(*) > 1
ORDER BY code;

-- Segundo: Eliminar duplicados manteniendo solo el más reciente
DELETE FROM products_modular 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY code ORDER BY created_at DESC) as rn
        FROM products_modular 
        WHERE code LIKE 'habitacion_%'
    ) t 
    WHERE t.rn > 1
);

-- Tercero: Verificar que se eliminaron los duplicados
SELECT 
    'VERIFICACIÓN POST-LIMPIEZA:' as info,
    code,
    name,
    COUNT(*) as count
FROM products_modular 
WHERE code LIKE 'habitacion_%'
GROUP BY code, name
HAVING COUNT(*) > 1
ORDER BY code;

-- 3. ASIGNAR CATEGORÍA "Sistema Reservas" A PRODUCTOS EXISTENTES
-- =====================================================

-- Actualizar productos de habitaciones existentes
UPDATE "Product" 
SET 
    category_id = (SELECT id FROM "Category" WHERE name = 'Sistema Reservas'),
    updated_at = NOW()
WHERE 
    sku LIKE 'HAB-%' 
    AND (category_id IS NULL OR category_id != (SELECT id FROM "Category" WHERE name = 'Sistema Reservas'));

-- 4. VERIFICACIONES FINALES
-- =====================================================

-- Verificar categoría creada
SELECT 
    'CATEGORÍA SISTEMA RESERVAS:' as info,
    id,
    name,
    description,
    is_active,
    sort_order,
    created_at
FROM "Category" 
WHERE name = 'Sistema Reservas';

-- Verificar productos en categoría Sistema Reservas
SELECT 
    'PRODUCTOS EN CATEGORÍA SISTEMA RESERVAS:' as info,
    p.id,
    p.sku,
    p.name,
    p.category_id,
    c.name as category_name,
    p.unit_price,
    p.created_at,
    p.updated_at
FROM "Product" p
LEFT JOIN "Category" c ON p.category_id = c.id
WHERE c.name = 'Sistema Reservas'
ORDER BY p.sku;

-- Verificar productos modulares finales
SELECT 
    'PRODUCTOS MODULARES FINALES:' as info,
    id,
    code,
    name,
    price,
    original_id,
    created_at
FROM products_modular 
WHERE code LIKE 'habitacion_%'
ORDER BY code;

-- Estadísticas finales
SELECT 
    'ESTADÍSTICAS FINALES:' as info,
    COUNT(*) as total_habitaciones,
    COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as con_categoria,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as sin_categoria
FROM "Product" 
WHERE sku LIKE 'HAB-%';

-- Mostrar todas las categorías para verificar
SELECT 
    'TODAS LAS CATEGORÍAS:' as info,
    id,
    name,
    description,
    is_active,
    parentId,
    sort_order
FROM "Category" 
ORDER BY sort_order, name; 