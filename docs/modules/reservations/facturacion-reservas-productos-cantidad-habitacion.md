# Mejora: Facturación de Reservas con Cantidad Real y Habitación

## Problema original
- Los productos y servicios en la factura de reserva siempre aparecían con cantidad 1, sin reflejar el número real de pasajeros o noches.
- No se mostraba explícitamente la línea de la habitación seleccionada ni su valor en el resumen de productos.

## Solución aplicada

### Backend
- Al construir las líneas de productos para la factura (`create-invoice-from-reservation.ts`), ahora:
  - Se detecta si un producto es de tipo HOSPEDAJE (habitación) y se muestra como "Habitación: {nombre}" con la cantidad de noches y valor total.
  - Para productos por persona, la cantidad refleja el número real de pasajeros (adultos+niños) si aplica.
  - El resto de productos muestra la cantidad y subtotal real.

### Frontend
- En la pestaña Factura de la gestión de reserva (`ReservationManagementModal.tsx`):
  - Se muestra la línea de la habitación seleccionada al inicio del listado de productos, con nombre y valor.
  - Cada producto/servicio muestra la cantidad real y el subtotal (cantidad x precio unitario).
  - El formato visual es más claro y profesional.

## Archivos modificados
- `src/actions/reservations/create-invoice-from-reservation.ts`
- `src/components/reservations/ReservationManagementModal.tsx`

## Estado final
- El usuario ve un desglose fiel y transparente de todos los cargos de la reserva.
- Se evitan errores de facturación por cantidades incorrectas.
- La experiencia de usuario es más clara y profesional. 