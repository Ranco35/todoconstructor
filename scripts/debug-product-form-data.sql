-- ═══════════════════════════════════════════════════════════════
-- 🔍 DEBUG: Verificar Datos del Producto en Formulario
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Verificar qué datos están llegando al formulario

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR DATOS COMPLETOS DEL PRODUCTO
-- ═══════════════════════════════════════════════════════════════

SELECT 
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
-- 2. VERIFICAR SI HAY DATOS EN CACHE O LOCALSTORAGE
-- ═══════════════════════════════════════════════════════════════

-- Los datos del formulario pueden estar siendo sobrescritos por:
-- - localStorage del navegador
-- - Cache del servidor
-- - Valores por defecto del formulario

-- ═══════════════════════════════════════════════════════════════
-- 3. VERIFICAR API ENDPOINT
-- ═══════════════════════════════════════════════════════════════

-- El endpoint que carga los datos del producto debería ser:
-- GET /api/products/[id] o similar

-- ═══════════════════════════════════════════════════════════════
-- 4. SOLUCIÓN TEMPORAL: FORZAR ACTUALIZACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Si los datos están correctos en BD pero no se ven en el formulario:
-- 1. Limpiar cache del navegador (Ctrl+F5)
-- 2. Verificar en DevTools -> Application -> Local Storage
-- 3. Verificar en DevTools -> Network -> ver respuesta de la API

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR CONSOLA DEL NAVEGADOR
-- ═══════════════════════════════════════════════════════════════

-- En el navegador, abrir DevTools (F12) y verificar:
-- - Console: Buscar logs que empiecen con "🔍 DEBUG"
-- - Network: Ver la respuesta de la API que carga el producto
-- - Application: Verificar localStorage

-- ═══════════════════════════════════════════════════════════════
-- 6. COMANDOS PARA VERIFICAR EN EL NAVEGADOR
-- ═══════════════════════════════════════════════════════════════

/*
En la consola del navegador, ejecutar:

// Verificar datos del formulario
console.log('FormData actual:', formData);

// Verificar initialData
console.log('InitialData:', initialData);

// Verificar localStorage
console.log('localStorage:', localStorage.getItem('product-form-data'));

// Limpiar cache si es necesario
localStorage.removeItem('product-form-data');
*/ 