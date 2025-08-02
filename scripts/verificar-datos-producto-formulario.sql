-- ═══════════════════════════════════════════════════════════════
-- 🔍 VERIFICAR DATOS DEL PRODUCTO EN FORMULARIO
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR DATOS ACTUALES EN BD
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'DATOS EN BD' as tipo,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type,
  sku,
  brand,
  description,
  costprice,
  saleprice,
  vat,
  categoryid,
  supplierid,
  isPOSEnabled,
  isForSale,
  "createdAt",
  "updatedAt"
FROM "Product" 
WHERE name LIKE '%QUESO MANTECOSO RIO BUENO%';

-- ═══════════════════════════════════════════════════════════════
-- 2. VERIFICAR SI HAY PROBLEMAS DE CACHE
-- ═══════════════════════════════════════════════════════════════

-- Los datos pueden estar siendo sobrescritos por:
-- - Cache del navegador
-- - localStorage del formulario
-- - Valores por defecto del código

-- ═══════════════════════════════════════════════════════════════
-- 3. SOLUCIÓN: FORZAR ACTUALIZACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Si los datos están correctos en BD pero no se ven en el formulario:

-- PASO 1: Limpiar cache del navegador
-- - Presionar Ctrl+F5 (hard refresh)
-- - O ir a DevTools -> Network -> Disable cache

-- PASO 2: Verificar localStorage
-- - Abrir DevTools (F12)
-- - Ir a Application -> Local Storage
-- - Buscar y eliminar cualquier dato relacionado con el formulario

-- PASO 3: Verificar en consola
-- - En DevTools -> Console, ejecutar:
--   console.log('FormData:', formData);
--   console.log('InitialData:', initialData);

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR API RESPONSE
-- ═══════════════════════════════════════════════════════════════

-- En DevTools -> Network, buscar la llamada a la API que carga el producto
-- Verificar que la respuesta incluya:
-- {
--   "id": 1060,
--   "name": "QUESO MANTECOSO RIO BUENO",
--   "unit": "Kilogramo",
--   "salesunitid": 2,
--   "purchaseunitid": 2
-- }

-- ═══════════════════════════════════════════════════════════════
-- 5. COMANDOS PARA DEBUG EN NAVEGADOR
-- ═══════════════════════════════════════════════════════════════

/*
En la consola del navegador, ejecutar estos comandos:

// 1. Verificar datos del formulario
console.log('🔍 FormData actual:', formData);

// 2. Verificar initialData
console.log('🔍 InitialData:', initialData);

// 3. Verificar localStorage
console.log('🔍 localStorage:', localStorage.getItem('product-form-data'));

// 4. Limpiar cache si es necesario
localStorage.removeItem('product-form-data');

// 5. Recargar página
location.reload();
*/ 