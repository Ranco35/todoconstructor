# Error Foreign Key Constraint: room_id_fkey

## 🚨 **Error Específico Identificado**

```
Error al crear la reserva: insert or update on table "reservations" violates foreign key constraint "reservations_room_id_fkey"
```

**Fecha**: 2025-01-02  
**Estado**: ✅ DIAGNOSTICADO - En proceso de corrección  
**Problema**: El `room_id` que se intenta insertar no existe en la tabla `rooms`

## 🔍 **Análisis del Problema**

### **Flujo de Mapeo de Habitaciones**
1. **Usuario selecciona**: `suite_junior` (código del sistema modular)
2. **Sistema busca**: En tabla `rooms` por `number = 'suite_junior'` ❌ (no existe)
3. **Sistema mapea**: `suite_junior` → `JR` (código corto)
4. **Sistema busca**: En tabla `rooms` por `number = 'JR'` ❌ (probablemente no existe)
5. **Sistema falla**: Foreign key constraint violation

### **Mapeo de Códigos Implementado**
```typescript
const roomCodeMapping: { [key: string]: string } = {
  'suite_junior': 'JR',
  'habitacion_estandar': 'STD', 
  'suite_matrimonial': 'MAT'
};
```

## 🔧 **Diagnóstico Necesario**

### **1. Verificar Estado Actual**
Ejecutar en **Supabase SQL Editor**:
```sql
-- Habitaciones actuales en tabla rooms
SELECT id, number, type, price_per_night FROM rooms;

-- Productos modulares de habitaciones
SELECT id, code, name FROM products_modular WHERE category = 'alojamiento';

-- Verificar si existen los códigos cortos necesarios
SELECT 'STD' as codigo, (SELECT id FROM rooms WHERE number = 'STD') as room_id
UNION ALL 
SELECT 'JR' as codigo, (SELECT id FROM rooms WHERE number = 'JR') as room_id
UNION ALL 
SELECT 'MAT' as codigo, (SELECT id FROM rooms WHERE number = 'MAT') as room_id;
```

### **2. Posibles Escenarios**

#### **Escenario A: Habitaciones con códigos cortos no existen**
```sql
-- Resultado esperado si no existen:
codigo | room_id
-------|--------
STD    | null
JR     | null
MAT    | null
```

#### **Escenario B: Habitaciones existen pero con códigos diferentes**
```sql
-- Posible resultado si existen con otros códigos:
id | number | type
---|--------|----------------
1  | 101    | Habitación Estándar
2  | 102    | Suite Junior
3  | 201    | Suite Matrimonial
```

## 💡 **Soluciones Preparadas**

### **Solución 1: Crear habitaciones con códigos cortos**
```sql
-- Crear habitaciones faltantes (ejecutar solo si no existen)
INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'STD', 'Habitación Estándar', 2, 1, 50000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'STD');

INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'JR', 'Suite Junior', 2, 2, 60000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'JR');

INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'MAT', 'Suite Matrimonial', 2, 3, 70000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'MAT');
```

### **Solución 2: Actualizar mapeo de códigos**
Si las habitaciones existen con otros códigos (ej: '101', '102'), actualizar el mapeo:
```typescript
const roomCodeMapping: { [key: string]: string } = {
  'suite_junior': '102',        // En lugar de 'JR'
  'habitacion_estandar': '101', // En lugar de 'STD'
  'suite_matrimonial': '201'    // En lugar de 'MAT'
};
```

## 📋 **Logs de Diagnóstico**

Para **completar el diagnóstico**, necesitamos ver los logs de consola:

```typescript
// Logs que deberían aparecer en consola del navegador:
🔍 Datos de reserva recibidos: {
  room_code: "suite_junior",
  package_code: "MEDIA_PENSION",
  client_id: 123
}

⚠️ No se encontró habitación con nombre: suite_junior
✅ Mapeado suite_junior → JR → ID: [NÚMERO O NULL]
```

## 🎯 **Pasos para Resolución**

1. **✅ HECHO**: Identificar error específico
2. **🔄 EN PROCESO**: Ejecutar script diagnóstico
3. **⏳ PENDIENTE**: Crear habitaciones faltantes
4. **⏳ PENDIENTE**: Probar reserva nuevamente
5. **⏳ PENDIENTE**: Confirmar funcionamiento

## 📁 **Archivos Relacionados**

- `scripts/diagnostic-rooms-simple.sql` - Script de diagnóstico
- `src/actions/products/modular-products.ts` - Lógica de mapeo
- `src/components/reservations/ModularReservationForm.tsx` - Frontend

## 🚀 **Próximos Pasos**

1. **Ejecutar script diagnóstico** en Supabase SQL Editor
2. **Reportar resultados** para determinar solución exacta
3. **Aplicar corrección** basada en diagnóstico
4. **Probar reserva** con logging detallado

---

**Estado**: Problema identificado, herramientas de diagnóstico listas, esperando ejecución para corrección específica. 