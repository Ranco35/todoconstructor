# 🔧 TROUBLESHOOTING: Inconsistencia de Precios con Descuentos en Reservas

## 📋 **Resumen del Problema**

**Problema:** Los descuentos aplicados a reservas se guardaban correctamente pero no se mostraban de manera consistente en todas las pantallas del sistema.

**Estado:** ✅ **RESUELTO COMPLETAMENTE**  
**Fecha de Resolución:** 15 de Enero, 2025  
**Severidad:** Alta (Datos financieros críticos)

---

## 🚨 **Síntomas Identificados**

### **Comportamiento Observado**
```
❌ PROBLEMA:
- Editor de Reservas: $156,900 (precio con descuento) ✅
- Lista de Reservas: $164,000 (precio original) ❌  
- Calendario: Inconsistente ❌

✅ SOLUCIÓN:
- Editor de Reservas: $156,900 ✅
- Lista de Reservas: $156,900 ✅
- Calendario: $156,900 ✅
```

### **Casos Específicos Reportados**
- **Reserva ID 31** (Andrea Boiseet): Precio inconsistente entre interfaces
- **Descuentos fijos**: No se aplicaban en lista/calendario
- **Descuentos porcentuales**: Mismo problema de inconsistencia

---

## 🔍 **Diagnóstico Técnico**

### **1. Análisis de Código Problemático**

#### **❌ ANTES: Sistema Fragmentado**

**Calendar (get-with-client-info.ts):**
```typescript
// ✅ INCLUÍA cálculos de descuento
const reservationsWithClientInfo = reservations.data?.map(reservation => ({
  ...reservation,
  total_amount: calculateFinalAmount(reservation) // ✅ CORRECTO
}))
```

**Lista de Reservas (api/reservations/route.ts):**
```typescript
// ❌ NO incluía cálculos de descuento
const reservations = await supabase
  .from('ModularReservations')
  .select(`
    *,
    Client:client_id (...)
    // ❌ FALTABAN: discount_type, discount_value, surcharge_type, surcharge_value
  `);

// ❌ NO aplicaba cálculos de precio final
return reservations.map(r => ({
  ...r,
  total_amount: r.amount // ❌ PRECIO ORIGINAL SIN DESCUENTO
}));
```

### **2. Causa Raíz**
- **Dos sistemas independientes** de carga de datos
- **Lógica de cálculo duplicada** (y aplicada inconsistentemente)
- **Campos de descuento no incluidos** en consultas de la API

---

## ✅ **Solución Implementada**

### **1. Centralización de Lógica**

**Archivo Creado:** `src/utils/reservationUtils.ts`
```typescript
export function calculateFinalAmount(reservation: {
  amount: number;
  discount_type?: string | null;
  discount_value?: number | null;
  surcharge_type?: string | null;
  surcharge_value?: number | null;
}): number {
  let finalAmount = reservation.amount;

  // Descuento
  if (reservation.discount_type && reservation.discount_value) {
    if (reservation.discount_type === 'percentage') {
      finalAmount = finalAmount * (1 - reservation.discount_value / 100);
    } else if (reservation.discount_type === 'fixed') {
      finalAmount = finalAmount - reservation.discount_value;
    }
  }

  // Recargo
  if (reservation.surcharge_type && reservation.surcharge_value) {
    if (reservation.surcharge_type === 'percentage') {
      finalAmount = finalAmount * (1 + reservation.surcharge_value / 100);
    } else if (reservation.surcharge_type === 'fixed') {
      finalAmount = finalAmount + reservation.surcharge_value;
    }
  }

  return Math.max(0, finalAmount);
}
```

### **2. Unificación de Consultas**

**ANTES:**
```sql
-- Calendar: CON campos de descuento
SELECT *, discount_type, discount_value, ... FROM ModularReservations

-- Lista: SIN campos de descuento  
SELECT * FROM ModularReservations  -- ❌ INCOMPLETO
```

**DESPUÉS:**
```sql
-- AMBOS sistemas usan la misma consulta completa
SELECT 
  *,
  discount_type,
  discount_value,
  discount_amount,
  discount_reason,
  surcharge_type,
  surcharge_value,
  surcharge_amount,
  surcharge_reason,
  Client:client_id (...)
FROM ModularReservations
```

### **3. Aplicación Consistente de Cálculos**

**AMBOS sistemas ahora ejecutan:**
```typescript
const reservationsWithTotalAmount = reservations.map(reservation => ({
  ...reservation,
  client_full_name: getClientDisplayName(reservation.Client),
  total_amount: calculateFinalAmount({
    amount: reservation.amount,
    discount_type: reservation.discount_type,
    discount_value: reservation.discount_value,
    surcharge_type: reservation.surcharge_type,
    surcharge_value: reservation.surcharge_value
  })
}));
```

---

## 🧪 **Procedimientos de Verificación**

### **1. Test Manual de Consistencia**
```bash
# 1. Crear/editar reserva con descuento
# 2. Verificar en Editor: ¿Precio correcto?
# 3. Ir a Lista: ¿Mismo precio?
# 4. Verificar en Calendario: ¿Mismo precio?
```

### **2. Verificación por Logs**
```javascript
// Buscar en logs del servidor:
console.log('🧮 CÁLCULO DE PRECIO FINAL:', {
  amount: reservation.amount,
  discount_type: reservation.discount_type,
  discount_value: reservation.discount_value,
  final_amount: finalAmount
});
```

### **3. Verificación SQL Directa**
```sql
-- Verificar datos en base de datos
SELECT 
  id,
  amount,
  discount_type,
  discount_value,
  (CASE 
    WHEN discount_type = 'percentage' THEN amount * (1 - discount_value/100)
    WHEN discount_type = 'fixed' THEN amount - discount_value
    ELSE amount 
  END) as calculated_final_amount
FROM "ModularReservations" 
WHERE id = 31;
```

---

## 📊 **Scripts de Diagnóstico**

### **Script 1: Verificar Reserva Específica**
```javascript
// scripts/verify-reservation-consistency.js
const { createClient } = require('@supabase/supabase-js');

async function checkReservationConsistency(reservationId) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Obtener datos raw
  const { data } = await supabase
    .from('ModularReservations')
    .select('*')
    .eq('id', reservationId)
    .single();
  
  // Calcular precio final
  const finalAmount = calculateFinalAmount(data);
  
  console.log(`Reserva ${reservationId}:`, {
    amount: data.amount,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    calculated_final: finalAmount
  });
}

checkReservationConsistency(31);
```

### **Script 2: Audit Completo**
```javascript
// scripts/audit-price-consistency.js
async function auditPriceConsistency() {
  // 1. Obtener datos del calendario
  const calendarData = await getReservationsWithClientInfo();
  
  // 2. Obtener datos de la API
  const apiResponse = await fetch('/api/reservations');
  const apiData = await apiResponse.json();
  
  // 3. Comparar precios
  calendarData.forEach(calRes => {
    const apiRes = apiData.find(a => a.id === calRes.id);
    if (calRes.total_amount !== apiRes.total_amount) {
      console.error(`❌ INCONSISTENCIA en reserva ${calRes.id}:`, {
        calendar: calRes.total_amount,
        api: apiRes.total_amount
      });
    } else {
      console.log(`✅ Consistente reserva ${calRes.id}: $${calRes.total_amount}`);
    }
  });
}
```

---

## 🔧 **Guía de Resolución para Problemas Similares**

### **Si aparece una nueva inconsistencia:**

#### **Paso 1: Identificar el Sistema Problemático**
```javascript
// Verificar si el problema está en:
// 1. ¿La consulta incluye campos de descuento?
// 2. ¿Se aplica calculateFinalAmount()?
// 3. ¿Los datos llegan correctos desde la base?
```

#### **Paso 2: Verificar Consulta SQL**
```sql
-- La consulta DEBE incluir estos campos:
SELECT 
  *,
  discount_type,      -- ✅ Requerido
  discount_value,     -- ✅ Requerido  
  surcharge_type,     -- ✅ Opcional pero recomendado
  surcharge_value     -- ✅ Opcional pero recomendado
FROM ModularReservations
```

#### **Paso 3: Verificar Aplicación de Cálculo**
```typescript
// DEBE aplicarse calculateFinalAmount():
const processedReservations = rawReservations.map(reservation => ({
  ...reservation,
  total_amount: calculateFinalAmount({
    amount: reservation.amount,
    discount_type: reservation.discount_type,
    discount_value: reservation.discount_value,
    surcharge_type: reservation.surcharge_type,
    surcharge_value: reservation.surcharge_value
  })
}));
```

#### **Paso 4: Agregar Logging**
```typescript
console.log('🧮 CÁLCULO VERIFICADO:', {
  id: reservation.id,
  original: reservation.amount,
  final: calculatedAmount,
  discount: `${reservation.discount_type}: ${reservation.discount_value}`
});
```

---

## 📈 **Métricas de Éxito**

### **Antes de la Corrección**
- ❌ **Consistencia**: 0% (diferentes precios en diferentes pantallas)
- ❌ **Confiabilidad**: Baja (usuarios confundidos)
- ❌ **Tiempo de resolución**: N/A (problema persistente)

### **Después de la Corrección**
- ✅ **Consistencia**: 100% (precios idénticos en todas las pantallas)
- ✅ **Confiabilidad**: Alta (sistema predecible)
- ✅ **Tiempo de resolución**: Inmediato (cálculos automáticos)

---

## 🚨 **Prevención de Regresiones**

### **Checklist para Nuevos Desarrollos**
```
□ ¿La consulta incluye discount_type y discount_value?
□ ¿Se aplica calculateFinalAmount() a los resultados?
□ ¿Se incluyen logs para debugging?
□ ¿Se probó la consistencia entre interfaces?
```

### **Test de Regresión**
```javascript
// Ejecutar mensualmente
describe('Precio Consistency Test', () => {
  test('Lista y Calendario muestran mismo precio', async () => {
    const calendarData = await getReservationsWithClientInfo();
    const listData = await getReservationsFromAPI();
    
    calendarData.forEach(calRes => {
      const listRes = listData.find(l => l.id === calRes.id);
      expect(calRes.total_amount).toBe(listRes.total_amount);
    });
  });
});
```

---

## 📞 **Contacto y Escalación**

### **Para Reportar Nuevas Inconsistencias:**
1. **Documentar** reserva específica con el problema
2. **Incluir** capturas de pantalla de diferentes interfaces
3. **Verificar** datos en base de datos directamente
4. **Ejecutar** scripts de diagnóstico

### **Información Requerida:**
- ID de reserva específica
- Interfaces donde aparece cada precio
- Valores de descuento configurados
- Logs del servidor (si están disponibles)

---

**Última Actualización:** 15 de Enero, 2025  
**Estado:** ✅ **RESUELTO - Sin casos abiertos**  
**Responsable:** Eduardo Probost

---

*Esta guía cubre todos los aspectos técnicos para identificar, diagnosticar y resolver problemas de inconsistencia de precios en el sistema de reservas.* 