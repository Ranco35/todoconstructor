# ✅ Error Corregido: Radix UI Select con Valor Vacío

## 🚨 **Error Encontrado**

```
Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
```

### **Contexto del Error:**
- **Archivo**: `src/components/purchases/PurchaseInvoiceForm.tsx`
- **Componente**: Selector de productos en líneas de factura
- **Causa**: Uso de `value=""` en `SelectItem`

## ❌ **Código Problemático (ANTES):**

```tsx
<Select value={line.productId?.toString() || ''}>
  <SelectContent>
    <SelectItem value="" className="text-gray-500">  {/* ❌ ERROR AQUÍ */}
      Sin producto
    </SelectItem>
    {products.map((product) => (
      <SelectItem key={product.id} value={product.id.toString()}>
        {product.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### **Problema:**
- **Radix UI Select** no permite `SelectItem` con `value=""` (string vacío)
- El componente usa string vacío internamente para limpiar selección
- Esto causa conflicto y genera el error

## ✅ **Solución Aplicada (DESPUÉS):**

```tsx
<Select value={line.productId?.toString() || 'none'}>  {/* ✅ Usar 'none' */}
  <SelectContent>
    <SelectItem value="none" className="text-gray-500">  {/* ✅ CORREGIDO */}
      Sin producto
    </SelectItem>
    {products.map((product) => (
      <SelectItem key={product.id} value={product.id.toString()}>
        {product.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### **Lógica de Manejo Actualizada:**

```tsx
onValueChange={(value) => {
  if (value && value !== 'none') {  // ✅ Verificar que no sea 'none'
    // Seleccionar producto
    const selectedProduct = products.find(p => p.id === parseInt(value));
    if (selectedProduct) {
      updateLine(line.tempId, 'productId', selectedProduct.id);
      updateLine(line.tempId, 'productName', selectedProduct.name);
      // ... actualizar otros campos
    }
  } else {
    // Limpiar producto (cuando selecciona "Sin producto")
    updateLine(line.tempId, 'productId', null);
    updateLine(line.tempId, 'productName', '');
    updateLine(line.tempId, 'description', '');
  }
}}
```

## 📋 **Cambios Específicos Realizados:**

### **1. Valor por Defecto:**
```tsx
// ANTES: value={line.productId?.toString() || ''}
// DESPUÉS: value={line.productId?.toString() || 'none'}
```

### **2. SelectItem para "Sin Producto":**
```tsx
// ANTES: <SelectItem value="">
// DESPUÉS: <SelectItem value="none">
```

### **3. Validación en onValueChange:**
```tsx
// ANTES: if (value) {
// DESPUÉS: if (value && value !== 'none') {
```

## 🎯 **Resultado:**

- ✅ **Error eliminado** completamente
- ✅ **Funcionalidad mantenida** al 100%
- ✅ **UX sin cambios** para el usuario
- ✅ **Código más robusto** siguiendo mejores prácticas

## 📚 **Mejores Prácticas para Radix UI Select:**

### **❌ NO Hacer:**
```tsx
<SelectItem value="">Opción vacía</SelectItem>
<SelectItem value={null}>Opción nula</SelectItem>
<SelectItem value={undefined}>Opción indefinida</SelectItem>
```

### **✅ SÍ Hacer:**
```tsx
<SelectItem value="none">Sin selección</SelectItem>
<SelectItem value="null">Vacío</SelectItem>
<SelectItem value="empty">Sin valor</SelectItem>
```

### **Patrón Recomendado:**
```tsx
// 1. Definir constante para valor vacío
const EMPTY_VALUE = 'none';

// 2. Usar en value por defecto
value={actualValue?.toString() || EMPTY_VALUE}

// 3. Validar en onChange
onValueChange={(value) => {
  if (value && value !== EMPTY_VALUE) {
    // Procesar selección válida
  } else {
    // Limpiar selección
  }
}}

// 4. Crear item para "sin selección"
<SelectItem value={EMPTY_VALUE}>Sin selección</SelectItem>
```

---

**Corregido**: 15 enero 2025  
**Estado**: ✅ Resuelto  
**Impacto**: Selector de productos 100% funcional sin errores 