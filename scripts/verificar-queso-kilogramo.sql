-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT: Verificar Queso Kilogramo
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Verificar el estado actual del producto queso

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
  type,
  createdat,
  updatedat
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%'
ORDER BY id;

-- ═══════════════════════════════════════════════════════════════
-- 2. VERIFICAR TODOS LOS PRODUCTOS CON KILOGRAMO
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
-- 3. VERIFICAR PRODUCTOS CON SALESUNITID = 2 (KILOGRAMO)
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔢 PRODUCTOS CON SALESUNITID = 2' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE salesunitid = 2
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR PRODUCTOS CON PURCHASEUNITID = 2 (KILOGRAMO)
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔢 PRODUCTOS CON PURCHASEUNITID = 2' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
WHERE purchaseunitid = 2
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR INCONSISTENCIAS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '⚠️ INCONSISTENCIAS UNIT vs SALESUNITID' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  CASE 
    WHEN salesunitid = 2 AND unit != 'Kilogramo' THEN '❌ SALESUNITID=2 pero unit no es Kilogramo'
    WHEN salesunitid = 1 AND unit != 'Unidad' THEN '❌ SALESUNITID=1 pero unit no es Unidad'
    ELSE '✅ Consistente'
  END as estado
FROM "Product"
WHERE (salesunitid = 2 AND unit != 'Kilogramo') 
   OR (salesunitid = 1 AND unit != 'Unidad')
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR PRODUCTOS RECIENTEMENTE ACTUALIZADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🕒 PRODUCTOS ACTUALIZADOS HOY' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type,
  updatedat
FROM "Product"
WHERE updatedat >= CURRENT_DATE
ORDER BY updatedat DESC;

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAR DISTRIBUCIÓN GENERAL DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 DISTRIBUCIÓN DE UNIDADES' as seccion,
  unit,
  COUNT(*) as cantidad
FROM "Product"
WHERE unit IS NOT NULL AND unit != ''
GROUP BY unit
ORDER BY cantidad DESC; 