# Corrección: Error al Editar Reservas - Cliente No Cargado

## Problema Reportado

Al intentar editar una reserva existente, el sistema mostraba el mensaje de error:
```
"Debe seleccionar o registrar un cliente antes de crear la reserva"
```

Esto ocurría porque el modal de reservas no estaba cargando automáticamente el cliente asociado a la reserva cuando se abría para edición.

## Causa Raíz

El `ReservationModal` component tenía lógica para validar que un cliente estuviera seleccionado antes de permitir guardar la reserva, pero **no tenía lógica para cargar automáticamente el cliente existente** cuando se abría para editar una reserva.

### Flujo Problemático
1. Usuario hace clic en "Editar" reserva
2. Se abre `ReservationModal` con datos de la reserva
3. Los datos del formulario se cargan correctamente 
4. **PERO** el estado `selectedClient` permanece `null`
5. Al intentar guardar: validación falla → error mostrado

## Solución Implementada

### 1. Importación de función necesaria
```typescript
// En src/components/reservations/ReservationModal.tsx
import { searchClients, getClientByRut, createClient, getClient } from '@/actions/clients';
```

### 2. Nuevo useEffect para cargar cliente en edición
```typescript
// Cargar cliente existente cuando se abre para edición
useEffect(() => {
  const loadExistingClient = async () => {
    if (reservation?.client_id && !selectedClient) {
      try {
        const result = await getClient(reservation.client_id);
        if (result.success && result.data) {
          handleSelectClient(result.data);
        }
      } catch (error) {
        console.error('Error cargando cliente existente:', error);
      }
    } else if (!reservation?.client_id) {
      // Limpiar cliente seleccionado cuando se abre para crear nueva reserva
      setSelectedClient(null);
    }
  };

  loadExistingClient();
}, [reservation?.client_id]);
```

## Lógica de la Solución

### ✅ Para Editar Reserva:
1. Se detecta que `reservation.client_id` existe
2. Se llama a `getClient(client_id)` para obtener datos completos
3. Se ejecuta `handleSelectClient()` que:
   - Establece `selectedClient` con los datos del cliente
   - Prellenea el formulario con información del cliente
   - Elimina el estado de error

### ✅ Para Nueva Reserva:
1. Se detecta que `reservation.client_id` es `null/undefined`
2. Se limpia `selectedClient` para empezar fresh
3. Usuario debe buscar/seleccionar cliente manualmente

## Beneficios

- **Flujo intuitivo**: Al editar, el cliente ya está preseleccionado
- **Menos clics**: No hay que volver a buscar el cliente
- **Consistencia**: Misma validación para crear/editar
- **UX mejorada**: No hay mensajes de error confusos

## Archivos Modificados

- `src/components/reservations/ReservationModal.tsx`
  - Importación de `getClient` function
  - Nuevo useEffect para cargar cliente existente
  - Lógica para limpiar estado entre modos

## Resultado Final

✅ **Editar reserva**: Cliente se carga automáticamente, formulario ready para modificar
✅ **Nueva reserva**: Estado limpio, usuario busca/selecciona cliente
✅ **Validación**: Mantiene seguridad - siempre requiere cliente seleccionado
✅ **Performance**: Solo carga cliente cuando es necesario

El sistema ahora maneja correctamente tanto la creación como la edición de reservas sin errores de validación incorrectos. 