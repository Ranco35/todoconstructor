-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT: Verificar Campo Unit - Kilogramo
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Verificar que el campo unit se actualiza correctamente

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR PRODUCTO QUESO MANTECOSO
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 PRODUCTO QUESO MANTECOSO' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%'
ORDER BY id;

-- ═══════════════════════════════════════════════════════════════
-- 2. VERIFICAR TODOS LOS PRODUCTOS CON UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 TODOS LOS PRODUCTOS CON UNIDADES' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE unit IS NOT NULL AND unit != ''
ORDER BY name
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════
-- 3. VERIFICAR DISTRIBUCIÓN DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 DISTRIBUCIÓN DE UNIDADES' as seccion,
  unit,
  COUNT(*) as cantidad
FROM "Product"
WHERE unit IS NOT NULL AND unit != ''
GROUP BY unit
ORDER BY cantidad DESC;

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR PRODUCTOS CON KILOGRAMO
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '⚖️ PRODUCTOS CON KILOGRAMO' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE unit ILIKE '%kilo%' OR unit ILIKE '%kg%'
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR PRODUCTOS CON PIEZA
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📦 PRODUCTOS CON PIEZA' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE unit ILIKE '%pieza%' OR unit ILIKE '%und%'
ORDER BY name
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR PRODUCTOS SIN UNIDAD
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '⚠️ PRODUCTOS SIN UNIDAD' as seccion,
  COUNT(*) as cantidad
FROM "Product"
WHERE unit IS NULL OR unit = '';

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAR CONSISTENCIA ENTRE UNIT Y SALESUNITID
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 CONSISTENCIA UNIT vs SALESUNITID' as seccion,
  unit,
  salesunitid,
  COUNT(*) as cantidad
FROM "Product"
WHERE unit IS NOT NULL AND unit != '' AND salesunitid IS NOT NULL
GROUP BY unit, salesunitid
ORDER BY unit, salesunitid; 