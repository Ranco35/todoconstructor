# Implementación Técnica - Sistema de Historial de Pagos

## 🏗️ Arquitectura Técnica

### Diagrama de Componentes
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  React Components                                           │
│  ├── ReservationCalendar.tsx                               │
│  ├── ReservationManagementModal.tsx                        │
│  ├── AddPaymentModal.tsx                                   │
│  └── PaymentHistory.tsx                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Server Actions (TypeScript)                               │
│  ├── processPayment() - Función centralizada              │
│  ├── addReservationPayment() - Wrapper                     │
│  ├── updateReservation() - Sin campos de pago              │
│  └── createReservation() - Con pago inicial opcional       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + Supabase                                      │
│  ├── reservation_payments (Fuente de verdad)               │
│  ├── reservations (Campos calculados)                      │
│  ├── Trigger: update_reservation_payment_totals()          │
│  └── RLS Policies                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Implementación Backend

### 1. Función Centralizada: `processPayment()`

**Ubicación:** `src/actions/reservations/process-payment.ts`

```typescript
interface ProcessPaymentData {
  reservationId: number;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  processedBy: string;
}

export async function processPayment(data: ProcessPaymentData) {
  // 1. Validación de entrada
  // 2. Obtención de datos actuales de la reserva
  // 3. Cálculo de nuevos valores
  // 4. Inserción en reservation_payments
  // 5. Trigger actualiza automáticamente reservations
  // 6. Agregar comentario al historial
  // 7. Retornar resultado
}
```

**Flujo de Validación:**
```typescript
// Validar que el monto no exceda el saldo pendiente
const currentPendingAmount = Math.max(0, totalAmount - currentPaidAmount);
if (data.amount > currentPendingAmount) {
  throw new Error(`El monto excede el saldo pendiente`);
}
```

### 2. Wrapper de Compatibilidad: `addReservationPayment()`

**Ubicación:** `src/actions/reservations/management.ts`

```typescript
export async function addReservationPayment(
  reservationId: number, 
  amount: number, 
  paymentMethod: string = 'efectivo',
  notes?: string,
  paymentDate?: string
) {
  // Usa processPayment() internamente para mantener consistencia
  const { processPayment } = await import('./process-payment');
  
  return await processPayment({
    reservationId,
    amount,
    paymentMethod,
    referenceNumber: paymentDate ? `PAGO-${new Date(paymentDate).toISOString().split('T')[0]}` : undefined,
    notes: notes || `Pago procesado - ${paymentMethod}`,
    processedBy: 'Sistema'
  });
}
```

### 3. Refactorización de Funciones Existentes

#### `updateReservation()` - Sin Campos de Pago
```typescript
// ANTES (❌ NO PERMITIDO)
paid_amount: reservationData.paid_amount,
pending_amount: calculatedPendingAmount,
payment_status: calculatedPaymentStatus,

// DESPUÉS (✅ CORRECTO)
// ⚠️ IMPORTANTE: Los campos de pago NO se actualizan aquí
// Estos valores se calculan automáticamente desde reservation_payments
```

#### `createReservation()` - Con Pago Inicial Opcional
```typescript
// Crear reserva con paid_amount = 0
const reservation = await createReservation(formData);

// Si hay pago inicial, procesarlo a través del flujo centralizado
const initialPayment = parseFloat(formData.get('paidAmount')?.toString() || '0');
if (initialPayment > 0) {
  await processPayment({
    reservationId: reservation.id,
    amount: initialPayment,
    paymentMethod: reservationData.payment_method || 'efectivo',
    referenceNumber: 'PAGO_INICIAL',
    notes: 'Pago inicial de la reserva',
    processedBy: 'Sistema'
  });
}
```

## 🗄️ Implementación de Base de Datos

### 1. Tabla `reservation_payments`

```sql
CREATE TABLE reservation_payments (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Información del pago
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('abono', 'pago_total')),
  payment_method VARCHAR(50) NOT NULL,
  
  -- Información contextual
  previous_paid_amount DECIMAL(12,2) DEFAULT 0,
  new_total_paid DECIMAL(12,2) NOT NULL,
  remaining_balance DECIMAL(12,2) NOT NULL,
  total_reservation_amount DECIMAL(12,2) NOT NULL,
  
  -- Metadatos
  reference_number VARCHAR(100),
  notes TEXT,
  processed_by VARCHAR(100),
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 2. Trigger SQL: `update_reservation_payment_totals()`

```sql
CREATE OR REPLACE FUNCTION update_reservation_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(12,2);
    reservation_total DECIMAL(12,2);
    new_pending_amount DECIMAL(12,2);
    new_payment_status VARCHAR(20);
BEGIN
    -- Obtener el total de la reserva
    SELECT total_amount INTO reservation_total
    FROM reservations
    WHERE id = COALESCE(NEW.reservation_id, OLD.reservation_id);
    
    -- Calcular el total pagado sumando todos los pagos
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM reservation_payments
    WHERE reservation_id = COALESCE(NEW.reservation_id, OLD.reservation_id);
    
    -- Calcular el saldo pendiente
    new_pending_amount := GREATEST(0, reservation_total - total_paid);
    
    -- Determinar el estado de pago
    IF total_paid >= reservation_total THEN
        new_payment_status := 'paid';
    ELSIF total_paid > 0 THEN
        new_payment_status := 'partial';
    ELSE
        new_payment_status := 'no_payment';
    END IF;
    
    -- Actualizar la reserva
    UPDATE reservations
    SET 
        paid_amount = total_paid,
        pending_amount = new_pending_amount,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.reservation_id, OLD.reservation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta en INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_reservation_payment_totals
    AFTER INSERT OR UPDATE OR DELETE ON reservation_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_payment_totals();
```

### 3. Índices para Performance

```sql
-- Índices principales
CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX idx_reservation_payments_payment_type ON reservation_payments(payment_type);
CREATE INDEX idx_reservation_payments_payment_method ON reservation_payments(payment_method);
CREATE INDEX idx_reservation_payments_created_at ON reservation_payments(created_at);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_reservation_payments_reservation_created ON reservation_payments(reservation_id, created_at);
```

## 🔒 Seguridad y Validaciones

### 1. Row Level Security (RLS)

```sql
-- Política para administradores
CREATE POLICY "Administradores pueden ver todos los pagos" ON reservation_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.roleid = 'ADMINISTRADOR'
    )
  );

-- Política para jefes de sección
CREATE POLICY "Jefes de sección pueden ver pagos" ON reservation_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.roleid = 'JEFE_SECCION'
    )
  );
```

### 2. Validaciones de Negocio

```typescript
// Validación de monto máximo
if (data.amount > currentPendingAmount) {
  throw new Error(`El monto de $${data.amount.toLocaleString()} excede el saldo pendiente de $${currentPendingAmount.toLocaleString()}`);
}

// Validación de monto mínimo
if (data.amount <= 0) {
  throw new Error('El monto del pago debe ser mayor a 0');
}

// Validación de método de pago
if (!data.paymentMethod) {
  throw new Error('Debe especificar el método de pago');
}
```

## 📊 Migración de Datos

### 1. Script de Migración Automática

```sql
-- scripts/migrate-historical-payment.sql
DO $$
DECLARE
    reservation_record RECORD;
    existing_payments_count INTEGER;
    historical_amount DECIMAL(12,2);
BEGIN
    -- Obtener datos de la reserva
    SELECT * INTO reservation_record
    FROM reservations 
    WHERE id = 26;
    
    -- Verificar si ya existen pagos
    SELECT COUNT(*) INTO existing_payments_count
    FROM reservation_payments 
    WHERE reservation_id = 26;
    
    -- Si no hay pagos registrados pero hay monto pagado, crear el abono histórico
    IF existing_payments_count = 0 AND reservation_record.paid_amount > 0 THEN
        historical_amount := reservation_record.paid_amount;
        
        INSERT INTO reservation_payments (
            reservation_id, amount, payment_type, payment_method,
            previous_paid_amount, new_total_paid, remaining_balance,
            total_reservation_amount, reference_number, notes, processed_by
        ) VALUES (
            26, historical_amount,
            CASE 
                WHEN historical_amount >= reservation_record.total_amount THEN 'pago_total'
                ELSE 'abono'
            END,
            'transferencia', 0, historical_amount,
            GREATEST(0, reservation_record.total_amount - historical_amount),
            reservation_record.total_amount,
            'MIGRACION-HISTORICA',
            'Abono migrado desde sistema anterior - Migración automática del ' || CURRENT_DATE,
            'Sistema'
        );
        
        RAISE NOTICE '✅ Abono histórico creado: $% para la reserva %', 
            historical_amount, reservation_record.id;
    END IF;
END $$;
```

### 2. Verificación de Consistencia

```sql
-- Consulta para verificar consistencia de datos
SELECT 
  r.id,
  r.guest_name,
  r.paid_amount as paid_in_reservations,
  COALESCE(SUM(rp.amount), 0) as total_in_payments,
  CASE 
    WHEN r.paid_amount = COALESCE(SUM(rp.amount), 0) THEN '✅ CONSISTENTE'
    ELSE '❌ INCONSISTENTE'
  END as status
FROM reservations r
LEFT JOIN reservation_payments rp ON r.id = rp.reservation_id
GROUP BY r.id, r.paid_amount, r.guest_name
ORDER BY status DESC;
```

## 🧪 Testing y Validación

### 1. Script de Pruebas

```javascript
// scripts/test-reservations-system.js
async function testPaymentSystem() {
  // 1. Crear reserva de prueba
  const testReservation = await createTestReservation();
  
  // 2. Agregar pago usando el flujo centralizado
  const testPaymentData = {
    reservation_id: testReservation.id,
    amount: 100000,
    payment_type: 'abono',
    payment_method: 'transferencia',
    previous_paid_amount: 0,
    new_total_paid: 100000,
    remaining_balance: testReservation.total_amount - 100000,
    total_reservation_amount: testReservation.total_amount,
    reference_number: 'TRX-PRUEBA-123',
    notes: 'Pago de prueba del sistema automatizado - Flujo centralizado',
    processed_by: 'Sistema de Pruebas'
  };

  const { data: testPayment, error: paymentError } = await supabase
    .from('reservation_payments')
    .insert([testPaymentData])
    .select()
    .single();

  // 3. Verificar que el trigger actualizó la reserva
  const { data: updatedReservation } = await supabase
    .from('reservations')
    .select('paid_amount, pending_amount, payment_status')
    .eq('id', testReservation.id)
    .single();

  // 4. Validar consistencia
  console.log('✅ Reserva actualizada automáticamente por el trigger SQL');
  console.log(`   📊 Pagado: $${updatedReservation.paid_amount.toLocaleString('es-CL')}`);
  console.log(`   📊 Pendiente: $${updatedReservation.pending_amount.toLocaleString('es-CL')}`);
  console.log(`   📊 Estado: ${updatedReservation.payment_status}`);
}
```

### 2. Casos de Prueba

```typescript
// Casos de prueba para processPayment()
describe('processPayment', () => {
  test('should process valid payment', async () => {
    const result = await processPayment({
      reservationId: 1,
      amount: 50000,
      paymentMethod: 'transferencia',
      processedBy: 'test@example.com'
    });
    
    expect(result.success).toBe(true);
    expect(result.paymentType).toBe('abono');
  });

  test('should reject payment exceeding pending amount', async () => {
    const result = await processPayment({
      reservationId: 1,
      amount: 999999, // Monto excesivo
      paymentMethod: 'transferencia',
      processedBy: 'test@example.com'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('excede el saldo pendiente');
  });

  test('should process total payment correctly', async () => {
    const result = await processPayment({
      reservationId: 1,
      amount: 200000, // Monto total
      paymentMethod: 'transferencia',
      processedBy: 'test@example.com'
    });
    
    expect(result.success).toBe(true);
    expect(result.paymentType).toBe('pago_total');
  });
});
```

## 📈 Performance y Optimización

### 1. Optimización de Consultas

```sql
-- Consulta optimizada para historial de pagos
SELECT 
  rp.id,
  rp.amount,
  rp.payment_type,
  rp.payment_method,
  rp.new_total_paid,
  rp.remaining_balance,
  rp.created_at,
  rp.notes
FROM reservation_payments rp
WHERE rp.reservation_id = $1
ORDER BY rp.created_at DESC
LIMIT 50;
```

### 2. Monitoreo de Performance

```sql
-- Consulta para monitorear performance del trigger
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename = 'reservation_payments'
ORDER BY n_distinct DESC;
```

### 3. Mantenimiento de Índices

```sql
-- Análisis de uso de índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'reservation_payments'
ORDER BY idx_scan DESC;
```

## 🔄 Mantenimiento y Monitoreo

### 1. Backup Strategy

```bash
# Backup de reservation_payments (crítico)
pg_dump -t reservation_payments -f reservation_payments_backup.sql

# Backup de triggers y funciones
pg_dump -f triggers_backup.sql --schema-only
```

### 2. Logs y Monitoreo

```typescript
// Logging en processPayment()
console.log(`💰 Procesando pago: $${data.amount} para reserva ${data.reservationId}`);
console.log(`📊 Usuario: ${data.processedBy}`);
console.log(`🔗 Referencia: ${data.referenceNumber || 'N/A'}`);

// Logging de errores
console.error('❌ Error procesando pago:', error);
console.error('📋 Datos del pago:', data);
```

### 3. Alertas de Consistencia

```sql
-- Consulta para detectar inconsistencias
SELECT 
  r.id,
  r.guest_name,
  r.paid_amount,
  COALESCE(SUM(rp.amount), 0) as calculated_paid,
  ABS(r.paid_amount - COALESCE(SUM(rp.amount), 0)) as difference
FROM reservations r
LEFT JOIN reservation_payments rp ON r.id = rp.reservation_id
GROUP BY r.id, r.paid_amount, r.guest_name
HAVING ABS(r.paid_amount - COALESCE(SUM(rp.amount), 0)) > 0.01
ORDER BY difference DESC;
```

## 🚀 Futuras Mejoras

### 1. Funcionalidades Planificadas
- [ ] Integración con pasarelas de pago
- [ ] Notificaciones automáticas de pagos
- [ ] Reportes avanzados de pagos
- [ ] API REST para pagos externos

### 2. Optimizaciones Técnicas
- [ ] Cache de consultas frecuentes
- [ ] Particionamiento de tabla reservation_payments
- [ ] Compresión de datos históricos
- [ ] Replicación para alta disponibilidad

### 3. Seguridad Adicional
- [ ] Encriptación de datos sensibles
- [ ] Auditoría de cambios de pagos
- [ ] Validación de firmas digitales
- [ ] Compliance PCI DSS

---

## 📞 Soporte Técnico

### Para Desarrolladores
- **Documentación API**: Ver interfaces TypeScript
- **Scripts de migración**: Ver carpeta `scripts/`
- **Logs del sistema**: Ver consola y archivos de log

### Para DevOps
- **Deployment**: Ver scripts de migración
- **Monitoreo**: Ver consultas de auditoría
- **Backup**: Ver estrategia de backup

---

*Documentación Técnica - Sistema de Historial de Pagos*
*Actualizada: Enero 2025*
*Admintermas - Termas de Llifen* 