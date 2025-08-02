-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT PARA REVISAR PRODUCTOS DISPONIBLES PARA SISTEMA MODULAR
-- ═══════════════════════════════════════════════════════════════

-- 1. VERIFICAR CATEGORÍAS EXISTENTES
SELECT '=== CATEGORÍAS DISPONIBLES ===' as info;
SELECT 
  id,
  name,
  description,
  COUNT(p.id) as productos_count
FROM "Category" c
LEFT JOIN "Product" p ON p.categoryid = c.id AND p.saleprice IS NOT NULL AND p.saleprice > 0
GROUP BY c.id, c.name, c.description
ORDER BY productos_count DESC, c.name;

-- 2. PRODUCTOS CON PRECIOS VÁLIDOS POR CATEGORÍA
SELECT '=== PRODUCTOS DISPONIBLES POR CATEGORÍA ===' as info;
SELECT 
  c.name as categoria,
  p.id,
  p.name as producto,
  p.saleprice,
  p.description,
  p.sku,
  CASE 
    WHEN c.name ILIKE '%alojamiento%' OR c.name ILIKE '%habitacion%' OR c.name ILIKE '%programa%' THEN 'alojamiento'
    WHEN c.name ILIKE '%alimentacion%' OR c.name ILIKE '%restaurante%' OR c.name ILIKE '%comida%' OR c.name ILIKE '%bebida%' THEN 'comida'
    WHEN c.name ILIKE '%spa%' OR c.name ILIKE '%masaje%' OR c.name ILIKE '%tratamiento%' OR c.name ILIKE '%termal%' THEN 'spa'
    WHEN c.name ILIKE '%entretenimiento%' OR c.name ILIKE '%actividad%' OR c.name ILIKE '%recreacion%' THEN 'entretenimiento'
    ELSE 'servicios'
  END as categoria_modular
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE p.saleprice IS NOT NULL 
  AND p.saleprice > 0
ORDER BY categoria_modular, p.saleprice DESC;

-- 3. MAPEO SUGERIDO DE CATEGORÍAS
SELECT '=== MAPEO SUGERIDO DE CATEGORÍAS ===' as info;
SELECT 
  categoria_modular,
  COUNT(*) as productos_count,
  AVG(saleprice) as precio_promedio,
  MIN(saleprice) as precio_minimo,
  MAX(saleprice) as precio_maximo
FROM (
  SELECT 
    p.saleprice,
    CASE 
      WHEN c.name ILIKE '%alojamiento%' OR c.name ILIKE '%habitacion%' OR c.name ILIKE '%programa%' THEN 'alojamiento'
      WHEN c.name ILIKE '%alimentacion%' OR c.name ILIKE '%restaurante%' OR c.name ILIKE '%comida%' OR c.name ILIKE '%bebida%' THEN 'comida'
      WHEN c.name ILIKE '%spa%' OR c.name ILIKE '%masaje%' OR c.name ILIKE '%tratamiento%' OR c.name ILIKE '%termal%' THEN 'spa'
      WHEN c.name ILIKE '%entretenimiento%' OR c.name ILIKE '%actividad%' OR c.name ILIKE '%recreacion%' THEN 'entretenimiento'
      ELSE 'servicios'
    END as categoria_modular
  FROM "Product" p
  JOIN "Category" c ON p.categoryid = c.id
  WHERE p.saleprice IS NOT NULL 
    AND p.saleprice > 0
) subquery
GROUP BY categoria_modular
ORDER BY productos_count DESC;

-- 4. PRODUCTOS SIN PRECIO (PARA REFERENCIA)
SELECT '=== PRODUCTOS SIN PRECIO ===' as info;
SELECT 
  c.name as categoria,
  COUNT(*) as productos_sin_precio
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE p.saleprice IS NULL OR p.saleprice <= 0
GROUP BY c.name
ORDER BY productos_sin_precio DESC;

-- 5. VERIFICAR SI EXISTEN TABLAS MODULARES
SELECT '=== ESTADO TABLAS MODULARES ===' as info;
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ) THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as estado
FROM (
  VALUES 
    ('products_modular'),
    ('packages_modular'), 
    ('package_products_modular'),
    ('age_pricing_modular')
) AS t(table_name);

-- 6. CONTEO DE PRODUCTOS MODULARES SI EXISTEN
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_modular') THEN
    RAISE NOTICE '=== PRODUCTOS EN TABLA MODULAR ===';
    PERFORM COUNT(*) FROM products_modular;
  END IF;
END $$; 