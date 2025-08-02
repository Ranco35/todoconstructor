# Error 500 en Exportación de Productos - RESUELTO

## Problema
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Error exportando productos: Error: Error al exportar productos
```

## Causa Raíz
El código de exportación en `src/actions/products/export.ts` intentaba acceder a columnas que no existen en la tabla `Product`:

1. **Columna `type`**: El código intentaba acceder a `product.type` pero esta columna no existe en la tabla
2. **Mapeo incorrecto de `categoryId`**: Usaba `product.Category?.id` en lugar de `product.categoryid`
3. **Mapeo incorrecto de `supplierId`**: Usaba `product.Supplier?.id` en lugar de `product.supplierid`

## Estructura Real de la Tabla Product
Según el esquema en `supabase/migrations/20250623003309_initial_schema.sql`, la tabla `Product` tiene estas columnas:

```sql
CREATE TABLE IF NOT EXISTS "Product" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "barcode" TEXT,
  "description" TEXT,
  "categoryid" BIGINT REFERENCES "Category"("id"),
  "brand" TEXT,
  "image" TEXT,
  "costprice" DECIMAL(10,2),
  "saleprice" DECIMAL(10,2),
  "vat" DECIMAL(5,2),
  "supplierid" BIGINT REFERENCES "Supplier"("id"),
  "supplierCode" TEXT,
  "defaultCostCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

## Solución Implementada

### 1. Corregir la función `getProductsForExport()`

**Antes:**
```typescript
return (products || []).map(product => ({
  // ...
  type: product.type || null, // ❌ Columna no existe
  categoryId: product.Category?.id || null, // ❌ Mapeo incorrecto
  supplierId: product.Supplier?.id || null, // ❌ Mapeo incorrecto
  // ...
}));
```

**Después:**
```typescript
return (products || []).map(product => ({
  // ...
  type: null, // ✅ La tabla Product no tiene columna 'type'
  categoryId: product.categoryid || null, // ✅ Usar columna real
  supplierId: product.supplierid || null, // ✅ Usar columna real
  // ...
}));
```

### 2. Verificación de la Solución

Se creó un script de prueba `scripts/test-product-export.js` que verifica:

1. ✅ Conexión a la base de datos
2. ✅ Consulta de productos con joins
3. ✅ Transformación de datos
4. ✅ Validación de datos
5. ✅ API de exportación funcional

**Resultado de la prueba:**
```
🎉 ¡Prueba de exportación completada exitosamente!
📄 Archivo generado: 18,285 bytes
📊 Tipo: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

## Archivos Modificados

1. **`src/actions/products/export.ts`**
   - Corregida función `getProductsForExport()`
   - Mapeo correcto de columnas de la base de datos

2. **`scripts/test-product-export.js`** (nuevo)
   - Script de prueba para verificar la funcionalidad

3. **`scripts/check-product-table.js`** (nuevo)
   - Script para verificar la estructura de la tabla Product

## Verificación

Para verificar que el problema está resuelto:

1. **Desde la interfaz web:**
   - Ir a `/dashboard/configuration/products`
   - Hacer clic en "Importar / Exportar Productos"
   - Hacer clic en "Exportar a Excel"
   - El archivo se descarga correctamente

2. **Desde la línea de comandos:**
   ```bash
   node scripts/test-product-export.js
   ```

3. **Directamente la API:**
   ```bash
   curl http://localhost:3000/api/products/export
   ```

## Prevención de Errores Similares

1. **Siempre verificar el esquema de la base de datos** antes de escribir código que accede a columnas
2. **Usar scripts de verificación** para validar la estructura de tablas
3. **Mantener sincronizados** el código y el esquema de la base de datos
4. **Documentar cambios** en la estructura de la base de datos

## Estado Final

✅ **PROBLEMA RESUELTO**
- Exportación de productos funciona correctamente
- API responde con código 200
- Archivo Excel se genera y descarga sin errores
- Todos los datos se mapean correctamente desde la base de datos

---
*Resuelto el 27 de Junio de 2025* 