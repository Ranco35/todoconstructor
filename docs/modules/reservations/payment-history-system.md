# Sistema de Historial de Pagos Centralizado

## 📋 Resumen

El sistema de reservas ahora utiliza un **historial de pagos centralizado** que garantiza trazabilidad completa y consistencia de datos. Todos los pagos y abonos se registran en la tabla `reservation_payments` y los campos de resumen en `reservations` se calculan automáticamente.

## 🎯 Objetivos

- ✅ **Trazabilidad completa**: Todo pago queda registrado con fecha, método, referencia y notas
- ✅ **Consistencia de datos**: Los montos se calculan automáticamente desde el historial
- ✅ **Prevención de errores**: No se pueden modificar directamente los campos de pago
- ✅ **Auditoría**: Historial completo de quién procesó cada pago y cuándo

## 🏗️ Arquitectura del Sistema

### Tablas Principales

#### `reservations` (Campos de Resumen)
```sql
paid_amount      -- Calculado automáticamente desde reservation_payments
pending_amount   -- Calculado automáticamente desde reservation_payments  
payment_status   -- Calculado automáticamente desde reservation_payments
```

#### `reservation_payments` (Historial Completo)
```sql
id                      -- Identificador único del pago
reservation_id          -- Referencia a la reserva
amount                  -- Monto de este pago específico
payment_type            -- 'abono' o 'pago_total'
payment_method          -- Método de pago utilizado
previous_paid_amount    -- Cuánto se había pagado antes
new_total_paid          -- Total pagado después de este pago
remaining_balance       -- Saldo pendiente después de este pago
total_reservation_amount -- Total de la reserva en el momento del pago
reference_number        -- Número de referencia (transferencia, cheque, etc.)
notes                   -- Observaciones del pago
processed_by            -- Quién procesó el pago
created_at              -- Fecha y hora del pago
```

## 🔄 Flujo de Pagos

### 1. Creación de Reserva
- Las reservas se crean con `paid_amount = 0` y `payment_status = 'no_payment'`
- Si hay un pago inicial, se procesa automáticamente a través del flujo de pagos

### 2. Agregar Pago/Abono
- **ÚNICA forma permitida**: Usar la función `processPayment()` o `addReservationPayment()`
- Se inserta un registro en `reservation_payments`
- El trigger SQL actualiza automáticamente los campos de resumen en `reservations`

### 3. Cálculo Automático
- `paid_amount` = Suma de todos los `amount` en `reservation_payments`
- `pending_amount` = `total_amount` - `paid_amount`
- `payment_status` = 'paid' si `paid_amount >= total_amount`, 'partial' si > 0, 'no_payment' si = 0

## 🚫 Restricciones Implementadas

### ❌ NO se puede hacer:
- Editar directamente `paid_amount`, `pending_amount` o `payment_status` en formularios
- Actualizar estos campos desde código sin usar el flujo de pagos
- Crear reservas con montos pagados sin registrar el pago en el historial

### ✅ SÍ se puede hacer:
- Agregar pagos usando `processPayment()` o `addReservationPayment()`
- Ver el historial completo de pagos
- Editar otros campos de la reserva (fechas, huésped, etc.)

## 🔧 Funciones Principales

### `processPayment(data)`
```typescript
interface ProcessPaymentData {
  reservationId: number;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  processedBy: string;
}
```

**Funcionalidad:**
- Valida que el monto no exceda el saldo pendiente
- Inserta registro en `reservation_payments`
- El trigger actualiza automáticamente `reservations`
- Agrega comentario automático al historial

### `addReservationPayment()`
```typescript
addReservationPayment(
  reservationId: number,
  amount: number,
  paymentMethod: string = 'efectivo',
  notes?: string,
  paymentDate?: string
)
```

**Funcionalidad:**
- Wrapper que usa `processPayment()` internamente
- Mantiene compatibilidad con código existente
- Agrega funcionalidad de fecha de pago

## 🗄️ Trigger SQL

### `update_reservation_payment_totals()`
- Se ejecuta automáticamente después de INSERT/UPDATE/DELETE en `reservation_payments`
- Calcula y actualiza `paid_amount`, `pending_amount` y `payment_status` en `reservations`
- Garantiza consistencia de datos en tiempo real

## 📊 Migración de Datos Históricos

### Script de Migración
```sql
-- Ejecutar: scripts/migrate-historical-payment.sql
-- Migra automáticamente el abono existente en la reserva 26
```

### Proceso de Migración
1. Verifica si ya existen pagos en `reservation_payments`
2. Si no hay pagos pero `paid_amount > 0`, crea el abono histórico
3. El trigger actualiza automáticamente los campos de resumen
4. Verifica la consistencia de los datos

## 🧪 Pruebas del Sistema

### Script de Pruebas
```javascript
// Ejecutar: scripts/test-reservations-system.js
// Prueba la creación de reservas y pagos con el nuevo flujo
```

### Verificaciones Automáticas
- Creación de reserva con pago inicial
- Inserción de pagos en `reservation_payments`
- Verificación de actualización automática por trigger
- Validación de consistencia de datos

## 📝 Ejemplos de Uso

### Agregar un Abono
```typescript
const result = await processPayment({
  reservationId: 26,
  amount: 50000,
  paymentMethod: 'transferencia',
  referenceNumber: 'TRX-123456',
  notes: 'Abono por transferencia bancaria',
  processedBy: 'admin@termas.com'
});
```

### Ver Historial de Pagos
```sql
SELECT 
  amount,
  payment_type,
  payment_method,
  new_total_paid,
  remaining_balance,
  created_at,
  notes
FROM reservation_payments 
WHERE reservation_id = 26
ORDER BY created_at;
```

## 🔍 Monitoreo y Auditoría

### Consultas de Auditoría
```sql
-- Verificar consistencia de datos
SELECT 
  r.id,
  r.paid_amount as paid_in_reservations,
  COALESCE(SUM(rp.amount), 0) as total_in_payments,
  CASE 
    WHEN r.paid_amount = COALESCE(SUM(rp.amount), 0) THEN '✅ CONSISTENTE'
    ELSE '❌ INCONSISTENTE'
  END as status
FROM reservations r
LEFT JOIN reservation_payments rp ON r.id = rp.reservation_id
GROUP BY r.id, r.paid_amount;
```

### Logs del Sistema
- Todos los pagos se registran con `processed_by`
- Comentarios automáticos en `reservation_comments`
- Timestamps precisos en `created_at`

## ⚠️ Consideraciones Importantes

### Seguridad
- Solo usuarios autorizados pueden procesar pagos
- Todos los cambios quedan auditados
- No se pueden modificar pagos históricos sin dejar rastro

### Performance
- El trigger se ejecuta automáticamente pero es eficiente
- Índices optimizados en `reservation_payments`
- Consultas de resumen son rápidas

### Mantenimiento
- Backup regular de `reservation_payments`
- Monitoreo de consistencia de datos
- Documentación actualizada de cambios

## 🚀 Beneficios del Nuevo Sistema

1. **Trazabilidad 100%**: Todo pago tiene historial completo
2. **Consistencia garantizada**: Trigger SQL previene inconsistencias
3. **Auditoría completa**: Quién, cuándo, cómo y por qué de cada pago
4. **Prevención de errores**: No se pueden modificar montos directamente
5. **Escalabilidad**: Sistema preparado para alto volumen de transacciones
6. **Cumplimiento**: Cumple estándares de auditoría financiera

---

*Última actualización: Enero 2025*
*Sistema implementado para garantizar trazabilidad completa de pagos en reservas* 