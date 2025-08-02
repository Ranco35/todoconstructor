-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT: Verificar Columnas de Unidades en Excel
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Verificar que las columnas salesunitid y purchaseunitid están funcionando

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR QUE LAS COLUMNAS EXISTEN
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 VERIFICACIÓN DE COLUMNAS' as seccion,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name IN ('salesunitid', 'purchaseunitid', 'unit')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════
-- 2. VERIFICAR PRODUCTOS CON UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 PRODUCTOS CON UNIDADES' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN salesunitid IS NOT NULL THEN 1 END) as con_salesunitid,
  COUNT(CASE WHEN purchaseunitid IS NOT NULL THEN 1 END) as con_purchaseunitid,
  COUNT(CASE WHEN unit IS NOT NULL THEN 1 END) as con_unit,
  COUNT(CASE WHEN salesunitid = 1 THEN 1 END) as con_salesunitid_1,
  COUNT(CASE WHEN purchaseunitid = 1 THEN 1 END) as con_purchaseunitid_1
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 3. MOSTRAR EJEMPLOS DE PRODUCTOS CON UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 EJEMPLOS DE PRODUCTOS' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type
FROM "Product"
ORDER BY id
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR DISTRIBUCIÓN DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 DISTRIBUCIÓN DE UNIDADES' as seccion,
  unit,
  COUNT(*) as cantidad
FROM "Product"
WHERE unit IS NOT NULL
GROUP BY unit
ORDER BY cantidad DESC;

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR DISTRIBUCIÓN DE IDs DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 DISTRIBUCIÓN DE SALESUNITID' as seccion,
  salesunitid,
  COUNT(*) as cantidad
FROM "Product"
WHERE salesunitid IS NOT NULL
GROUP BY salesunitid
ORDER BY salesunitid;

SELECT 
  '📊 DISTRIBUCIÓN DE PURCHASEUNITID' as seccion,
  purchaseunitid,
  COUNT(*) as cantidad
FROM "Product"
WHERE purchaseunitid IS NOT NULL
GROUP BY purchaseunitid
ORDER BY purchaseunitid;

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR PRODUCTOS SIN UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '⚠️ PRODUCTOS SIN UNIDADES' as seccion,
  COUNT(*) as productos_sin_unidades
FROM "Product"
WHERE unit IS NULL OR unit = '';

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAR PRODUCTOS SIN IDs DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '⚠️ PRODUCTOS SIN SALESUNITID' as seccion,
  COUNT(*) as productos_sin_salesunitid
FROM "Product"
WHERE salesunitid IS NULL;

SELECT 
  '⚠️ PRODUCTOS SIN PURCHASEUNITID' as seccion,
  COUNT(*) as productos_sin_purchaseunitid
FROM "Product"
WHERE purchaseunitid IS NULL; 