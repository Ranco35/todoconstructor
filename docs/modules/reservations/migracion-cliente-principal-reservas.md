# Migración del Sistema de Reservas: Cliente Principal como Dato Central

## Resumen Ejecutivo

Esta migración transforma el sistema de reservas para que el **cliente principal** (nombre y RUT) sea el dato central y obligatorio, mientras que el **huésped** pasa a ser un campo opcional e informativo que solo se muestra en el detalle de la reserva cuando es diferente al cliente.

## Objetivos de la Migración

### Antes de la Migración
- El sistema mostraba el nombre del huésped como dato principal en listas y dashboard
- La búsqueda funcionaba por nombre del huésped
- El formulario de reserva priorizaba el campo "huésped"
- No había distinción clara entre cliente (titular) y huésped

### Después de la Migración
- **Cliente principal** (nombre y RUT) es el dato central y obligatorio
- **Huésped** solo se muestra en el detalle si existe y es diferente al cliente
- **Búsqueda** funciona por nombre y RUT del cliente principal
- **Formulario** obliga selección de cliente por RUT, huésped es opcional

## Cambios Implementados

### 1. Backend - Obtención de Datos

#### Archivo: `src/actions/reservations/dashboard.ts`

**Cambios realizados:**
- Modificada la consulta `getRecentReservations` para incluir join con tabla `Client`
- Agregados campos `client_nombre` y `client_rut` a la interfaz `RecentReservation`
- Eliminada dependencia de `guest_name` y `authorized_by` para visualización principal

```typescript
// Antes
.select(`
  id,
  guest_name,
  authorized_by,
  check_in,
  check_out,
  status,
  total_amount,
  created_at,
  room:rooms(number)
`)

// Después
.select(`
  id,
  client_id,
  check_in,
  check_out,
  status,
  total_amount,
  created_at,
  room:rooms(number),
  client:Client(nombrePrincipal, rut)
`)
```

### 2. Frontend - Visualización

#### Archivo: `src/components/reservations/ReservationsDashboard.tsx`

**Cambios realizados:**
- Dashboard muestra solo el nombre y RUT del cliente principal
- Eliminada visualización del huésped en la lista principal
- Actualizada función de eliminación para usar nombre del cliente

```typescript
// Antes
<h4 className="font-semibold text-gray-900">
  {reservation.guest_name}
</h4>

// Después
<h4 className="font-semibold text-gray-900">
  {reservation.client_nombre} ({reservation.client_rut})
</h4>
```

#### Archivo: `src/components/reservations/ReservationsList.tsx`

**Cambios realizados:**
- Lista de reservas muestra solo el cliente principal
- Búsqueda actualizada para incluir nombre y RUT del cliente
- Eliminada dependencia del huésped en la visualización principal

```typescript
// Búsqueda actualizada
if (searchTerm) {
  filtered = filtered.filter(r => 
    r.client_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client_rut?.includes(searchTerm) ||
    r.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.guest_phone.includes(searchTerm) ||
    r.id.toString().includes(searchTerm)
  );
}
```

### 3. Detalle de Reserva

#### Archivo: `src/app/dashboard/reservations/[id]/ReservationDetailClient.tsx`

**Cambios realizados:**
- Sección dedicada al cliente principal con nombre y RUT
- Sección condicional para el huésped solo si existe y es diferente
- Información clara sobre quién es el titular vs. el huésped

```typescript
{/* Cliente Principal - Siempre visible */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
    <UserIcon size={20} />
    Cliente Principal
  </h3>
  <div className="space-y-2">
    <div>
      <label className="text-sm font-medium text-gray-600">Nombre</label>
      <p className="text-gray-900">{reservation.client?.nombrePrincipal} ({reservation.client?.rut})</p>
    </div>
  </div>
</div>

{/* Huésped - Solo si es diferente al cliente */}
{reservation.guest_name && reservation.guest_name !== reservation.client?.nombrePrincipal && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <UserIcon size={20} />
      Huésped
    </h3>
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-gray-600">Nombre</label>
        <p className="text-gray-900">{reservation.guest_name}</p>
      </div>
    </div>
  </div>
)}
```

## Estructura de Datos

### Tabla de Reservas
```sql
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES Client(id), -- Cliente principal (obligatorio)
  guest_name VARCHAR(255), -- Huésped (opcional, informativo)
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  -- ... otros campos
);
```

### Relaciones
- **reservations.client_id** → **Client.id** (obligatorio)
- **reservations.guest_name** (opcional, solo informativo)

## Flujo de Usuario

### 1. Creación de Reserva
1. Usuario selecciona cliente por RUT (buscador/autocompletar)
2. Sistema asigna automáticamente el `client_id`
3. Campo "huésped" es opcional y solo informativo
4. Al guardar, siempre se asocia con el cliente principal

### 2. Visualización en Dashboard
- Solo se muestra: **"Nombre Cliente (RUT)"**
- No se muestra información del huésped
- Búsqueda funciona por nombre y RUT del cliente

### 3. Detalle de Reserva
- **Sección "Cliente Principal":** Nombre y RUT del titular
- **Sección "Huésped":** Solo si existe y es diferente al cliente

## Beneficios de la Migración

### 1. Claridad en la Gestión
- Identificación clara del titular de la reserva
- Distinción entre quien paga y quien se hospeda
- Trazabilidad completa por RUT del cliente

### 2. Mejoras en Búsqueda
- Búsqueda eficiente por RUT (identificador único)
- Filtrado por cliente principal
- Historial de reservas por cliente

### 3. Gestión de Relaciones
- Asociación correcta de pagos con el cliente
- Historial de reservas por cliente
- Reportes centrados en el cliente principal

## Validaciones Implementadas

### 1. Backend
- `client_id` es obligatorio en todas las operaciones
- Validación de existencia del cliente antes de crear reserva
- Verificación de RUT válido

### 2. Frontend
- Formulario requiere selección de cliente
- Campo huésped es opcional
- Visualización condicional del huésped

## Pruebas Recomendadas

### 1. Funcionalidad Básica
- [ ] Crear reserva con cliente existente
- [ ] Crear reserva con huésped diferente al cliente
- [ ] Crear reserva sin huésped (solo cliente)

### 2. Búsqueda y Filtrado
- [ ] Buscar reserva por RUT del cliente
- [ ] Buscar reserva por nombre del cliente
- [ ] Verificar que no se busque por huésped

### 3. Visualización
- [ ] Dashboard muestra solo cliente principal
- [ ] Detalle muestra cliente y huésped (si corresponde)
- [ ] Lista de reservas muestra solo cliente principal

## Consideraciones Técnicas

### 1. Migración de Datos Existentes
- Las reservas existentes mantienen su `client_id`
- El campo `guest_name` se preserva para compatibilidad
- No se requieren migraciones de base de datos

### 2. Compatibilidad
- APIs existentes mantienen compatibilidad
- Frontend adaptado gradualmente
- No hay breaking changes en la estructura de datos

### 3. Performance
- Joins optimizados con índices en `client_id`
- Búsqueda por RUT más eficiente que por nombre
- Caching de datos del cliente cuando sea apropiado

## Estado de Implementación

### ✅ Completado
- [x] Modificación de consultas para incluir datos del cliente
- [x] Actualización de dashboard para mostrar cliente principal
- [x] Actualización de lista de reservas
- [x] Actualización del detalle de reserva
- [x] Interfaz de tipos actualizada

### 🔄 En Progreso
- [ ] Actualización del formulario de reserva
- [ ] Implementación de búsqueda por RUT
- [ ] Validaciones de backend completas

### ⏳ Pendiente
- [ ] Pruebas de integración
- [ ] Documentación de API
- [ ] Guía de usuario final

## Conclusión

Esta migración establece una base sólida para la gestión de reservas centrada en el cliente principal, mejorando la trazabilidad, búsqueda y gestión de relaciones cliente-reserva. El sistema ahora distingue claramente entre el titular de la reserva (cliente con RUT) y el huésped (información opcional), proporcionando mayor claridad y eficiencia en la gestión hotelera. 