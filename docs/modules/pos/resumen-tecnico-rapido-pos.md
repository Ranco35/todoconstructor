# Resumen Técnico Rápido - Sistema POS
## Para Desarrolladores

**Lectura:** 3 minutos  
**Estado:** Enero 2025  

---

## 🎯 **LO ESENCIAL**

**Sistema POS con:**
- ✅ **Descuentos por producto individual** (no globales)
- ✅ **Pagos múltiples** (efectivo + tarjeta en una venta)
- ✅ **Integración con Caja Chica**

**Archivos clave:**
- `ReceptionPOS.tsx` - POS principal de recepción
- `RestaurantPOS.tsx` - POS de restaurante  
- `MultiplePaymentModal.tsx` - Modal de pagos múltiples

---

## 🏗️ **ARQUITECTURA EN 30 SEGUNDOS**

### **Interface CartItem:**
```typescript
interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  category: string
  // ⭐ CAMPOS CLAVE - NO TOCAR
  discountType?: 'none' | 'percentage' | 'fixed_amount'
  discountValue?: number
  discountAmount?: number
}
```

### **Flujo Principal:**
```
Productos → Descuentos individuales → Total calculado → Pagos múltiples → Venta
```

### **Funciones Críticas:**
```typescript
// Calcular descuento por producto
calculateItemDiscount(item: CartItem): number

// Aplicar descuento a producto específico
applyProductDiscount(itemId: number, type: string, value: number)

// Procesar pagos múltiples
handleMultiplePayment(payments: PaymentInput[])
```

---

## 🚨 **REGLAS DE ORO**

### ❌ **NUNCA:**
- NO eliminar campos `discountType`, `discountValue`, `discountAmount` de CartItem
- NO restaurar variables globales `discountType`, `discountValue`, `discountReason`
- NO tocar `MultiplePaymentModal.tsx` sin entender completamente
- NO cambiar la interface `PaymentInput[]`

### ✅ **SIEMPRE:**
- SÍ usar `item.discountType` (por producto)
- SÍ mantener descuentos como propiedades del carrito
- SÍ probar descuentos + pagos múltiples después de cambios
- SÍ actualizar documentación si cambias algo importante

---

## 💻 **CÓDIGO ESENCIAL**

### **Agregar producto con descuento:**
```typescript
setCart([...cart, {
  id: product.id,
  name: product.name,
  price: product.price,
  quantity: 1,
  category: product.category?.displayName || 'Sin categoría',
  discountType: 'none',      // ⭐ ESENCIAL
  discountValue: 0,          // ⭐ ESENCIAL
  discountAmount: 0          // ⭐ ESENCIAL
}])
```

### **Calcular total con descuentos:**
```typescript
const getCartTotal = () => {
  return cart.reduce((total, item) => {
    return total + getItemFinalPrice(item) // Incluye descuentos
  }, 0)
}
```

### **Aplicar descuento:**
```typescript
const applyProductDiscount = (itemId: number, discountType: string, discountValue: number) => {
  setCart(cart.map(item => 
    item.id === itemId 
      ? {
          ...item,
          discountType,
          discountValue: discountType === 'none' ? 0 : discountValue,
          discountAmount: calculateItemDiscount({ ...item, discountType, discountValue })
        }
      : item
  ))
}
```

### **Procesar pagos múltiples:**
```typescript
const handleMultiplePayment = async (payments: PaymentInput[]) => {
  const saleData = {
    items: cart.map(item => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: calculateItemDiscount(item),  // ⭐ POR PRODUCTO
      total: getItemFinalPrice(item)
    })),
    payments: payments  // ⭐ MÚLTIPLES MÉTODOS
  }
  
  await createPOSSaleWithMultiplePayments(saleData)
}
```

---

## 🔧 **DEBUGGING RÁPIDO**

### **Errores típicos:**
```bash
# Error: discountType is not defined
# Solución: Usar item.discountType en lugar de discountType

# Error: clearDiscount is not a function  
# Solución: Eliminar la llamada, se limpia automáticamente

# Error: Objects are not valid as a React child
# Solución: Convertir objetos a strings antes de renderizar
```

### **Logs útiles:**
```typescript
console.log('🛒 Cart:', cart)
console.log('💸 Item discount:', calculateItemDiscount(item))
console.log('💳 Payments:', payments)
```

---

## 🧪 **TEST RÁPIDO**

### **Caso básico:**
1. Agregar producto $10.000
2. Aplicar descuento 10% = $1.000 descuento
3. Total = $9.000
4. Pagar: $5.000 efectivo + $4.000 tarjeta
5. ✅ Debe funcionar sin errores

### **Verificaciones:**
- [ ] Descuentos se aplican por producto ✅
- [ ] Total se calcula correctamente ✅  
- [ ] Pagos múltiples suman exacto ✅
- [ ] No hay errores en consola ✅

---

## 📁 **ARCHIVOS IMPORTANTES**

```
src/components/pos/
├── ReceptionPOS.tsx           # ⭐ PRINCIPAL - Descuentos + Pagos
├── RestaurantPOS.tsx          # ⭐ PRINCIPAL - Misma lógica  
├── MultiplePaymentModal.tsx   # ⭐ CRÍTICO - No tocar interface
└── PaymentModal.tsx           # ⚠️ DEPRECATED - No usar

src/actions/pos/
├── sales-actions.ts           # Crear ventas con múltiples pagos
└── session-actions.ts         # Gestión de sesiones de caja

docs/modules/pos/
├── sistema-pos-descuentos-pagos-multiples-2025.md  # 📚 DOC COMPLETA
└── troubleshooting-pos-errores-comunes.md          # 🚨 TROUBLESHOOTING
```

---

## ⚡ **MODIFICACIONES COMUNES**

### **Agregar validación:**
```typescript
// ✅ SEGURO
if (discountValue > item.price * item.quantity) {
  alert('Descuento muy alto')
  return
}
```

### **Mejorar UI:**
```typescript
// ✅ SEGURO  
<Button className="bg-green-500 hover:bg-green-600">
  Aplicar descuento
</Button>
```

### **Nuevo método de pago:**
```typescript
// ✅ SEGURO - Agregar en dropdown
<SelectItem value="crypto">Criptomoneda</SelectItem>
```

### **Lo que NO hacer:**
```typescript
// ❌ PELIGROSO
const [discountType, setDiscountType] = useState() // NO
interface CartItem { /* sin campos descuento */ } // NO
clearDiscount() // NO - función no existe
```

---

## 🎯 **PARA RECORDAR**

1. **Descuentos = por producto individual**
2. **Pagos = múltiples métodos en una venta**
3. **CartItem = tiene campos de descuento obligatorios**
4. **MultiplePaymentModal = no tocar interface**
5. **Siempre probar después de cambios**

---

**⚡ Listo para programar. Si dudas, lee la documentación completa.** 