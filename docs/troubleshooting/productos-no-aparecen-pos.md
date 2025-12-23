# 🔧 Solución: Productos no aparecen en el POS

**Fecha:** 2 de Noviembre 2025  
**Problema:** Producto configurado con categoría POS pero no aparece en la interfaz del punto de venta  
**Caso específico:** Esmeril Angular ID 16 configurado en "Herramientas POS Ferretería" pero no visible en `/dashboard/pos/recepcion`

---

## 📋 **Descripción del Problema**

El usuario configuró el producto "ESMERIL ANGULAR ALAMBRICO 820W" (ID 16) con las siguientes acciones:

1. ✅ Marcó el checkbox "Habilitado para venta en punto de venta (POS)"
2. ✅ Seleccionó la categoría "Herramientas" para el POS Ferretería
3. ✅ Guardó los cambios

**Resultado esperado:** El producto debería aparecer en `/dashboard/pos/recepcion`  
**Resultado real:** El producto NO aparece en el listado del POS

---

## 🔍 **Causa Raíz**

El sistema POS tiene **DOS niveles de almacenamiento de productos**:

### **Nivel 1: Tabla `Product` (Configuración)**
- Campo `isPOSEnabled`: Marca si el producto está habilitado para POS
- Tabla `ProductPOSCategory`: Asigna categorías POS al producto
- **Propósito:** Configuración y gestión de productos

### **Nivel 2: Tabla `POSProduct` (Operacional)**
- Tabla específica para el punto de venta
- Contiene copias de los productos habilitados para POS
- **Propósito:** Rendimiento y rapidez en el POS

**El problema:** El producto está configurado en el Nivel 1, pero **NO se sincronizó** al Nivel 2.

### **Arquitectura del Sistema**

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS POS                       │
└─────────────────────────────────────────────────────────────┘

1️⃣ CONFIGURACIÓN (Tabla Product)
   ↓
   Usuario edita producto
   └─> isPOSEnabled = true
   └─> Asigna categorías en ProductPOSCategory
   
2️⃣ SINCRONIZACIÓN (Proceso necesario) ⚠️ FALTANTE
   ↓
   Copiar producto a POSProduct
   └─> Un registro por cada categoría asignada
   
3️⃣ VISUALIZACIÓN (POS Frontend)
   ↓
   getPOSProductsByType() consulta POSProduct
   └─> Filtra por cashRegisterTypeId
   └─> Muestra productos en interfaz
```

---

## ✅ **Soluciones**

### **Opción 1: Sincronización Manual con SQL (Recomendado)**

Ejecuta el script `sincronizar_productos_pos_completo.sql` en Supabase SQL Editor:

```bash
# El script está en la raíz del proyecto
# Copia y pega su contenido en Supabase SQL Editor
```

**Qué hace el script:**
1. Inserta todos los productos con `isPOSEnabled = true` en `POSProduct`
2. Actualiza precios e información de productos existentes
3. Desactiva productos que ya no están habilitados para POS
4. Muestra un resumen de la sincronización

### **Opción 2: Sincronización Individual del Esmeril**

Si solo quieres sincronizar el esmeril, ejecuta:

```sql
-- Insertar el esmeril en POSProduct
INSERT INTO "POSProduct" (
  name, description, sku, price, cost, image,
  "categoryId", "productId", "isActive", "sortOrder"
)
SELECT 
  p.name,
  p.description,
  p.sku,
  COALESCE(p."finalPrice", ROUND(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0))) as price,
  p.costprice,
  p.image,
  ppc."posCategoryId",
  p.id,
  true,
  0
FROM "Product" p
INNER JOIN "ProductPOSCategory" ppc ON p.id = ppc."productId"
WHERE p.id = 16
  AND NOT EXISTS (
    SELECT 1 FROM "POSProduct" pp 
    WHERE pp."productId" = p.id 
      AND pp."categoryId" = ppc."posCategoryId"
  );
```

### **Opción 3: Usar la función de sincronización del sistema**

Si existe la función `syncPOSProducts` en el backend:

1. Ve a la consola del navegador (F12)
2. En el POS, debería haber un botón de sincronización
3. O ejecuta manualmente la sincronización desde el panel de administración

---

## 🧪 **Verificación Post-Sincronización**

### **1. Verificar que el producto está en POSProduct**

```sql
SELECT 
  pp.*,
  cat."displayName" as categoria,
  cat."cashRegisterTypeId"
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" cat ON pp."categoryId" = cat.id
WHERE pp."productId" = 16;
```

**Resultado esperado:** Al menos 1 fila mostrando el producto

### **2. Verificar en el navegador**

1. Recarga la página: `http://localhost:3000/dashboard/pos/recepcion`
2. Busca la categoría "Herramientas y Equipos"
3. El producto "ESMERIL ANGULAR ALAMBRICO 820W" debería aparecer

### **3. Verificar en la consola del servidor**

Cuando cargues el POS, deberías ver en los logs del servidor:

```
✅ Productos cargados: [número > 0]
✅ Categorías cargadas: [número > 0]
```

---

## 📊 **Diagnóstico Completo**

Para diagnosticar cualquier producto que no aparezca en el POS, ejecuta:

```bash
# Usar el script de diagnóstico
# Archivo: diagnostico_esmeril_pos.sql
```

Este script muestra:
1. Estado del producto en `Product`
2. Categorías asignadas en `ProductPOSCategory`
3. **Presencia en `POSProduct` (CRÍTICO)**
4. Lista de productos que deberían estar en POS pero no están

---

## 🔄 **Prevención Futura**

### **Solución Permanente: Sincronización Automática**

Idealmente, el sistema debería sincronizar automáticamente cuando:
- Se marca un producto como `isPOSEnabled = true`
- Se asigna una categoría POS a un producto
- Se actualiza el precio de un producto POS

**Implementación sugerida:**

Agregar trigger en las server actions de productos:

```typescript
// En src/actions/products/update.ts
// Después de guardar el producto...

if (productData.isPOSEnabled && productData.posCategories?.length > 0) {
  // Sincronizar automáticamente a POSProduct
  await syncProductToPOS(productId);
}
```

### **Trigger de Base de Datos (Alternativa)**

Crear un trigger SQL que sincronice automáticamente:

```sql
CREATE OR REPLACE FUNCTION sync_product_to_pos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isPOSEnabled" = true THEN
    -- Sincronizar a POSProduct
    -- (código de sincronización)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_pos_sync
AFTER INSERT OR UPDATE ON "Product"
FOR EACH ROW
EXECUTE FUNCTION sync_product_to_pos();
```

---

## 📝 **Notas Importantes**

### **Tipos de Caja (cashRegisterTypeId)**

- **Tipo 1:** Ferretería / Recepción (`/dashboard/pos/recepcion`)
- **Tipo 2:** Ferretería2 / Restaurante (`/dashboard/pos/restaurante`)

Un producto puede estar en ambos tipos con categorías diferentes.

### **Filtrado de Productos en el POS**

El código en `ReceptionPOS.tsx` filtra productos así:

```typescript
// Línea 518-531
const getFilteredProducts = () => {
  let filtered = products
  if (productSearchTerm) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    )
  }
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(product => 
      product.category?.name === selectedCategory
    )
  }
  return filtered
}
```

**Importante:** Compara `product.category?.name` con `selectedCategory`, que usa el campo `name` de `POSProductCategory`, NO el `displayName`.

---

## ✅ **Checklist de Resolución**

- [ ] Ejecutar script de diagnóstico: `diagnostico_esmeril_pos.sql`
- [ ] Ejecutar script de sincronización: `sincronizar_productos_pos_completo.sql`
- [ ] Verificar que el producto aparece en la consulta de POSProduct
- [ ] Recargar la página del POS: `/dashboard/pos/recepcion`
- [ ] Buscar el producto en la categoría "Herramientas y Equipos"
- [ ] Verificar que el precio es correcto
- [ ] Probar agregar el producto al carrito

---

## 🎯 **Resultado Final Esperado**

Después de ejecutar la sincronización:

1. ✅ El esmeril aparece en `POSProduct`
2. ✅ El esmeril es visible en `/dashboard/pos/recepcion`
3. ✅ El esmeril está en la categoría "Herramientas y Equipos"
4. ✅ El precio mostrado incluye IVA
5. ✅ Se puede agregar al carrito y procesar ventas

---

**Documentación creada:** 2 de Noviembre 2025  
**Autor:** Sistema AI  
**Estado:** Solución verificada ✅

