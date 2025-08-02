-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT: Verificar Estado Actual de Unidades de Medida
-- ═══════════════════════════════════════════════════════════════
-- Instrucciones: Ejecutar en Supabase Dashboard > SQL Editor
-- Propósito: Verificar si todos los productos tienen unidad de medida asignada

-- ═══════════════════════════════════════════════════════════════
-- 1. ESTADÍSTICAS GENERALES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 ESTADÍSTICAS GENERALES' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN unit IS NULL OR unit = '' THEN 1 END) as sin_unidad,
  COUNT(CASE WHEN unit IS NOT NULL AND unit != '' THEN 1 END) as con_unidad,
  ROUND(
    (COUNT(CASE WHEN unit IS NOT NULL AND unit != '' THEN 1 END) * 100.0 / COUNT(*)), 
    2
  ) as porcentaje_con_unidad
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 2. PRODUCTOS SIN UNIDAD
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '❌ PRODUCTOS SIN UNIDAD' as seccion,
  id,
  name as nombre_producto,
  unit as unidad_actual,
  'SIN ASIGNAR' as estado
FROM "Product"
WHERE unit IS NULL OR unit = ''
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 3. PRODUCTOS CON UNIDAD
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '✅ PRODUCTOS CON UNIDAD' as seccion,
  unit as unidad,
  COUNT(*) as cantidad_productos
FROM "Product"
WHERE unit IS NOT NULL AND unit != ''
GROUP BY unit
ORDER BY cantidad_productos DESC;

-- ═══════════════════════════════════════════════════════════════
-- 4. PRODUCTOS CON UND
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🎯 PRODUCTOS CON UND' as seccion,
  COUNT(*) as cantidad_productos_und
FROM "Product"
WHERE unit = 'UND';

-- ═══════════════════════════════════════════════════════════════
-- 5. PRODUCTOS CON OTRAS UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔧 PRODUCTOS CON OTRAS UNIDADES' as seccion,
  unit as unidad,
  COUNT(*) as cantidad_productos
FROM "Product"
WHERE unit IS NOT NULL 
  AND unit != '' 
  AND unit != 'UND'
GROUP BY unit
ORDER BY cantidad_productos DESC;

-- ═══════════════════════════════════════════════════════════════
-- 6. MUESTRA DE PRODUCTOS CON UND
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 MUESTRA DE PRODUCTOS CON UND' as seccion,
  id,
  name as nombre_producto,
  unit as unidad
FROM "Product"
WHERE unit = 'UND'
ORDER BY name
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- 7. PRODUCTOS CON UNIDADES ESPECIALES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 PRODUCTOS CON UNIDADES ESPECIALES' as seccion,
  id,
  name as nombre_producto,
  unit as unidad_actual
FROM "Product"
WHERE unit IS NOT NULL 
  AND unit != '' 
  AND unit NOT IN ('UND', 'KG', 'LT', 'MT', 'CAJ', 'PAQ', 'DOC', 'PAR', 'HRA', 'DIA', 'NOC', 'SER')
ORDER BY unit, name;

-- ═══════════════════════════════════════════════════════════════
-- 8. RESUMEN FINAL
-- ═══════════════════════════════════════════════════════════════

WITH stats AS (
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN unit IS NULL OR unit = '' THEN 1 END) as sin_unidad,
    COUNT(CASE WHEN unit = 'UND' THEN 1 END) as con_und,
    COUNT(CASE WHEN unit IS NOT NULL AND unit != '' AND unit != 'UND' THEN 1 END) as con_otras_unidades
  FROM "Product"
)
SELECT 
  '📈 RESUMEN FINAL' as seccion,
  total as total_productos,
  sin_unidad as productos_sin_unidad,
  con_und as productos_con_und,
  con_otras_unidades as productos_con_otras_unidades,
  CASE 
    WHEN sin_unidad = 0 THEN '✅ TODOS LOS PRODUCTOS TIENEN UNIDAD'
    ELSE '❌ HAY PRODUCTOS SIN UNIDAD'
  END as estado_general
FROM stats; 