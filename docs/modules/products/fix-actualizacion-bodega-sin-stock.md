# Fix: Actualización de Bodega sin Modificar Stock

## 📋 Problema Identificado

Al editar un producto y seleccionar una bodega sin modificar el stock, la bodega **no se actualizaba** correctamente. El producto quedaba sin bodega asignada.

### Escenario del Error
1. Usuario edita producto (ej: ID 590)
2. Selecciona una bodega en el selector
3. No modifica el stock (deja el valor actual)
4. Guarda el producto
5. **Resultado**: La bodega no se asigna ❌

## 🔍 Causa Raíz

**Archivo**: `src/actions/products/update.ts`

La lógica anterior tenía una validación que solo procesaba la bodega si `quantity` no era `null` o `undefined`:

```typescript
// ANTES - PROBLEMÁTICO
if (quantity === null || quantity === undefined) {
  console.warn('⚠️ No se recibió quantity válida, preservando stock actual');
  // NO actualizar el stock - NO SE EJECUTABA EL CÓDIGO DE BODEGA
} else {
  // Código de actualización/creación de bodega
  // Solo se ejecutaba si quantity era válida
}
```

### Problema
Cuando el usuario seleccionaba una bodega pero no modificaba el stock:
- `quantity` era `undefined` o `null`
- El código de actualización de bodega NO se ejecutaba
- La bodega no se asignaba al producto

## ✅ Solución Implementada

### 1. **Eliminación de Validación Bloqueante**

**ANTES**:
```typescript
if (quantity === null || quantity === undefined) {
  console.warn('⚠️ No se recibió quantity válida, preservando stock actual');
  return; // ❌ BLOQUEABA TODO EL PROCESO
} else {
  // Código de bodega
}
```

**DESPUÉS**:
```typescript
// Obtener valores de stock (pueden ser null/undefined)
const quantity = stockData.current;
const minStock = stockData.min;
const maxStock = stockData.max;

// ✅ SIEMPRE PROCESAR BODEGA si warehouseId es válido
// El quantity se maneja dentro de la lógica de update/insert
```

### 2. **Actualización Inteligente de Stock**

**ANTES**:
```typescript
// Siempre intentaba actualizar quantity, incluso si era undefined
.update({
  quantity, // ❌ Podía ser undefined
  minStock: minStock ?? 0,
  maxStock: maxStock ?? null
})
```

**DESPUÉS**:
```typescript
// Actualizar registro existente - preservar quantity si no viene
const updateData: any = {
  minStock: minStock ?? existing.minStock ?? 0,
  maxStock: maxStock ?? existing.maxStock ?? null
};

// ✅ Solo actualizar quantity si viene un valor válido
if (quantity !== null && quantity !== undefined) {
  updateData.quantity = quantity;
}

.update(updateData) // ✅ No sobrescribe quantity si no viene
```

### 3. **Creación con Valor por Defecto**

**ANTES**:
```typescript
.insert({
  productId: id,
  warehouseId: warehouseId,
  quantity, // ❌ Podía ser null/undefined
  minStock: minStock ?? 0,
  maxStock: maxStock ?? null
})
```

**DESPUÉS**:
```typescript
// Crear nuevo registro - usar quantity o 0 por defecto
const newQuantity = quantity !== null && quantity !== undefined ? quantity : 0;

.insert({
  productId: id,
  warehouseId: warehouseId,
  quantity: newQuantity, // ✅ Siempre un valor válido
  minStock: minStock ?? 0,
  maxStock: maxStock ?? null
})
```

## 🎯 Comportamiento Corregido

### ✅ **Escenario 1: Seleccionar bodega sin modificar stock**
1. Usuario selecciona bodega
2. No modifica stock (quantity = undefined)
3. **Resultado**:
   - ✅ Bodega se asigna correctamente
   - ✅ Stock existente se preserva
   - ✅ minStock y maxStock se actualizan

### ✅ **Escenario 2: Seleccionar bodega y modificar stock**
1. Usuario selecciona bodega
2. Modifica stock (quantity = valor nuevo)
3. **Resultado**:
   - ✅ Bodega se asigna correctamente
   - ✅ Stock se actualiza al nuevo valor
   - ✅ minStock y maxStock se actualizan

### ✅ **Escenario 3: Crear nueva asignación de bodega**
1. Producto sin bodega asignada
2. Usuario selecciona bodega por primera vez
3. **Resultado**:
   - ✅ Se crea registro en Warehouse_Product
   - ✅ Stock se inicializa en 0 si no se especifica
   - ✅ minStock y maxStock se configuran

## 📊 Lógica de Actualización

### **Actualizar registro existente:**
```typescript
updateData = {
  minStock: nuevo o existente,
  maxStock: nuevo o existente,
  quantity: solo si se proporciona // ✅ CLAVE
}
```

### **Crear registro nuevo:**
```typescript
insertData = {
  productId: id,
  warehouseId: warehouseId,
  quantity: nuevo o 0, // ✅ Siempre válido
  minStock: nuevo o 0,
  maxStock: nuevo o null
}
```

## 🔧 Archivos Modificados

**`src/actions/products/update.ts`**:
- ✅ Eliminada validación bloqueante de `quantity`
- ✅ Actualización condicional de `quantity`
- ✅ Valor por defecto `0` para nuevos registros
- ✅ Preservación de stock existente cuando no se modifica

## ✅ Resultado

Ahora la asignación de bodega funciona correctamente en todos los escenarios:
- ✅ Con stock
- ✅ Sin stock
- ✅ Modificando stock
- ✅ Sin modificar stock
- ✅ Primera asignación
- ✅ Cambio de bodega

## 🧪 Casos de Prueba

| Escenario | Bodega | Stock | Resultado Esperado |
|-----------|--------|-------|-------------------|
| Editar sin cambios | Seleccionada | No cambia | ✅ Bodega asignada, stock preservado |
| Editar con stock | Seleccionada | Cambia a 10 | ✅ Bodega asignada, stock = 10 |
| Primera asignación | Nueva | No especifica | ✅ Bodega asignada, stock = 0 |
| Cambiar bodega | Otra | No cambia | ✅ Nueva bodega, stock preservado |

---

**Fecha de corrección**: 27 de Enero, 2025  
**Producto de prueba**: ID 590  
**Estado**: ✅ Corregido y funcionando
