# Error: Columna 'adults' no encontrada en tabla reservations

## 🚨 Problema Identificado

Al intentar crear una reserva en el sistema modular, se produce el siguiente error:

```
Error creating reservation: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'adults' column of 'reservations' in the schema cache"
}
```

## 🔍 Análisis del Problema

### **Causa Raíz**
La tabla `reservations` original no está diseñada para el sistema modular de reservas. Tiene una estructura diferente:

**Tabla `reservations` (original):**
- `guests` (número total de huéspedes)
- `guest_name`, `guest_email`, `guest_phone`
- `check_in`, `check_out`
- `room_id` (referencia a tabla rooms)
- Campos de facturación y pagos

**Sistema Modular necesita:**
- `adults` (número de adultos)
- `children` (número de niños)
- `children_ages` (array con edades)
- `package_modular_id` (referencia a packages_modular)
- `room_code`, `package_code`
- `additional_products` (array)
- `pricing_breakdown` (JSON con desglose)

## ✅ Solución Implementada

### **1. Nueva Tabla: `modular_reservations`**

Se creó una tabla específica para almacenar los datos del sistema modular:

```sql
CREATE TABLE modular_reservations (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Datos específicos del sistema modular
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  children_ages JSONB DEFAULT '[]',
  package_modular_id BIGINT REFERENCES packages_modular(id),
  room_code VARCHAR(100) NOT NULL,
  package_code VARCHAR(100) NOT NULL,
  additional_products JSONB DEFAULT '[]',
  
  -- Información de precios
  pricing_breakdown JSONB,
  room_total DECIMAL(12,2) DEFAULT 0,
  package_total DECIMAL(12,2) DEFAULT 0,
  additional_total DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  nights INTEGER NOT NULL,
  daily_average DECIMAL(12,2) DEFAULT 0,
  
  -- Información del cliente
  client_id BIGINT REFERENCES clients(id),
  
  -- Comentarios y estado
  comments TEXT,
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### **2. Función `createModularReservation` Actualizada**

La función ahora:
1. **Crea reserva principal** en tabla `reservations` con datos básicos
2. **Crea registro modular** en tabla `modular_reservations` con datos específicos
3. **Maneja errores** con rollback automático si falla alguna parte

```typescript
// Crear la reserva principal (datos básicos)
const { data: reservation, error: reservationError } = await supabase
  .from('reservations')
  .insert({
    guest_name: reservationData.guest_name,
    guest_email: reservationData.email,
    guest_phone: reservationData.phone,
    check_in: reservationData.check_in,
    check_out: reservationData.check_out,
    guests: reservationData.adults + reservationData.children, // Total de huéspedes
    room_id: roomProduct.id,
    client_type: 'individual',
    billing_name: reservationData.guest_name,
    billing_rut: 'N/A',
    billing_address: 'N/A',
    authorized_by: 'Sistema',
    status: 'pending',
    total_amount: pricing.grand_total,
    payment_status: 'no_payment',
    payment_method: 'pending'
  })
  .select()
  .single();

// Crear el registro en modular_reservations (datos específicos)
const { data: modularReservation, error: modularError } = await supabase
  .from('modular_reservations')
  .insert({
    reservation_id: reservation.id,
    adults: reservationData.adults,
    children: reservationData.children,
    children_ages: reservationData.children_ages,
    package_modular_id: packageData.id,
    room_code: reservationData.room_code,
    package_code: reservationData.package_code,
    additional_products: reservationData.additional_products,
    pricing_breakdown: pricing.breakdown,
    room_total: pricing.room_total,
    package_total: pricing.package_total,
    additional_total: pricing.additional_total,
    grand_total: pricing.grand_total,
    nights: nights,
    daily_average: pricing.daily_average,
    client_id: reservationData.client_id,
    comments: reservationData.comments,
    status: 'active'
  })
  .select()
  .single();
```

## 📁 Archivos Modificados

### **1. Migración SQL**
- `supabase/migrations/20250101000053_create_modular_reservations.sql`
- `scripts/create-modular-reservations-table.sql`

### **2. Función de Creación**
- `src/actions/products/modular-products.ts` - Función `createModularReservation`

### **3. Scripts de Aplicación**
- `scripts/apply-modular-reservations-table.sql`
- `scripts/apply-modular-reservations.js`

## 🔧 Pasos para Aplicar la Solución

### **Opción 1: SQL Editor de Supabase**
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar y pegar el contenido de `scripts/create-modular-reservations-table.sql`
3. Ejecutar el script

### **Opción 2: Supabase CLI**
```bash
# Aplicar migración específica
npx supabase db push --include-all
```

### **Opción 3: Script Node.js**
```bash
# Ejecutar script de aplicación
node scripts/apply-modular-reservations.js
```

## 🧪 Verificación

### **1. Verificar Tabla Creada**
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'modular_reservations';
```

### **2. Verificar Políticas RLS**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'modular_reservations';
```

### **3. Probar Creación de Reserva**
- Ir a `/dashboard/reservations`
- Crear una nueva reserva modular
- Verificar que no hay errores de columna

## 🎯 Beneficios de la Solución

### **1. Separación de Responsabilidades**
- **Tabla `reservations`**: Datos básicos de reserva (compatible con sistema original)
- **Tabla `modular_reservations`**: Datos específicos del sistema modular

### **2. Compatibilidad**
- ✅ No afecta sistema de reservas original
- ✅ Mantiene integridad referencial
- ✅ Permite migración gradual

### **3. Escalabilidad**
- ✅ Fácil agregar nuevos campos modulares
- ✅ Independiente de cambios en tabla principal
- ✅ Optimizado para consultas específicas

## 🚀 Estado del Proyecto

### **✅ Completado**
- [x] Análisis del problema
- [x] Diseño de solución
- [x] Creación de tabla modular_reservations
- [x] Actualización de función createModularReservation
- [x] Scripts de aplicación
- [x] Documentación completa

### **🔄 Pendiente**
- [ ] Aplicar migración en base de datos
- [ ] Probar creación de reservas
- [ ] Verificar funcionalidad completa

## 💡 Próximos Pasos

1. **Aplicar migración** usando uno de los métodos descritos
2. **Probar creación** de reservas modulares
3. **Verificar indicador** de temporada funciona correctamente
4. **Documentar** cualquier problema adicional

---

## 📝 Resumen

El error se debía a un **mismatch entre la estructura de la tabla `reservations` y los datos que intentaba insertar el sistema modular**. La solución implementa una **tabla separada `modular_reservations`** que almacena los datos específicos del sistema modular mientras mantiene la compatibilidad con el sistema original.

Esta arquitectura permite que ambos sistemas coexistan sin conflictos y facilita futuras mejoras del sistema modular. 