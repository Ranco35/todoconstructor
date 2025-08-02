# Troubleshooting POS - Errores Comunes y Soluciones
## AdminTermas - Guía de Solución de Problemas

**Fecha:** Enero 2025  
**Estado:** Guía de referencia rápida  

---

## 🚨 **ERRORES CRÍTICOS RESUELTOS - HISTORIAL**

### **Error 1: "discountType is not defined"**
**Fecha:** Enero 2025  
**Ubicación:** ReceptionPOS.tsx línea ~1353, ~1377, ~1398  
**Causa:** Variables de descuento global eliminadas pero aún referenciadas  

#### **Síntomas:**
```
ReferenceError: discountType is not defined
at ReceptionPOS (webpack-internal:///(app-pages-browser)/./src/components/pos/ReceptionPOS.tsx:2590:65)
```

#### **Solución Aplicada:**
```typescript
// ❌ ANTES (problemático):
{discountType !== 'none' && (
  <Badge>Aplicado</Badge>
)}

// ✅ DESPUÉS (corregido):
// Los descuentos ahora se aplican individualmente por producto en el carrito
<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
  <p className="text-xs text-green-700">
    Los descuentos se aplican directamente a cada producto en el carrito.
  </p>
</div>
```

#### **Prevención:**
- ✅ **NO** usar variables `discountType`, `discountValue`, `discountReason` globales
- ✅ **SÍ** usar `item.discountType`, `item.discountValue`, `item.discountAmount` por producto

---

### **Error 2: "clearDiscount is not a function"**
**Fecha:** Enero 2025  
**Ubicación:** ReceptionPOS.tsx líneas 482, 546  
**Causa:** Función de limpieza global eliminada pero aún llamada  

#### **Síntomas:**
```
TypeError: clearDiscount is not a function
at handlePayment (ReceptionPOS.tsx:482)
```

#### **Solución Aplicada:**
```typescript
// ❌ ANTES (problemático):
clearDiscount()

// ✅ DESPUÉS (corregido):
// Los descuentos se limpian automáticamente al limpiar el carrito
// Comentario explicativo en lugar de función
```

#### **Prevención:**
- ✅ Los descuentos se limpian automáticamente cuando se limpia el carrito
- ✅ NO necesita limpieza manual por ser descuentos por producto

---

### **Error 3: "Objects are not valid as a React child"**
**Fecha:** Enero 2025  
**Ubicación:** EmailAnalysisPopup.tsx  
**Causa:** Renderizado directo de objeto `{score, neutral, negative, positive}`  

#### **Síntomas:**
```
Error: Objects are not valid as a React child (found: object with keys {score, neutral, negative, positive})
```

#### **Solución Aplicada:**
```typescript
// ❌ ANTES (problemático):
sentiment: item.sentimentAnalysis || 'No determinado',

// ✅ DESPUÉS (corregido):
const getSentimentString = (sentimentObj: any): string => {
  if (!sentimentObj || typeof sentimentObj !== 'object') {
    return 'No determinado';
  }
  
  if (typeof sentimentObj === 'string') {
    return sentimentObj;
  }
  
  const { positive = 0, neutral = 0, negative = 0 } = sentimentObj;
  
  if (positive > neutral && positive > negative) {
    return 'Positivo';
  } else if (negative > neutral && negative > positive) {
    return 'Negativo';
  } else {
    return 'Neutral';
  }
};

sentiment: getSentimentString(item.sentimentAnalysis),
```

#### **Prevención:**
- ✅ Siempre convertir objetos a strings antes de renderizar
- ✅ Validar tipos de datos antes de mostrar en React

---

## 🔧 **PATRONES DE ERRORES COMUNES**

### **Patrón 1: Variables de Estado Eliminadas**

#### **Problema:**
```typescript
// ❌ Error común: usar variables eliminadas
const [discountType, setDiscountType] = useState() // ❌ NO EXISTE
const [discountValue, setDiscountValue] = useState() // ❌ NO EXISTE
```

#### **Solución:**
```typescript
// ✅ Correcto: usar campos por producto
cart.map(item => ({
  ...item,
  discountType: item.discountType || 'none', // ✅ POR PRODUCTO
  discountValue: item.discountValue || 0     // ✅ POR PRODUCTO
}))
```

### **Patrón 2: Funciones de Limpieza Inexistentes**

#### **Problema:**
```typescript
// ❌ Error común: llamar funciones eliminadas
clearDiscount() // ❌ NO EXISTE
setDiscountType('none') // ❌ NO EXISTE
```

#### **Solución:**
```typescript
// ✅ Correcto: limpiar carrito completo
setCart([]) // ✅ Limpia productos Y descuentos
```

### **Patrón 3: Renderizado de Objetos**

#### **Problema:**
```typescript
// ❌ Error común: mostrar objetos directamente
<span>{sentimentData}</span> // ❌ Si sentimentData es objeto
```

#### **Solución:**
```typescript
// ✅ Correcto: convertir a string primero
<span>{typeof sentimentData === 'object' ? JSON.stringify(sentimentData) : sentimentData}</span>
// O mejor aún:
<span>{getSentimentString(sentimentData)}</span>
```

---

## 🚫 **QUÉ NO HACER - LISTA DE PROHIBICIONES**

### **❌ NO restaurar descuentos globales:**
```typescript
// ❌ NO HACER ESTO:
const [discountType, setDiscountType] = useState('none')
const [discountValue, setDiscountValue] = useState(0)
const [discountReason, setDiscountReason] = useState('')

// Las funciones siguientes NO deben existir:
const clearDiscount = () => { ... } // ❌ NO
const calculateDiscountAmount = () => { ... } // ❌ NO (existe una versión por producto)
```

### **❌ NO eliminar campos de CartItem:**
```typescript
// ❌ NO ELIMINAR ESTOS CAMPOS:
interface CartItem {
  discountType?: 'none' | 'percentage' | 'fixed_amount' // ❌ NO ELIMINAR
  discountValue?: number // ❌ NO ELIMINAR
  discountAmount?: number // ❌ NO ELIMINAR
}
```

### **❌ NO cambiar MultiplePaymentModal:**
```typescript
// ❌ NO MODIFICAR LA INTERFACE:
interface MultiplePaymentModalProps {
  onConfirm: (payments: PaymentInput[]) => void // ❌ NO CAMBIAR
}
```

---

## ✅ **QUÉ SÍ HACER - BUENAS PRÁCTICAS**

### **✅ Validaciones adicionales:**
```typescript
// ✅ SÍ agregar validaciones:
const applyProductDiscount = (itemId: number, discountType: string, discountValue: number) => {
  // Validación adicional
  if (discountType === 'percentage' && discountValue > 100) {
    alert('El descuento no puede ser mayor a 100%')
    return
  }
  
  if (discountType === 'fixed_amount' && discountValue > item.price * item.quantity) {
    alert('El descuento no puede ser mayor al precio del producto')
    return
  }
  
  // Aplicar descuento...
}
```

### **✅ Mejoras de UI/UX:**
```typescript
// ✅ SÍ mejorar estilos:
<Button className="bg-blue-500 hover:bg-blue-600 transition-colors"> // ✅ OK

// ✅ SÍ agregar iconos:
<div className="flex items-center gap-2">
  <Percent className="h-4 w-4" />
  <span>Descuento por porcentaje</span>
</div>
```

### **✅ Logging para debug:**
```typescript
// ✅ SÍ agregar logs temporales:
console.log('🛒 Cart state:', cart)
console.log('💸 Applying discount:', { itemId, discountType, discountValue })
console.log('💳 Processing payment:', payments)
```

---

## 🔍 **CHECKLIST DE VERIFICACIÓN ANTES DE CAMBIOS**

### **Antes de modificar ReceptionPOS.tsx:**

- [ ] ¿Estoy agregando variables globales de descuento? **❌ NO HACER**
- [ ] ¿Estoy eliminando campos de CartItem? **❌ NO HACER**
- [ ] ¿Estoy cambiando `item.discountType` por algo global? **❌ NO HACER**
- [ ] ¿Estoy agregando solo mejoras visuales/validaciones? **✅ OK**
- [ ] ¿He probado que los cálculos siguen correctos? **✅ OBLIGATORIO**

### **Antes de modificar MultiplePaymentModal.tsx:**

- [ ] ¿Estoy cambiando la interface de props? **❌ NO HACER**
- [ ] ¿Estoy eliminando funcionalidad de pagos múltiples? **❌ NO HACER**
- [ ] ¿Estoy solo mejorando UI o validaciones? **✅ OK**

### **Antes de deployar:**

- [ ] ¿He probado escenarios de descuento por producto? **✅ OBLIGATORIO**
- [ ] ¿He probado pagos múltiples? **✅ OBLIGATORIO**
- [ ] ¿He verificado que no hay errores en consola? **✅ OBLIGATORIO**
- [ ] ¿He actualizado la documentación si es necesario? **✅ RECOMENDADO**

---

## 🆘 **SCRIPT DE EMERGENCIA**

### **Si el sistema POS está roto:**

#### **1. Verificar errores en consola del navegador:**
```javascript
// Abrir DevTools (F12) y buscar:
// - ReferenceError: discountType is not defined
// - TypeError: clearDiscount is not a function  
// - Objects are not valid as a React child
```

#### **2. Revisar archivos clave:**
```bash
# Archivos a verificar:
src/components/pos/ReceptionPOS.tsx
src/components/pos/RestaurantPOS.tsx
src/components/pos/MultiplePaymentModal.tsx
```

#### **3. Buscar referencias problemáticas:**
```bash
# Buscar en el código:
grep -r "discountType" src/components/pos/
grep -r "clearDiscount" src/components/pos/
grep -r "setDiscountType" src/components/pos/
```

#### **4. Revertir cambios si es necesario:**
```bash
# Si todo falla, revertir al último commit funcional
git log --oneline src/components/pos/
git checkout [HASH_COMMIT_FUNCIONAL] -- src/components/pos/
```

---

## 📞 **CONTACTO DE EMERGENCIA**

### **Si nada de lo anterior funciona:**

1. **Revisar esta documentación completa**
2. **Verificar el commit donde se rompió** usando `git log`
3. **Comparar con el estado funcional documentado** en este archivo
4. **Como último recurso**: Restaurar desde backup de la versión funcional

---

**🎯 Mantener esta documentación actualizada cuando se hagan cambios al sistema POS.** 