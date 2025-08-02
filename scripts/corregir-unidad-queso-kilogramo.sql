-- ═══════════════════════════════════════════════════════════════
-- 🔧 SCRIPT: Corregir Unidad del Queso a Kilogramo
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Actualizar salesunitid y purchaseunitid para que coincidan con "Kilogramo"

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR ESTADO ACTUAL
-- ═══════════════════════════════════════════════════════════════

SELECT 
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid
FROM "Product" 
WHERE name LIKE '%QUESO MANTECOSO RIO BUENO%';

-- ═══════════════════════════════════════════════════════════════
-- 2. ACTUALIZAR UNIDADES A KILOGRAMO (ID: 2)
-- ═══════════════════════════════════════════════════════════════

UPDATE "Product" 
SET 
  salesunitid = 2,    -- Kilogramo
  purchaseunitid = 2,  -- Kilogramo
  unit = 'Kilogramo'   -- Asegurar que el campo unit también esté correcto
WHERE name LIKE '%QUESO MANTECOSO RIO BUENO%';

-- ═══════════════════════════════════════════════════════════════
-- 3. VERIFICAR CAMBIOS APLICADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  CASE 
    WHEN salesunitid = 2 AND purchaseunitid = 2 THEN '✅ CORRECTO'
    ELSE '❌ INCORRECTO'
  END as estado
FROM "Product" 
WHERE name LIKE '%QUESO MANTECOSO RIO BUENO%';

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR UNIDADES DISPONIBLES
-- ═══════════════════════════════════════════════════════════════

-- Mostrar las unidades disponibles para referencia
SELECT 
  'Unidades disponibles:' as info,
  'ID 1: Unidad (UND)' as unidad_1,
  'ID 2: Kilogramo (KG)' as unidad_2,
  'ID 3: Gramo (GR)' as unidad_3,
  'ID 4: Litro (LT)' as unidad_4;

-- ═══════════════════════════════════════════════════════════════
-- 5. COMENTARIOS
-- ═══════════════════════════════════════════════════════════════

/*
✅ RESULTADO ESPERADO:
- salesunitid: 2 (Kilogramo)
- purchaseunitid: 2 (Kilogramo)  
- unit: 'Kilogramo'

✅ DESPUÉS DE ESTE SCRIPT:
- El formulario mostrará "Kilogramo (KG)" en lugar de "Unidad (UND)"
- Las compras podrán usar cantidades decimales como 23.5 kg
- El sistema será consistente entre unit, salesunitid y purchaseunitid
*/ 