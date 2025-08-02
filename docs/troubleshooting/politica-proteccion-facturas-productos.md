# Política de Protección de Productos en Facturas

## 🚨 Principio Fundamental

**LOS PRODUCTOS QUE ESTÁN EN FACTURAS NO SE PUEDEN ELIMINAR BAJO NINGUNA CIRCUNSTANCIA**

Las facturas son documentos legales y financieros con implicaciones fiscales y contables. Una vez emitidas, no se pueden modificar ni eliminar.

---

## 📋 Contexto del Problema

### Problema Original
- Los usuarios experimentaban errores de restricción de clave foránea al eliminar productos
- El sistema no verificaba si los productos estaban en facturas antes de la eliminación
- Esto podía comprometer la integridad de documentos legales

### Solución Implementada
Se agregó **protección total** contra la eliminación de productos que están en facturas.

---

## 🛡️ Tipos de Protección Implementada

### 1. Verificación en Eliminación Individual
```typescript
// En src/actions/products/list.ts - deleteProduct()
if (dependencyCheck.hasInvoices) {
  return { 
    success: false, 
    error: `❌ NO se puede eliminar "${product.name}" porque está en facturas emitidas`,
    hasInvoices: true,
    canForceDelete: false  // ← CRÍTICO: No se permite forzar
  };
}
```

### 2. Verificación en Eliminación Masiva  
```typescript
// En src/actions/products/bulk-delete.ts
if (hasInvoices) {
  errors.push(`${product.name}: No se puede eliminar (está en facturas)`);
  continue; // ← Se omite del proceso de eliminación
}
```

### 3. Verificación de Dependencias Ampliada
```typescript
// En checkProductDependencies()
const dependencies = {
  // ... otras dependencias
  invoiceLines: invoiceLinesResult.count || 0,           // ← Facturas de ventas
  purchaseInvoiceLines: purchaseInvoiceLinesResult.count || 0  // ← Facturas de compras
};
```

---

## 🔍 Tablas de Facturas Protegidas

### 1. Facturas de Ventas
- **Tabla**: `invoice_lines`
- **Campo**: `product_id` → `Product.id`
- **Propósito**: Líneas de productos en facturas emitidas a clientes

### 2. Facturas de Compras
- **Tabla**: `purchase_invoice_lines`  
- **Campo**: `product_id` → `Product.id`
- **Propósito**: Líneas de productos en facturas recibidas de proveedores

---

## ⚠️ Comportamiento del Sistema

### ✅ Productos SIN Facturas
- **Eliminación Individual**: ✅ Permitida (con verificación de otras dependencias)
- **Eliminación Forzada**: ✅ Permitida
- **Eliminación Masiva**: ✅ Permitida

### 🚫 Productos CON Facturas
- **Eliminación Individual**: ❌ **PROHIBIDA** (incluso forzada)
- **Eliminación Forzada**: ❌ **PROHIBIDA** 
- **Eliminación Masiva**: ❌ **OMITIDO** con mensaje de error

### 📝 Mensaje de Error Estándar
```
❌ NO se puede eliminar "[PRODUCTO]" porque está en facturas emitidas:
• X líneas de facturas de ventas
• Y líneas de facturas de compras

🚨 Las facturas son documentos legales que no se pueden modificar.
💡 Si necesita descontinuar el producto, márquelo como inactivo en lugar de eliminarlo.
```

---

## 🔧 Herramientas de Diagnóstico

### Script de Verificación
**Archivo**: `scripts/verificar-productos-en-facturas.sql`

**Propósito**: 
- Identificar productos que están en facturas
- Cuantificar el impacto de las restricciones
- Listar productos "eliminables" vs "protegidos"

**Uso**:
```sql
-- Ejecutar para ver resumen ejecutivo
SELECT * FROM (...) ORDER BY seccion, descripcion;
```

---

## 💡 Alternativas Recomendadas

### Para Productos que NO se Venden Más

#### ✅ Opción 1: Marcar como Inactivo
```sql
UPDATE "Product" 
SET "isActive" = false 
WHERE id = [PRODUCT_ID];
```

#### ✅ Opción 2: Descontinuar
```sql
UPDATE "Product" 
SET "status" = 'discontinued',
    "isActive" = false
WHERE id = [PRODUCT_ID];
```

#### ✅ Opción 3: Ocultar del POS
```sql
UPDATE "Product" 
SET "isPOSEnabled" = false 
WHERE id = [PRODUCT_ID];
```

### ❌ NO Hacer Nunca
- Eliminar registros de facturas para poder eliminar el producto
- Modificar restricciones de clave foránea para permitir eliminación
- Usar eliminación forzada directa en base de datos

---

## 📊 Impacto y Estadísticas

### Dependencias Verificadas (Orden de Prioridad)

1. **🚫 CRÍTICAS (No eliminables)**:
   - `invoice_lines` - Facturas de ventas
   - `purchase_invoice_lines` - Facturas de compras

2. **⚠️ FORZABLES (Eliminables con confirmación)**:
   - `Warehouse_Product` - Asignaciones en bodegas
   - `Sale_Product` - Productos en ventas 
   - `Reservation_Product` - Productos en reservas
   - `Product_Component` - Componentes de productos
   - `PettyCashPurchase` - Compras de caja menor
   - `POSProduct` - Productos en punto de venta

---

## 🎯 Casos de Uso

### Caso 1: Producto Solo en Inventario
```
🔍 Dependencias: Solo Warehouse_Product
✅ Resultado: Eliminable con confirmación
```

### Caso 2: Producto en Ventas Históricas
```
🔍 Dependencias: Sale_Product
✅ Resultado: Eliminable forzado (previa confirmación)
```

### Caso 3: Producto en Facturas
```
🔍 Dependencias: invoice_lines
🚫 Resultado: NO ELIMINABLE - Marcar como inactivo
```

### Caso 4: Eliminación Masiva con Mix
```
📦 100 productos seleccionados
✅ 75 eliminados exitosamente
🚫 25 omitidos (están en facturas)
📊 Reporte detallado de errores
```

---

## 🚀 Archivos Modificados

### Código Principal
1. **`src/actions/products/list.ts`**
   - `checkProductDependencies()` - Verificación ampliada
   - `deleteProduct()` - Protección de facturas

2. **`src/actions/products/bulk-delete.ts`**
   - `bulkDeleteProducts()` - Verificación individual

### Herramientas de Diagnóstico
3. **`scripts/verificar-productos-en-facturas.sql`** *(NUEVO)*
   - Análisis completo de productos en facturas

### Documentación
4. **`docs/troubleshooting/solucion-error-eliminacion-productos-posproduct.md`**
5. **`docs/troubleshooting/politica-proteccion-facturas-productos.md`** *(NUEVO)*

---

## ✅ Beneficios de la Implementación

🛡️ **Protección Legal**: Las facturas no se pueden alterar inadvertidamente  
📊 **Integridad Financiera**: Los datos contables permanecen íntegros  
🔍 **Transparencia**: Mensajes claros sobre por qué no se puede eliminar  
💡 **Alternativas**: Guía clara sobre qué hacer en su lugar  
🎯 **Granularidad**: Verificación individual en eliminación masiva  
📈 **Auditabilidad**: Logs detallados de intentos de eliminación

---

## 🎉 Resultado Final

✅ **Seguridad Financiera Garantizada**  
✅ **Cumplimiento Legal Asegurado**  
✅ **Experiencia de Usuario Mejorada**  
✅ **Integridad de Datos Preservada** 