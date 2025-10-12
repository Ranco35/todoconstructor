# Documentación: Dónde se Ejecuta el POST de Venta en el POS

## 📍 Ubicación del Punto de Venta (POS)

El sistema tiene **2 puntos de venta** diferenciados:

### 1. **POS de Recepción**
- **URL**: `http://localhost:3001/dashboard/pos/recepcion`
- **Archivo página**: `src/app/dashboard/pos/recepcion/page.tsx`
- **Componente**: `src/components/pos/ReceptionPOS.tsx`
- **Uso**: Ventas en recepción del hotel

### 2. **POS de Restaurante**
- **URL**: `http://localhost:3001/dashboard/pos/restaurante`
- **Archivo página**: `src/app/dashboard/pos/restaurante/page.tsx`
- **Componente**: `src/components/pos/RestaurantPOS.tsx`
- **Uso**: Ventas en restaurante con gestión de mesas

---

## 🔧 Flujo de Procesamiento de Ventas

### **Arquitectura del Sistema**

```
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Cliente)                                  │
│                                                     │
│  ReceptionPOS.tsx / RestaurantPOS.tsx               │
│  ├── Usuario agrega productos al carrito           │
│  ├── Selecciona método de pago                     │
│  ├── Presiona "Finalizar Venta"                    │
│  └── Llama a createPOSSale()                       │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ SERVER ACTION (Backend)                             │
│                                                     │
│  src/actions/pos/pos-actions.ts                    │
│  └── createPOSSale(saleData)                       │
│      ├── Valida sesión de caja activa              │
│      ├── Genera número de venta                    │
│      ├── INSERT en POSSale                         │
│      ├── INSERT en POSSaleItem (productos)         │
│      └── Actualiza monto de sesión                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ BASE DE DATOS                                       │
│                                                     │
│  Tablas afectadas:                                  │
│  ├── POSSale (venta principal)                     │
│  ├── POSSaleItem (items de la venta)               │
│  └── CashSession (actualización de monto)          │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Función Principal: `createPOSSale()`

### **Ubicación**
**Archivo**: `src/actions/pos/pos-actions.ts`  
**Línea**: 798-899

### **Firma de la Función**
```typescript
export async function createPOSSale(
  saleData: z.infer<typeof POSSaleSchema>
): Promise<{ 
  success: boolean; 
  data?: POSSale; 
  error?: string 
}>
```

### **Parámetros de Entrada**
```typescript
saleData = {
  sessionId: number,              // ID de la sesión de caja
  customerName?: string,          // Nombre del cliente
  customerDocument?: string,      // RUT/documento del cliente
  tableNumber?: string,           // Mesa (solo restaurante)
  roomNumber?: string,            // Habitación (solo recepción)
  subtotal: number,              // Subtotal sin impuestos
  taxAmount: number,             // Monto de IVA
  discountAmount?: number,       // Descuento aplicado
  discountReason?: string,       // Razón del descuento
  total: number,                 // Total final
  paymentMethod: string,         // 'cash', 'card', 'transfer'
  cashReceived?: number,         // Efectivo recibido
  change?: number,               // Vuelto
  notes?: string,                // Notas de la venta
  items: [                       // Productos de la venta
    {
      productId: number,
      productName: string,
      quantity: number,
      unitPrice: number,
      total: number,
      notes?: string
    }
  ]
}
```

### **Proceso de Ejecución**

#### **Paso 1: Validación**
```typescript
// Verificar usuario autenticado
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return { success: false, error: 'Usuario no autenticado' }
}

// Validar esquema de datos
const validatedData = POSSaleSchema.parse(saleData)
```

#### **Paso 2: Verificar Sesión Activa**
```typescript
const { data: session } = await supabase
  .from('CashSession')
  .select('*, cashRegisterTypeId')
  .eq('id', validatedData.sessionId)
  .eq('isActive', true)
  .single()
```

#### **Paso 3: Generar Número de Venta**
```typescript
const { data: saleNumber } = await supabase
  .rpc('generate_sale_number', { 
    register_type_id: session.cashRegisterTypeId 
  })
// Resultado: "REC-000001", "REST-000001", etc.
```

#### **Paso 4: Crear Registro de Venta (INSERT)**
```typescript
const { data: sale } = await supabase
  .from('POSSale')
  .insert({
    sessionId: validatedData.sessionId,
    saleNumber,
    customerName: validatedData.customerName,
    customerDocument: validatedData.customerDocument,
    tableNumber: validatedData.tableNumber,
    roomNumber: validatedData.roomNumber,
    subtotal: validatedData.subtotal,
    taxAmount: validatedData.taxAmount,
    discountAmount: validatedData.discountAmount,
    discountReason: validatedData.discountReason,
    total: validatedData.total,
    paymentMethod: validatedData.paymentMethod,
    cashReceived: validatedData.cashReceived,
    change: validatedData.change,
    notes: validatedData.notes
  })
  .select()
  .single()
```

#### **Paso 5: Crear Items de la Venta (INSERT)**
```typescript
const itemsData = validatedData.items.map(item => ({
  saleId: sale.id,
  productId: item.productId,
  productName: item.productName,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  total: item.total,
  notes: item.notes
}))

await supabase
  .from('POSSaleItem')
  .insert(itemsData)
```

#### **Paso 6: Actualizar Monto de Sesión (UPDATE)**
```typescript
// Solo si el pago es en efectivo
if (validatedData.paymentMethod === 'cash') {
  await supabase
    .from('CashSession')
    .update({
      currentAmount: session.currentAmount + validatedData.total
    })
    .eq('id', validatedData.sessionId)
}
```

#### **Paso 7: Revalidar Caché**
```typescript
revalidatePath('/dashboard/pos')
return { success: true, data: sale }
```

---

## 🎯 Llamadas desde el Frontend

### **Recepción POS**
**Archivo**: `src/components/pos/ReceptionPOS.tsx`  
**Línea**: 561

```typescript
const handlePaymentConfirm = async () => {
  // ... preparar datos ...
  
  const result = await createPOSSale(saleData)
  
  if (result.success) {
    // Limpiar formulario
    clearCart()
    clearClientSelection()
    alert('Venta procesada exitosamente')
  } else {
    alert(result.error || 'Error procesando venta')
  }
}
```

### **Restaurante POS**
**Archivo**: `src/components/pos/RestaurantPOS.tsx`  
**Línea**: 471

```typescript
const handlePaymentConfirm = async () => {
  // ... preparar datos ...
  
  const result = await createPOSSale(saleData)
  
  if (result.success) {
    // Liberar mesa
    await updateTableStatus(selectedTable.id, 'available')
    
    // Limpiar formulario
    clearCart()
    setViewMode('tables')
    alert('Venta procesada exitosamente')
  } else {
    alert(result.error || 'Error procesando venta')
  }
}
```

---

## 💳 Múltiples Formas de Pago

Además de `createPOSSale()`, existe una función para ventas con múltiples métodos de pago:

### **Función**: `createPOSSaleWithMultiplePayments()`
**Archivo**: `src/actions/pos/multiple-payments-actions.ts`

**Uso**:
- Cuando una venta se paga con **varios métodos** (ej: efectivo + tarjeta)
- Se llama desde el componente `MultiplePaymentModal`
- Crea registros en `POSSalePayment` para cada método

**Llamada**:
```typescript
const result = await createPOSSaleWithMultiplePayments(saleData)
```

---

## 🗃️ Tablas de Base de Datos Involucradas

### **1. POSSale** (Venta Principal)
```sql
INSERT INTO "POSSale" (
  "sessionId",
  "saleNumber",
  "customerName",
  "customerDocument",
  "tableNumber",
  "roomNumber",
  "subtotal",
  "taxAmount",
  "discountAmount",
  "total",
  "paymentMethod",
  "cashReceived",
  "change",
  "notes",
  "createdAt"
) VALUES (...)
```

### **2. POSSaleItem** (Productos de la Venta)
```sql
INSERT INTO "POSSaleItem" (
  "saleId",
  "productId",
  "productName",
  "quantity",
  "unitPrice",
  "total",
  "notes"
) VALUES (...)
```

### **3. CashSession** (Actualización de Monto)
```sql
UPDATE "CashSession"
SET "currentAmount" = "currentAmount" + total
WHERE id = sessionId
```

---

## 🔍 Debugging y Monitoreo

### **Logs en Consola**
La función incluye logs detallados:
```typescript
console.log('🔍 Creando venta POS:', saleData)
console.log('✅ Venta creada exitosamente:', sale)
console.error('❌ Error creating sale:', saleError)
```

### **Verificar Ventas Creadas**
```sql
-- Ver últimas ventas del POS
SELECT * FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Ver items de una venta específica
SELECT * FROM "POSSaleItem" 
WHERE "saleId" = [ID_VENTA];
```

---

## 📊 Datos de Retorno

### **Éxito**
```typescript
{
  success: true,
  data: {
    id: 123,
    saleNumber: "REC-000045",
    sessionId: 5,
    customerName: "Juan Pérez",
    total: 15000,
    paymentMethod: "cash",
    createdAt: "2025-01-27T...",
    // ... más campos
  }
}
```

### **Error**
```typescript
{
  success: false,
  error: "Sesión de caja no válida"
}
```

---

## 🎯 Resumen Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Función principal** | `createPOSSale()` |
| **Ubicación** | `src/actions/pos/pos-actions.ts:798` |
| **Tipo de operación** | Server Action (POST implícito) |
| **Tablas afectadas** | POSSale, POSSaleItem, CashSession |
| **Llamada desde** | ReceptionPOS.tsx, RestaurantPOS.tsx |
| **Validación** | Zod schema + sesión activa |
| **Generación número** | RPC `generate_sale_number` |
| **Revalidación** | `/dashboard/pos` |

---

## 🚀 Acceso Rápido

### **URLs del POS**
- **Recepción**: `http://localhost:3001/dashboard/pos/recepcion`
- **Restaurante**: `http://localhost:3001/dashboard/pos/restaurante`
- **Ventas**: `http://localhost:3001/dashboard/pos/sales`

### **Archivos Clave**
- **Server Action**: `src/actions/pos/pos-actions.ts` (línea 798)
- **Componente Recepción**: `src/components/pos/ReceptionPOS.tsx` (línea 561)
- **Componente Restaurante**: `src/components/pos/RestaurantPOS.tsx` (línea 471)
- **Pagos múltiples**: `src/actions/pos/multiple-payments-actions.ts`

---

## 🔄 Flujo Completo de una Venta

```
1. Usuario en POS
   ↓
2. Agrega productos al carrito
   ↓
3. Selecciona método de pago
   ↓
4. Presiona "Finalizar Venta"
   ↓
5. handlePaymentConfirm() se ejecuta
   ↓
6. Llama a createPOSSale(saleData)
   ↓
7. Server Action valida sesión
   ↓
8. Genera número de venta (RPC)
   ↓
9. INSERT en POSSale
   ↓
10. INSERT en POSSaleItem (productos)
   ↓
11. UPDATE en CashSession (si es efectivo)
   ↓
12. Retorna { success: true, data: sale }
   ↓
13. Frontend limpia carrito
   ↓
14. Muestra mensaje de éxito
```

---

## 💡 Notas Importantes

### **Server Actions vs API Routes**
- ✅ El POS usa **Server Actions** (no API Routes tradicionales)
- ✅ Son más rápidas y eficientes
- ✅ No requieren endpoint `/api/pos/sales`
- ✅ Se ejecutan directamente en el servidor

### **Método HTTP**
- Aunque se llame "POST", las Server Actions de Next.js 14 **no exponen un endpoint REST tradicional**
- Son funciones que se ejecutan en el servidor con sintaxis de cliente
- Internamente Next.js usa POST, pero transparente para el desarrollador

### **Seguridad**
- ✅ Validación de usuario autenticado
- ✅ Validación de sesión activa
- ✅ Validación de esquema con Zod
- ✅ Transacciones atómicas en base de datos

---

## 🧪 Cómo Probar

### **Método 1: Usar el POS**
1. Ir a `http://localhost:3001/dashboard/pos/recepcion`
2. Agregar productos al carrito
3. Seleccionar método de pago
4. Finalizar venta
5. Verificar en base de datos

### **Método 2: Llamada Directa (Dev Tools)**
```typescript
import { createPOSSale } from '@/actions/pos/pos-actions'

const testSale = await createPOSSale({
  sessionId: 1,
  customerName: "Cliente de Prueba",
  subtotal: 10000,
  taxAmount: 1900,
  total: 11900,
  paymentMethod: "cash",
  items: [
    {
      productId: 1,
      productName: "Producto Test",
      quantity: 1,
      unitPrice: 10000,
      total: 10000
    }
  ]
})
```

### **Método 3: Verificar en Base de Datos**
```sql
-- Ver última venta creada
SELECT * FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 1;

-- Ver items de la última venta
SELECT ps.*, psi.*
FROM "POSSale" ps
JOIN "POSSaleItem" psi ON ps.id = psi."saleId"
ORDER BY ps."createdAt" DESC
LIMIT 10;
```

---

## 🔗 Funciones Relacionadas

| Función | Propósito | Ubicación |
|---------|-----------|-----------|
| `createPOSSale()` | Crear venta simple | pos-actions.ts:798 |
| `createPOSSaleWithMultiplePayments()` | Venta con múltiples pagos | multiple-payments-actions.ts |
| `getPOSSales()` | Obtener ventas de sesión | pos-actions.ts:901 |
| `getAllPOSSales()` | Obtener todas las ventas | pos-actions.ts:927 |
| `getPOSSaleById()` | Obtener venta específica | pos-actions.ts:1015 |
| `deletePOSSalesInBulk()` | Eliminar ventas masivamente | pos-actions.ts:1056 |

---

## ✅ Respuesta a tu Pregunta

**¿Dónde se ejecuta el POST de venta en el POS?**

**Respuesta**:
- **Función**: `createPOSSale()` 
- **Archivo**: `src/actions/pos/pos-actions.ts`
- **Línea**: 798
- **Llamada desde**:
  - `src/components/pos/ReceptionPOS.tsx` (línea 561)
  - `src/components/pos/RestaurantPOS.tsx` (línea 471)
- **Tipo**: Server Action de Next.js 14 (no endpoint REST tradicional)
- **Tablas**: Inserta en `POSSale` y `POSSaleItem`

---

**Fecha de documentación**: 27 de Enero, 2025  
**Estado**: ✅ Documentado completamente  
**Tipo**: Server Action (POST transparente)
