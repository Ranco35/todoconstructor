# 📝 Instrucciones: Cambios en Sistema POS

**Fecha:** 2025-01-26  
**Cambios realizados:** Renombrar POS y diagnosticar productos sin categorías

---

## ✅ Cambios Completados en el Frontend

Se actualizaron todos los componentes React para cambiar los nombres:

### **Cambios de Nombres:**
- ❌ ~~Recepción~~ → ✅ **Ventas** 
- ❌ ~~Restaurante~~ → ✅ **Ventas2**

### **Archivos Actualizados:**

1. ✅ `src/components/pos/ReceptionPOS.tsx`
2. ✅ `src/components/pos/RestaurantPOS.tsx`
3. ✅ `src/components/pos/POSCategorySelector.tsx`
4. ✅ `src/components/pos/POSCategoryForm.tsx`
5. ✅ `src/components/pos/POSCategoryTable.tsx`
6. ✅ `src/components/pos/POSCategoryManager.tsx`
7. ✅ `src/components/pos/POSCategoryDoubleSelector.tsx`

---

## 🔧 Cambios Pendientes en la Base de Datos

### **Paso 1: Actualizar nombres en Supabase**

Ejecuta el siguiente SQL en **Supabase SQL Editor**:

```bash
# Archivo a ejecutar:
cambiar_nombres_pos.sql
```

Este script:
- ✅ Cambia `displayName` de "Recepción" a "Ventas"
- ✅ Cambia `displayName` de "Restaurante" a "Ventas2"
- ✅ Actualiza la función `generate_sale_number()` para usar prefijos VEN y VEN2
- ✅ Verifica los cambios

### **Paso 2: Diagnosticar productos sin categorías**

Ejecuta el siguiente SQL en **Supabase SQL Editor**:

```bash
# Archivo a ejecutar:
diagnosticar_productos_pos.sql
```

Este script te mostrará:
1. ✅ Categorías POS activas
2. ✅ Productos POS activos con sus categorías
3. ⚠️ Productos SIN categoría válida (el problema)
4. ✅ Productos habilitados en `Product` pero no sincronizados
5. 📊 Conteo por categoría
6. 📊 Resumen general
7. 📋 Detalle completo por categoría

---

## 🔍 Posibles Problemas y Soluciones

### **Problema 1: Productos sin categoría**

**Síntoma:** Los productos no aparecen en el POS

**Diagnóstico:**
```sql
-- Ver productos sin categoría válida
SELECT * FROM "POSProduct" 
WHERE "isActive" = true 
  AND ("categoryId" IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM "POSProductCategory" 
      WHERE "id" = "POSProduct"."categoryId" AND "isActive" = true
    )
  );
```

**Solución:** Asignar categoría válida a los productos:
```sql
-- Asignar productos a una categoría por defecto
-- Ejemplo: Asignar a la primera categoría de Ventas
UPDATE "POSProduct" p
SET "categoryId" = (
  SELECT "id" FROM "POSProductCategory" 
  WHERE "cashRegisterTypeId" = 1 
    AND "isActive" = true 
  ORDER BY "sortOrder" 
  LIMIT 1
)
WHERE p."isActive" = true 
  AND (p."categoryId" IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM "POSProductCategory" c 
      WHERE c."id" = p."categoryId" AND c."isActive" = true
    )
  );
```

### **Problema 2: Productos habilitados pero no sincronizados**

**Síntoma:** Productos marcados como `isPOSEnabled = true` en la tabla `Product` pero no aparecen en `POSProduct`

**Diagnóstico:**
```sql
-- Ver productos habilitados pero NO sincronizados
SELECT pr."id", pr."name" 
FROM "Product" pr
WHERE pr."isPOSEnabled" = true
  AND NOT EXISTS (
    SELECT 1 FROM "POSProduct" 
    WHERE "productId" = pr."id" AND "isActive" = true
  );
```

**Solución Automática:** Usar la función de sincronización en el backend:

```typescript
// Desde el código TypeScript o desde la consola del navegador:
import { syncPOSProducts } from '@/actions/pos/pos-actions'

const result = await syncPOSProducts()
console.log(result)
```

### **Problema 3: Categorías inactivas**

**Síntoma:** Los productos están asignados a categorías inactivas

**Diagnóstico:**
```sql
-- Ver categorías inactivas con productos
SELECT 
  c."id",
  c."displayName",
  c."isActive",
  COUNT(p."id") as productos_afectados
FROM "POSProductCategory" c
INNER JOIN "POSProduct" p ON p."categoryId" = c."id"
WHERE c."isActive" = false AND p."isActive" = true
GROUP BY c."id", c."displayName", c."isActive";
```

**Solución:** Activar las categorías o reasignar productos:
```sql
-- Opción A: Activar las categorías
UPDATE "POSProductCategory"
SET "isActive" = true
WHERE "id" IN (/* IDs de categorías a activar */);

-- Opción B: Reasignar productos a categorías activas
-- Ver problema 1 arriba
```

---

## 📊 Verificar que Todo Funciona

### **1. Verificar Nombres en la Base de Datos**
```sql
SELECT "id", "name", "displayName", "description" 
FROM "CashRegisterType" 
ORDER BY "id";
```

**Resultado esperado:**
| id | name        | displayName | description                   |
|----|-------------|-------------|-------------------------------|
| 1  | recepcion   | Ventas      | Punto de ventas principal     |
| 2  | restaurante | Ventas2     | Punto de ventas secundario    |

### **2. Verificar Categorías con Productos**
```sql
SELECT 
  CASE WHEN c."cashRegisterTypeId" = 1 THEN 'Ventas' ELSE 'Ventas2' END as pos,
  c."displayName" as categoria,
  COUNT(p."id") as productos
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
WHERE c."isActive" = true
GROUP BY c."cashRegisterTypeId", c."displayName"
ORDER BY c."cashRegisterTypeId", c."displayName";
```

### **3. Verificar en el Frontend**

1. Abre el navegador
2. Ve a `/dashboard/pos/recepcion` 
3. **Deberías ver:** "POS Ventas" en el título
4. **Deberías ver:** Productos organizados por categorías
5. Ve a `/dashboard/pos/restaurante`
6. **Deberías ver:** "POS Ventas2" en el título
7. **Deberías ver:** Productos organizados por categorías

---

## 🚀 Pasos Completos para Ejecutar

### **Opción 1: Ejecutar SQL Manualmente (Recomendado)**

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta `cambiar_nombres_pos.sql` (cambiar nombres)
3. Ejecuta `diagnosticar_productos_pos.sql` (ver estado)
4. Revisa los resultados y aplica las correcciones necesarias

### **Opción 2: Migración de Supabase**

Si quieres crear una migración permanente:

```bash
# 1. Crear nueva migración
npx supabase migration new actualizar_nombres_pos

# 2. Copiar el contenido de cambiar_nombres_pos.sql al nuevo archivo

# 3. Aplicar migración
npx supabase db push
```

---

## 📁 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `cambiar_nombres_pos.sql` | SQL para actualizar nombres en BD |
| `diagnosticar_productos_pos.sql` | SQL de diagnóstico completo |
| `actualizar_nombres_pos.js` | Script Node.js (alternativa) |
| `actualizar_pos_nombres_y_revisar_productos.sql` | SQL completo con revisión |
| `INSTRUCCIONES_CAMBIOS_POS.md` | Este documento |

---

## ✅ Checklist Final

- [ ] Ejecutar `cambiar_nombres_pos.sql` en Supabase
- [ ] Ejecutar `diagnosticar_productos_pos.sql` en Supabase
- [ ] Revisar resultados del diagnóstico
- [ ] Corregir productos sin categoría (si los hay)
- [ ] Sincronizar productos habilitados (si faltan)
- [ ] Verificar en frontend: `/dashboard/pos/recepcion` muestra "POS Ventas"
- [ ] Verificar en frontend: `/dashboard/pos/restaurante` muestra "POS Ventas2"
- [ ] Verificar que productos aparecen en categorías
- [ ] Hacer una venta de prueba en cada POS
- [ ] Verificar que números de venta usan nuevos prefijos (VEN, VEN2)

---

## 🆘 Problemas Comunes

### "No veo productos en el POS"

1. Ejecuta `diagnosticar_productos_pos.sql`
2. Revisa la sección "⚠️ PRODUCTOS SIN CATEGORÍA VÁLIDA"
3. Asigna categorías válidas a esos productos
4. Recarga la página del POS

### "Los nombres no cambiaron en el frontend"

1. Limpia caché del navegador (Ctrl + Shift + R)
2. Verifica que el servidor Next.js se haya reiniciado
3. Verifica que los cambios en los archivos `.tsx` se guardaron

### "Los números de venta siguen usando REC y REST"

1. Verifica que ejecutaste la actualización de la función `generate_sale_number()`
2. Reinicia Supabase local si es necesario

---

## 📞 Siguiente Paso

**Ejecuta primero:**
```bash
cambiar_nombres_pos.sql
```

**Luego diagnóstica:**
```bash
diagnosticar_productos_pos.sql
```

**Y reporta:** Los resultados del diagnóstico para ayudarte con las correcciones.

