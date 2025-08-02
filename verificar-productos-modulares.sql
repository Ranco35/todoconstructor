-- ================================================================
-- VERIFICACIÓN: Productos Modulares por Categorías
-- Script para diagnosticar por qué no aparecen productos en reservas
-- ================================================================

-- 📋 VERIFICAR EXISTENCIA DE TABLA Y DATOS

-- 1. Verificar que la tabla products_modular exista
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'products_modular' AND table_schema = 'public';

-- 2. Contar productos modulares por estado
SELECT 
  'Total productos' as tipo,
  COUNT(*) as cantidad
FROM public.products_modular
UNION ALL
SELECT 
  'Productos activos' as tipo,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE is_active = true
UNION ALL
SELECT 
  'Productos inactivos' as tipo,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE is_active = false;

-- 3. Verificar productos por categoría (solo activos)
SELECT 
  category,
  COUNT(*) as cantidad,
  ARRAY_AGG(name ORDER BY name) as productos
FROM public.products_modular 
WHERE is_active = true
GROUP BY category
ORDER BY cantidad DESC;

-- 4. Verificar productos de SPA específicamente
SELECT 
  id,
  code,
  name,
  category,
  price,
  per_person,
  is_active
FROM public.products_modular 
WHERE category = 'spa' AND is_active = true
ORDER BY name;

-- 5. Verificar productos de COMIDA específicamente  
SELECT 
  id,
  code,
  name,
  category,
  price,
  per_person,
  is_active
FROM public.products_modular 
WHERE category = 'comida' AND is_active = true
ORDER BY name;

-- 6. Verificar todos los productos activos con sus categorías
SELECT 
  id,
  code,
  name,
  category,
  price,
  per_person,
  is_active,
  sort_order,
  original_id
FROM public.products_modular 
WHERE is_active = true
ORDER BY category, sort_order, name;

-- 7. Verificar si hay productos con categorías vacías o NULL
SELECT 
  'Productos con category NULL' as problema,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE category IS NULL AND is_active = true
UNION ALL
SELECT 
  'Productos con category vacía' as problema,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE category = '' AND is_active = true;

-- 8. Verificar productos con precios problemáticos
SELECT 
  'Productos con precio 0' as problema,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE price = 0 AND is_active = true
UNION ALL
SELECT 
  'Productos con precio NULL' as problema,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE price IS NULL AND is_active = true;

-- 9. Buscar productos que podrían ser de spa pero están mal categorizados
SELECT 
  id,
  code,
  name,
  category,
  price
FROM public.products_modular 
WHERE is_active = true 
  AND (
    LOWER(name) LIKE '%piscina%' OR
    LOWER(name) LIKE '%termal%' OR  
    LOWER(name) LIKE '%spa%' OR
    LOWER(name) LIKE '%masaje%' OR
    LOWER(name) LIKE '%relax%' OR
    LOWER(name) LIKE '%gorro%'
  )
ORDER BY category, name;

-- 10. Buscar productos que podrían ser de comida pero están mal categorizados
SELECT 
  id,
  code,
  name,
  category,
  price
FROM public.products_modular 
WHERE is_active = true 
  AND (
    LOWER(name) LIKE '%desayuno%' OR
    LOWER(name) LIKE '%almuerzo%' OR
    LOWER(name) LIKE '%cena%' OR
    LOWER(name) LIKE '%once%' OR
    LOWER(name) LIKE '%full day%' OR
    LOWER(name) LIKE '%comida%' OR
    LOWER(name) LIKE '%buffet%'
  )
ORDER BY category, name;

-- 11. Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products_modular' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- VERIFICACIONES ADICIONALES
-- ================================================================

-- 12. Verificar si hay problemas con vinculaciones a productos originales
SELECT 
  pm.id,
  pm.name as modular_name,
  pm.category,
  pm.original_id,
  p.name as original_name,
  p.category as original_category
FROM public.products_modular pm
LEFT JOIN public."Product" p ON pm.original_id = p.id
WHERE pm.is_active = true
ORDER BY pm.category, pm.name;

-- 13. Resumen para diagnóstico rápido
SELECT 
  '🔍 DIAGNÓSTICO PRODUCTOS MODULARES' as resumen,
  CONCAT(
    'Total: ', (SELECT COUNT(*) FROM public.products_modular),
    ' | Activos: ', (SELECT COUNT(*) FROM public.products_modular WHERE is_active = true),
    ' | Spa: ', (SELECT COUNT(*) FROM public.products_modular WHERE category = 'spa' AND is_active = true),
    ' | Comida: ', (SELECT COUNT(*) FROM public.products_modular WHERE category = 'comida' AND is_active = true),
    ' | Otras categorías: ', (SELECT COUNT(*) FROM public.products_modular WHERE category NOT IN ('spa', 'comida') AND is_active = true)
  ) as estado; 