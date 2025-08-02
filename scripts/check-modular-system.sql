-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT PARA REVISAR EL SISTEMA MODULAR
-- ═══════════════════════════════════════════════════════════════

-- 1. VERIFICAR SI LAS TABLAS EXISTEN
SELECT 'VERIFICANDO TABLAS MODULARES...' as status;

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

-- 2. VERIFICAR FUNCIÓN CALCULATE_PACKAGE_PRICE_MODULAR
SELECT 
  'calculate_package_price_modular' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'calculate_package_price_modular'
    ) THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as estado;

-- 3. VERIFICAR MIGRACIÓN APLICADA
SELECT 
  'MIGRACIONES APLICADAS:' as info,
  version,
  name,
  applied_at
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%modular%' OR version = '20250101000020'
ORDER BY applied_at DESC;

-- 4. SI LAS TABLAS EXISTEN, MOSTRAR CONTENIDO
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_modular') THEN
    RAISE NOTICE 'PRODUCTOS MODULARES ENCONTRADOS:';
    -- Mostrar productos
  ELSE
    RAISE NOTICE 'TABLAS MODULARES NO ENCONTRADAS - EJECUTAR MIGRACIÓN';
  END IF;
END $$;

-- 5. CONTAR REGISTROS SI EXISTEN LAS TABLAS
SELECT 
  'CONTEO DE REGISTROS:' as info,
  (SELECT COUNT(*) FROM products_modular) as productos,
  (SELECT COUNT(*) FROM packages_modular) as paquetes,
  (SELECT COUNT(*) FROM package_products_modular) as composiciones,
  (SELECT COUNT(*) FROM age_pricing_modular) as multiplicadores_edad
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_modular');

-- 6. MOSTRAR ALGUNOS PRODUCTOS DE EJEMPLO SI EXISTEN
SELECT 
  'PRODUCTOS DE EJEMPLO:' as info,
  code,
  name,
  price,
  category,
  per_person
FROM products_modular 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_modular')
LIMIT 5;

-- 7. MOSTRAR PAQUETES SI EXISTEN  
SELECT 
  'PAQUETES CONFIGURADOS:' as info,
  code,
  name,
  color,
  (SELECT COUNT(*) FROM package_products_modular WHERE package_id = p.id) as productos_incluidos
FROM packages_modular p
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages_modular')
ORDER BY sort_order;

-- ═══════════════════════════════════════════════════════════════
-- 📝 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════

/*
SI LAS TABLAS NO EXISTEN, EJECUTAR:

1. DESDE TERMINAL EN /supabase:
   npx supabase db reset

2. O APLICAR SOLO LA MIGRACIÓN:
   npx supabase migration up 20250101000020

3. O EJECUTAR DIRECTAMENTE EL ARCHIVO:
   psql -h localhost -p 54322 -d postgres -U postgres -f migrations/20250101000020_modular_products_system.sql

4. VERIFICAR RESULTADO:
   psql -h localhost -p 54322 -d postgres -U postgres -c "SELECT * FROM products_modular LIMIT 3;"
*/ 