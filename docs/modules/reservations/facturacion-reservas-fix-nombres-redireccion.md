# Fix: Nombres de productos y redirección en facturación de reservas

## Problema original
- Al crear una factura desde una reserva, los productos aparecían como "Producto sin descripción" o vacíos si el producto había sido eliminado o no existía relación directa.
- Tras crear la factura, el sistema redirigía al calendario en vez de mostrar la factura en borrador.

## Solución aplicada

### 1. Nombres de productos siempre correctos
- El backend ahora enriquece cada línea de la factura buscando el nombre real del producto modular o spa.
- Si el producto fue eliminado, muestra "Producto eliminado (ID: xxx)" para depuración.
- Si no hay descripción, usa el nombre como descripción.
- Esto garantiza que todas las líneas de la factura tengan un nombre claro y nunca aparezcan vacías.

### 2. Redirección automática tras crear factura
- Al crear una factura desde una reserva, el frontend redirige automáticamente a la página de la factura en borrador (`/dashboard/sales/invoices/[id]`).
- El usuario ya no vuelve al calendario, sino que ve inmediatamente la factura recién creada para revisión o edición.

## Archivos modificados
- `src/actions/reservations/create-invoice-from-reservation.ts` (enriquecimiento manual de productos)
- `src/components/reservations/CreateInvoiceFromReservation.tsx` (redirección automática tras éxito)

## Estado final
- Facturación desde reservas 100% funcional y robusta.
- UX mejorada: nombres claros y flujo directo a la factura.
- Documentación actualizada para futuros desarrollos. 