# Solución: Stock en Cero al Editar Producto

**Fecha:** 2025-10-02  
**Módulo:** Productos (Product)  
**Archivo afectado:** `src/actions/products/update.ts`  
**Estado:** ✅ RESUELTO

---

## 🔍 Problema Identificado

Cuando se editaba un producto (cualquier campo: nombre, precio, categoría, etc.), el **stock se reseteaba automáticamente a 0** sin importar qué campo se modificara.

### Síntomas
- Usuario edita el nombre de un producto que tiene 50 unidades en stock
- Al guardar, el stock se vuelve 0 unidades
- Pérdida de datos críticos de inventario

---

## 🐛 Causa Raíz

En el archivo `src/actions/products/update.ts`, línea 187, se encontró este código problemático:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO:
const quantity = stockData.current || 0;  
const minStock = stockData.min || 0;
const maxStock = stockData.max || null;

// Problema:
// Si stockData.current es null o undefined → se convierte a 0
// Si el formulario no envía los datos de stock → quantity = 0
// Se actualiza la base de datos con 0 → Stock perdido
```

### ¿Por qué sucedía?

El operador `||` (OR lógico) fuerza un valor por defecto cuando el valor es "falsy":
- Si `stockData.current` es `null` → `quantity = 0`
- Si `stockData.current` es `undefined` → `quantity = 0`
- Si `stockData.current` es `0` → `quantity = 0` (correcto)

Pero el problema es que cuando NO SE ENVÍAN datos de stock desde el formulario (porque solo se está editando otro campo), `stockData.current` es `undefined` y se fuerza a `0`, sobrescribiendo el stock actual en la base de datos.

---

## ✅ Solución Aplicada

### 1. Corrección Principal - NO Forzar a 0

```typescript
// ✅ CÓDIGO CORREGIDO:
const quantity = stockData.current;
const minStock = stockData.min;
const maxStock = stockData.max;

// Validar que quantity sea un número válido
if (quantity === null || quantity === undefined) {
    console.warn('⚠️ No se recibió quantity válida, preservando stock actual');
    // NO actualizar el stock - preservar el valor actual en la BD
    // Continuar con el resto del proceso sin tocar Warehouse_Product
} else {
    // Solo proceder con la actualización si hay datos válidos
    console.log('🔍 DEBUG - Procesando stock para producto:', {
        productId: id,
        warehouseId,
        quantity,
        minStock: minStock ?? 0,
        maxStock: maxStock ?? null
    });
    
    // ... resto del código de actualización de stock
}
```

### 2. Lógica de Preservación

**Principio clave:** "Si no recibes un dato válido del formulario, NO LO ACTUALICES en la base de datos"

```typescript
// Validación explícita en lugar de operador ||
if (quantity === null || quantity === undefined) {
    // NO hacer UPDATE - preservar el stock actual
    return;
}

// Si llegamos aquí, los datos son válidos - proceder con la actualización
// Se actualiza Warehouse_Product solo con datos válidos
```

---

## 🎯 Cambios Realizados

### Archivo: `src/actions/products/update.ts`

**Líneas modificadas:** 187-205

#### Antes:
```typescript
const quantity = stockData.current || 0;
const minStock = stockData.min || 0;
const maxStock = stockData.max || null;

console.log('🔍 DEBUG - Procesando stock para producto:', {
  productId: id,
  warehouseId,
  quantity,
  minStock,
  maxStock
});

// Continúa actualizando siempre...
```

#### Después:
```typescript
// ✅ NO FORZAR A 0 - Validar explícitamente si vienen datos válidos
const quantity = stockData.current;
const minStock = stockData.min;
const maxStock = stockData.max;

// Validar que quantity sea un número válido
if (quantity === null || quantity === undefined) {
    console.warn('⚠️ No se recibió quantity válida, preservando stock actual');
    // NO actualizar el stock - preservar el valor actual en la BD
} else {
    console.log('🔍 DEBUG - Procesando stock para producto:', {
        productId: id,
        warehouseId,
        quantity,
        minStock: minStock ?? 0,
        maxStock: maxStock ?? null
    });
    
    // Solo aquí se actualiza el stock con datos válidos
    // ...
}
```

---

## 🔍 Análisis de Otros Archivos

### `src/actions/products/create.ts` - ✅ CORRECTO

Este archivo también usa `|| 0` pero es **correcto** en este contexto:

```typescript
quantity: productData.stock.current || 0,
minStock: productData.stock.min || 0,
```

**Razón:** Al **crear** un producto nuevo, no hay stock previo que preservar. Si no se proporciona un valor, inicializar a 0 es correcto.

**Diferencia clave:**
- `create.ts`: Crea nuevo producto → Inicializar a 0 si no hay dato ✅
- `update.ts`: Actualiza producto existente → NO tocar si no hay dato ✅

---

## 📋 Regla de Oro para Actualizaciones

### ❌ NUNCA hagas esto en actualizaciones:
```typescript
const valor = datos.valor || 0;  // ❌ Puede resetear a 0
```

### ✅ SIEMPRE valida explícitamente:
```typescript
const valor = datos.valor;
if (valor === null || valor === undefined) {
    return; // No actualizar - preservar valor actual en BD
}
// Aquí el valor es válido, proceder con la actualización
```

---

## ✅ Verificación de la Solución

### Casos de Prueba

1. **Editar solo el nombre del producto**
   - ✅ Stock se preserva
   - ✅ Nombre se actualiza

2. **Editar solo el stock**
   - ✅ Stock se actualiza correctamente
   - ✅ Otros campos se preservan

3. **Editar múltiples campos incluyendo stock**
   - ✅ Todos los campos se actualizan correctamente

4. **Editar sin enviar datos de stock**
   - ✅ Stock se preserva (no se toca la BD)
   - ✅ Otros campos se actualizan

---

## 📚 Lecciones Aprendidas

### 1. Cuidado con el operador `||` en actualizaciones
El operador `||` es útil para valores por defecto en **creaciones**, pero peligroso en **actualizaciones** de datos numéricos.

### 2. Diferenciar CREATE vs UPDATE
- **CREATE:** Inicializar valores por defecto → `|| 0` es aceptable
- **UPDATE:** Preservar valores existentes → Validación explícita requerida

### 3. Validación explícita de datos
Siempre usar `=== null || === undefined` en lugar de confiar en valores "falsy".

### 4. Principio de actualizaciones selectivas
Solo actualizar campos que vienen explícitamente en la petición, no "adivinar" valores por defecto.

---

## 🔧 Checklist para Aplicar en Otros Módulos

- [ ] Buscar el archivo de actualización de la entidad
- [ ] Localizar líneas con operador `||` que fuerzan valores por defecto
- [ ] Cambiar a validación explícita con `=== null || === undefined`
- [ ] Agregar return temprano si no hay datos válidos
- [ ] NO actualizar la base de datos si no vienen datos del formulario
- [ ] Diferenciar lógica de CREATE vs UPDATE
- [ ] Probar casos de edición parcial de campos

---

## 📝 Notas Adicionales

- Esta corrección aplica específicamente a actualizaciones de productos
- El módulo de creación (`create.ts`) funciona correctamente con la lógica actual
- Se preserva la funcionalidad de actualización cuando SÍ se envían datos de stock
- Se agregaron logs para debugging y seguimiento del flujo

---

**Documentado por:** IA Assistant  
**Revisado por:** Usuario  
**Última actualización:** 2025-10-02

