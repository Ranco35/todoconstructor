-- ═══════════════════════════════════════════════════════════════
-- 🔍 SCRIPT: Verificar Proveedor Kunstmann
-- ═══════════════════════════════════════════════════════════════
-- Instrucciones: Ejecutar en Supabase Dashboard > SQL Editor
-- Propósito: Verificar que el proveedor Kunstmann existe y tiene los datos correctos

-- ═══════════════════════════════════════════════════════════════
-- 1. BUSCAR PROVEEDOR KUNSTMANN
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 PROVEEDOR KUNSTMANN' as seccion,
  id,
  name,
  displayName,
  email,
  phone,
  city,
  supplierRank,
  companyType,
  active,
  vat,
  taxId
FROM "Supplier"
WHERE 
  name ILIKE '%kunstmann%' OR 
  displayName ILIKE '%kunstmann%' OR
  name ILIKE '%kun%' OR
  displayName ILIKE '%kun%';

-- ═══════════════════════════════════════════════════════════════
-- 2. TODOS LOS PROVEEDORES ACTIVOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 TODOS LOS PROVEEDORES ACTIVOS' as seccion,
  id,
  name,
  displayName,
  email,
  phone,
  city,
  supplierRank,
  active
FROM "Supplier"
WHERE active = true
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 3. BÚSQUEDA CON TÉRMINO "KUN"
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 BÚSQUEDA CON "KUN"' as seccion,
  id,
  name,
  displayName,
  email,
  phone,
  city,
  supplierRank,
  active
FROM "Supplier"
WHERE 
  active = true AND (
    name ILIKE '%kun%' OR 
    displayName ILIKE '%kun%' OR
    email ILIKE '%kun%' OR
    city ILIKE '%kun%' OR
    phone ILIKE '%kun%'
  )
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 4. BÚSQUEDA CON TÉRMINO "KUNSTMANN"
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 BÚSQUEDA CON "KUNSTMANN"' as seccion,
  id,
  name,
  displayName,
  email,
  phone,
  city,
  supplierRank,
  active
FROM "Supplier"
WHERE 
  active = true AND (
    name ILIKE '%kunstmann%' OR 
    displayName ILIKE '%kunstmann%' OR
    email ILIKE '%kunstmann%' OR
    city ILIKE '%kunstmann%' OR
    phone ILIKE '%kunstmann%'
  )
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════
-- 5. ESTADÍSTICAS DE PROVEEDORES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 ESTADÍSTICAS' as seccion,
  COUNT(*) as total_proveedores,
  COUNT(CASE WHEN active = true THEN 1 END) as activos,
  COUNT(CASE WHEN active = false THEN 1 END) as inactivos,
  COUNT(CASE WHEN name ILIKE '%kun%' OR displayName ILIKE '%kun%' THEN 1 END) as con_kun
FROM "Supplier";

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR CAMPOS REQUERIDOS PARA EL SELECTOR
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔧 CAMPOS PARA SELECTOR' as seccion,
  id,
  name,
  displayName,
  email,
  phone,
  city,
  supplierRank,
  companyType,
  active
FROM "Supplier"
WHERE active = true
ORDER BY name
LIMIT 10; 