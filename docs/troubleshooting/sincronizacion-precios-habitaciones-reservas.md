# Sincronización de Precios de Habitaciones con Sistema de Reservas

## 📋 Resumen del Problema

**Fecha**: Julio 2025  
**Problema**: Los cambios de precios en habitaciones no se reflejaban automáticamente en el sistema de reservas  
**Causa Raíz**: El sistema de reservas modulares usa la tabla `products_modular` mientras que la configuración de habitaciones usa la tabla `rooms`  
**Estado**: ✅ **RESUELTO**

## 🚨 Síntomas Observados

1. **Cambio de precio no reflejado**: Al cambiar el precio de una habitación de $50.000 a $60.000, el sistema de reservas seguía mostrando $50.000
2. **Datos desincronizados**: Los precios en configuración de habitaciones y reservas no coincidían
3. **Caché persistente**: Los cambios no se actualizaban automáticamente

## 🔍 Análisis Técnico

### Arquitectura del Sistema

```
Configuración de Habitaciones (rooms)
    ↓ (precio_per_night)
    Tabla: rooms
    
Sistema de Reservas Modulares (products_modular)
    ↓ (price)
    Tabla: products_modular
```

### Causa Raíz
El sistema de reservas modulares obtiene los precios de habitaciones desde la tabla `products_modular`, no desde la tabla `rooms`. Cuando se actualiza un precio en `rooms`, este cambio no se propaga automáticamente a `products_modular`.

## 🛠️ Solución Implementada

### 1. Función de Sincronización Automática

**Archivo**: `src/actions/configuration/room-actions.ts`

```typescript
export async function syncRoomPricesWithModular() {
  // Obtener todas las habitaciones activas
  const rooms = await supabase.from('rooms').select('*').eq('is_active', true);
  
  for (const room of rooms) {
    // Buscar producto modular correspondiente
    const existingProduct = await supabase
      .from('products_modular')
      .select('*')
      .eq('code', `habitacion_${room.number.toLowerCase()}`)
      .eq('category', 'alojamiento')
      .single();
    
    if (existingProduct) {
      // Actualizar precio si es diferente
      if (existingProduct.price !== room.price_per_night) {
        await supabase
          .from('products_modular')
          .update({ price: room.price_per_night })
          .eq('id', existingProduct.id);
      }
    } else {
      // Crear nuevo producto modular
      await supabase.from('products_modular').insert({
        code: `habitacion_${room.number.toLowerCase()}`,
        name: `Habitación ${room.number} - ${room.type}`,
        price: room.price_per_night,
        category: 'alojamiento',
        per_person: false,
        is_active: true
      });
    }
  }
  
  // Revalidar caché
  revalidatePath('/dashboard/configuration/rooms');
  revalidatePath('/dashboard/reservations');
}
```

### 2. Sincronización Automática en Operaciones CRUD

**Funciones modificadas**:
- `createRoom()` - Sincroniza al crear habitación
- `updateRoom()` - Sincroniza al actualizar habitación
- `deleteRoom()` - Sincroniza al eliminar habitación

### 3. Botón de Sincronización Manual

**Archivo**: `src/app/dashboard/configuration/rooms/RoomsClient.tsx`

```typescript
const handleSyncPrices = async () => {
  setSyncing(true);
  try {
    const result = await syncRoomPricesWithModular();
    if (result.success) {
      alert(`✅ ${result.message}`);
      loadRooms(currentPage, search);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    alert("Error al sincronizar precios");
  } finally {
    setSyncing(false);
  }
};
```

## 🎯 Funcionalidades Implementadas

### 1. Sincronización Automática
- **Trigger**: Al crear, actualizar o eliminar habitaciones
- **Acción**: Actualiza automáticamente los precios en `products_modular`
- **Revalidación**: Limpia el caché de Next.js para ambas rutas

### 2. Sincronización Manual
- **Botón**: "Sincronizar Precios" en la interfaz de habitaciones
- **Feedback**: Muestra progreso y resultado de la operación
- **Recarga**: Actualiza la lista de habitaciones después de sincronizar

### 3. Mapeo Inteligente
- **Código**: `habitacion_{numero}` (ej: `habitacion_101`)
- **Categoría**: `alojamiento`
- **Precio**: Sincroniza `price_per_night` → `price`

## 📊 Resultados

### Antes de la Solución
- ❌ Cambios de precio no se reflejaban en reservas
- ❌ Datos desincronizados entre tablas
- ❌ Requería intervención manual

### Después de la Solución
- ✅ Sincronización automática al modificar habitaciones
- ✅ Botón manual para sincronización inmediata
- ✅ Precios consistentes en todo el sistema
- ✅ Revalidación automática de caché

## 🔧 Uso del Sistema

### Sincronización Automática
1. Ir a **Configuración > Habitaciones**
2. Editar una habitación y cambiar el precio
3. Guardar cambios
4. ✅ Los precios se sincronizan automáticamente

### Sincronización Manual
1. Ir a **Configuración > Habitaciones**
2. Hacer clic en **"Sincronizar Precios"**
3. Esperar confirmación
4. ✅ Verificar que los precios estén actualizados en reservas

## 🚀 Beneficios

1. **Consistencia**: Precios sincronizados en todo el sistema
2. **Automatización**: No requiere intervención manual
3. **Transparencia**: Feedback claro sobre el estado de sincronización
4. **Mantenibilidad**: Código limpio y documentado
5. **Escalabilidad**: Funciona con cualquier número de habitaciones

## 📝 Notas Técnicas

### Estructura de Datos
- **Tabla `rooms`**: Configuración principal de habitaciones
- **Tabla `products_modular`**: Productos para sistema de reservas
- **Mapeo**: `rooms.number` → `products_modular.code`

### Revalidación de Caché
- **Rutas afectadas**: `/dashboard/configuration/rooms`, `/dashboard/reservations`
- **Trigger**: Después de cada operación de sincronización
- **Resultado**: Datos actualizados inmediatamente en la interfaz

### Manejo de Errores
- **Búsqueda**: Maneja casos donde no existe producto modular
- **Inserción**: Crea productos modulares faltantes automáticamente
- **Actualización**: Solo actualiza si el precio es diferente

---

**Fecha de Documentación**: Julio 2025  
**Sistema**: Hotel/Spa Admintermas  
**Estado**: Completamente Operativo  
**Mantenimiento**: Automático 