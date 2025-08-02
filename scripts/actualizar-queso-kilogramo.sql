-- ═══════════════════════════════════════════════════════════════
-- 🔧 SCRIPT: Actualizar Queso a Kilogramo
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Actualizar manualmente el producto queso para usar kilogramo

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR ESTADO ACTUAL
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 ESTADO ACTUAL - QUESO MANTECOSO' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type,
  updatedat
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%';

-- ═══════════════════════════════════════════════════════════════
-- 2. ACTUALIZAR PRODUCTO A KILOGRAMO
-- ═══════════════════════════════════════════════════════════════

UPDATE "Product"
SET 
  unit = 'Kilogramo',
  salesunitid = 2,
  purchaseunitid = 2,
  updatedat = NOW()
WHERE name ILIKE '%QUESO MANTECOSO%';

-- ═══════════════════════════════════════════════════════════════
-- 3. VERIFICAR ACTUALIZACIÓN
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '✅ ESTADO DESPUÉS DE ACTUALIZACIÓN' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type,
  updatedat
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%';

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR QUE NO HAY INCONSISTENCIAS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 VERIFICACIÓN DE CONSISTENCIA' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  CASE 
    WHEN salesunitid = 2 AND unit = 'Kilogramo' THEN '✅ Correcto'
    WHEN salesunitid = 1 AND unit = 'Unidad' THEN '✅ Correcto'
    ELSE '❌ Inconsistente'
  END as estado
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%';

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR TODOS LOS PRODUCTOS CON KILOGRAMO
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '⚖️ TODOS LOS PRODUCTOS CON KILOGRAMO' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE unit = 'Kilogramo' OR salesunitid = 2
ORDER BY name; 