-- Script rápido para verificar productos huérfanos (SOLO LECTURA)
-- Ejecutar en Supabase: Editor SQL

-- ═══════════════════════════════════════════════════════════════
-- VERIFICACIÓN RÁPIDA DE PRODUCTOS HUÉRFANOS
-- ═══════════════════════════════════════════════════════════════

-- 1. Conteo general
SELECT 
  '📊 ESTADO ACTUAL DEL SISTEMA MODULAR' as titulo,
  '====================================' as separador;

SELECT 
  COUNT(*) as total_productos_modulares,
  COUNT(CASE WHEN original_id IS NOT NULL THEN 1 END) as con_vinculacion,
  COUNT(CASE WHEN original_id IS NULL THEN 1 END) as sin_vinculacion
FROM public.products_modular;

-- 2. Productos modulares huérfanos
SELECT 
  '🔍 PRODUCTOS MODULARES HUÉRFANOS' as titulo,
  '=================================' as separador;

-- Sin original_id
SELECT 
  'SIN original_id' as tipo,
  COUNT(*) as cantidad
FROM public.products_modular 
WHERE original_id IS NULL;

-- Con original_id inválido
SELECT 
  'Con original_id INVÁLIDO' as tipo,
  COUNT(*) as cantidad
FROM public.products_modular pm
WHERE pm.original_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public."Product" p 
    WHERE p.id = pm.original_id
  );

-- 3. Vinculaciones de paquetes huérfanas
SELECT 
  '🔗 VINCULACIONES DE PAQUETES HUÉRFANAS' as titulo,
  '======================================' as separador;

SELECT 
  COUNT(*) as vinculaciones_huerfanas
FROM public.product_package_linkage ppl
WHERE NOT EXISTS (
  SELECT 1 FROM public."Product" p 
  WHERE p.id = ppl.product_id
);

-- 4. Listado detallado de huérfanos
SELECT 
  '📋 DETALLE DE PRODUCTOS HUÉRFANOS' as titulo,
  '==================================' as separador;

-- Productos sin original_id
SELECT 
  'Productos SIN original_id:' as categoria,
  id,
  name,
  code,
  category
FROM public.products_modular 
WHERE original_id IS NULL
ORDER BY name;

-- Productos con original_id inválido
SELECT 
  'Productos con original_id INVÁLIDO:' as categoria,
  id,
  name,
  code,
  original_id as id_inexistente
FROM public.products_modular pm
WHERE pm.original_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public."Product" p 
    WHERE p.id = pm.original_id
  )
ORDER BY name;

-- 5. Estado de paquetes
SELECT 
  '📦 ESTADO DE PAQUETES' as titulo,
  '=====================' as separador;

SELECT 
  pkg.name as paquete,
  pkg.code,
  COUNT(ppl.product_id) as productos_vinculados,
  STRING_AGG(
    CASE 
      WHEN EXISTS (SELECT 1 FROM public."Product" p WHERE p.id = ppl.product_id) 
      THEN p.name 
      ELSE CONCAT('🔴 ID:', ppl.product_id, ' (inexistente)')
    END, 
    ', '
  ) as productos
FROM public.packages_modular pkg
LEFT JOIN public.product_package_linkage ppl ON pkg.id = ppl.package_id
LEFT JOIN public."Product" p ON ppl.product_id = p.id
GROUP BY pkg.id, pkg.name, pkg.code
ORDER BY pkg.sort_order;

-- 6. Resumen de acciones recomendadas
SELECT 
  '🎯 ACCIONES RECOMENDADAS' as titulo,
  '=========================' as separador;

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM public.products_modular WHERE original_id IS NULL
    ) > 0 THEN 
      CONCAT('❌ Eliminar ', 
        (SELECT COUNT(*) FROM public.products_modular WHERE original_id IS NULL),
        ' productos modulares sin original_id'
      )
    ELSE '✅ No hay productos modulares sin original_id'
  END as accion_1;

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM public.products_modular pm
      WHERE pm.original_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM public."Product" p WHERE p.id = pm.original_id)
    ) > 0 THEN 
      CONCAT('❌ Corregir ', 
        (SELECT COUNT(*) FROM public.products_modular pm
         WHERE pm.original_id IS NOT NULL 
           AND NOT EXISTS (SELECT 1 FROM public."Product" p WHERE p.id = pm.original_id)),
        ' productos modulares con original_id inválido'
      )
    ELSE '✅ Todos los original_id son válidos'
  END as accion_2;

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM public.product_package_linkage ppl
      WHERE NOT EXISTS (SELECT 1 FROM public."Product" p WHERE p.id = ppl.product_id)
    ) > 0 THEN 
      CONCAT('❌ Limpiar ', 
        (SELECT COUNT(*) FROM public.product_package_linkage ppl
         WHERE NOT EXISTS (SELECT 1 FROM public."Product" p WHERE p.id = ppl.product_id)),
        ' vinculaciones de paquetes huérfanas'
      )
    ELSE '✅ Todas las vinculaciones de paquetes son válidas'
  END as accion_3;

-- 7. Comando de limpieza recomendado
SELECT 
  '🧹 PARA LIMPIAR PRODUCTOS HUÉRFANOS:' as titulo,
  'Ejecutar script: cleanup-orphaned-modular-products.sql' as comando; 