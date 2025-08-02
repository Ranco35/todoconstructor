-- =====================================================
-- VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS
-- =====================================================

-- 1. VERIFICAR TABLA Category
-- =====================================================
SELECT 
    'TABLA Category:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Category'
ORDER BY ordinal_position;

-- 2. VERIFICAR TABLA Product
-- =====================================================
SELECT 
    'TABLA Product:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;

-- 3. VERIFICAR TABLA products_modular
-- =====================================================
SELECT 
    'TABLA products_modular:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products_modular'
ORDER BY ordinal_position;

-- 4. VERIFICAR CATEGORÍAS EXISTENTES
-- =====================================================
SELECT 
    'CATEGORÍAS EXISTENTES:' as info,
    id,
    name,
    description,
    is_active,
    parentId,
    sort_order
FROM "Category" 
ORDER BY sort_order, name;

-- 5. VERIFICAR PRODUCTOS DE HABITACIONES EXISTENTES
-- =====================================================
SELECT 
    'PRODUCTOS HABITACIONES:' as info,
    id,
    sku,
    name,
    unit_price,
    category_id,
    created_at
FROM "Product" 
WHERE sku LIKE 'HAB-%'
ORDER BY sku;

-- 6. VERIFICAR PRODUCTOS MODULARES EXISTENTES
-- =====================================================
SELECT 
    'PRODUCTOS MODULARES:' as info,
    id,
    code,
    name,
    price,
    original_id,
    created_at
FROM products_modular 
WHERE code LIKE 'habitacion_%'
ORDER BY code; 