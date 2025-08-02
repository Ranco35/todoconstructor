# Problema Resuelto: Productos No Preseleccionados en Edición de Facturas

## 📋 Problema Original

Al editar facturas de compra, los productos no aparecían preseleccionados en el `ProductSelectorForInvoice`, aunque los datos se cargaban correctamente en las líneas individuales.

## 🔍 Diagnóstico

Los logs de debug revelaron que:

1. ✅ Las líneas se mapeaban correctamente desde la base de datos
2. ✅ Los datos llegaban al formulario 
3. ❌ El `productId` siempre era `NULL` en el mapeo
4. ❌ El selector siempre recibía `Array(0)` productos

### Causa Raíz Identificada

**La consulta SQL en `getPurchaseInvoiceById()` no incluía el campo `product_id`** en la selección de `purchase_invoice_lines`.

```sql
-- ANTES (INCORRECTO)
purchase_invoice_lines (
  id,
  description,        -- ❌ Faltaba product_id
  product_code,
  quantity,
  // ... otros campos
)

-- DESPUÉS (CORREGIDO)
purchase_invoice_lines (
  id,
  product_id,         -- ✅ Campo agregado
  description,
  product_code,
  quantity,
  // ... otros campos
)
```

## ✅ Solución Implementada

### 1. Corrección en la Base de Datos

**Archivo:** `src/actions/purchases/purchase-invoices.ts`

```typescript
// Línea ~340 en función getPurchaseInvoiceById()
purchase_invoice_lines (
  id,
  product_id,           // ← Campo agregado
  description,
  product_code,
  quantity,
  unit_price,
  discount_percent,
  discount_amount,
  tax_rate,
  tax_amount,
  line_total,
  line_order,
  Product (
    id,
    name,
    sku
  )
),
```

### 2. Simplificación de Logs

Eliminados logs de debug extensos y mantenidos solo logs informativos:

- `✅ Línea X mapeada con productId: [ID]`
- `🔥 CARGANDO INITIAL DATA con X líneas`
- `🔥 ENVIANDO AL SELECTOR: X productos seleccionados`
- `🔍 ProductSelector recibió X productos seleccionados`

### 3. Mejora Visual

Agregado indicador visual simple:
```jsx
{formData.lines.filter(line => line.productId).length > 0 && (
  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
    ✅ <strong>{formData.lines.filter(line => line.productId).length} producto(s) preseleccionado(s)</strong>
  </div>
)}
```

## 🎯 Resultado

- **✅ Productos se preseleccionan correctamente** en el `ProductSelectorForInvoice`
- **✅ Mapeo de `productId`** funciona desde base de datos hasta frontend
- **✅ Experiencia consistente** entre creación y edición de facturas
- **✅ Logs limpios** pero informativos para debugging futuro

## 📝 Lecciones Aprendidas

1. **Verificar consultas SQL completas**: Siempre revisar que todos los campos necesarios estén incluidos en las consultas SELECT
2. **Debugging sistemático**: Los logs detallados revelaron exactamente dónde se perdía la información
3. **Mapeo de datos**: El problema no estaba en el frontend sino en el origen de los datos
4. **Importancia de campos JOIN**: Aunque el JOIN con `Product` funcionaba, el `product_id` directo era necesario para el mapeo

## 🔗 Archivos Modificados

- `src/actions/purchases/purchase-invoices.ts` - Consulta SQL corregida
- `src/app/dashboard/purchases/invoices/[id]/edit/page.tsx` - Logs simplificados  
- `src/components/purchases/PurchaseInvoiceForm.tsx` - Debug mejorado
- `src/components/purchases/ProductSelectorForInvoice.tsx` - Logs simplificados 