-- ═══════════════════════════════════════════════════════════════
-- 🎯 SCRIPT: Asignar UND a Productos Sin Unidad
-- ═══════════════════════════════════════════════════════════════
-- Instrucciones: Ejecutar en Supabase Dashboard > SQL Editor
-- Propósito: Asignar "UND" a todos los productos que no tienen unidad de medida

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR PRODUCTOS SIN UNIDAD ANTES DE LA ACTUALIZACIÓN
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 PRODUCTOS SIN UNIDAD (ANTES)' as seccion,
  COUNT(*) as cantidad_productos_sin_unidad
FROM "Product"
WHERE unit IS NULL OR unit = '';

-- ═══════════════════════════════════════════════════════════════
-- 2. MOSTRAR PRODUCTOS QUE SERÁN ACTUALIZADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 PRODUCTOS QUE SERÁN ACTUALIZADOS' as seccion,
  id,
  name as nombre_producto,
  unit as unidad_actual,
  'UND' as nueva_unidad
FROM "Product"
WHERE unit IS NULL OR unit = ''
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 3. ACTUALIZAR PRODUCTOS SIN UNIDAD (DESCOMENTAR PARA EJECUTAR)
-- ═══════════════════════════════════════════════════════════════

/*
-- Asignar UND a productos sin unidad
UPDATE "Product"
SET unit = 'UND'
WHERE unit IS NULL OR unit = '';

-- Mostrar confirmación
SELECT 
  '✅ ACTUALIZACIÓN COMPLETADA' as seccion,
  'Se asignó UND a todos los productos sin unidad' as mensaje;
*/

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR PRODUCTOS SIN UNIDAD DESPUÉS DE LA ACTUALIZACIÓN
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 PRODUCTOS SIN UNIDAD (DESPUÉS)' as seccion,
  COUNT(*) as cantidad_productos_sin_unidad
FROM "Product"
WHERE unit IS NULL OR unit = '';

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR PRODUCTOS CON UND
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🎯 PRODUCTOS CON UND' as seccion,
  COUNT(*) as cantidad_productos_con_und
FROM "Product"
WHERE unit = 'UND';

-- ═══════════════════════════════════════════════════════════════
-- 6. ESTADÍSTICAS FINALES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 ESTADÍSTICAS FINALES' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN unit = 'UND' THEN 1 END) as productos_con_und,
  COUNT(CASE WHEN unit IS NOT NULL AND unit != '' AND unit != 'UND' THEN 1 END) as productos_con_otras_unidades,
  COUNT(CASE WHEN unit IS NULL OR unit = '' THEN 1 END) as productos_sin_unidad,
  ROUND(
    (COUNT(CASE WHEN unit IS NOT NULL AND unit != '' THEN 1 END) * 100.0 / COUNT(*)), 
    2
  ) as porcentaje_con_unidad
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 7. MUESTRA DE PRODUCTOS ACTUALIZADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 MUESTRA DE PRODUCTOS CON UND' as seccion,
  id,
  name as nombre_producto,
  unit as unidad
FROM "Product"
WHERE unit = 'UND'
ORDER BY name
LIMIT 15;

-- ═══════════════════════════════════════════════════════════════
-- 8. RESUMEN DE TODAS LAS UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📈 RESUMEN DE TODAS LAS UNIDADES' as seccion,
  unit as unidad,
  COUNT(*) as cantidad_productos,
  ROUND(
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "Product")), 
    2
  ) as porcentaje
FROM "Product"
GROUP BY unit
ORDER BY cantidad_productos DESC; 