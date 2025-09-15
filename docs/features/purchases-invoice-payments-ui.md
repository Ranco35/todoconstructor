## Actualización: Vista de Factura de Compras con Pagos (Cliente)

### Objetivo
Mostrar en la página de detalle de factura:
- Información de la factura (estado, estado de pago, neto, IVA, total, fecha)
- Información financiera: lista de pagos, Total Pagado, Saldo Pendiente, último pago y métodos
- Proveedor y Bodega de destino
- Tabla de Productos/Servicios con cantidades, precios, descuento, IVA y total de línea

Todo renderizado en cliente para evitar problemas de SSR y con integración directa a Supabase.

### Archivo principal
`src/app/dashboard/purchases/invoices/[id]/page.tsx`

### Puntos técnicos
- Página client-only con `next/dynamic` (`ssr: false`).
- Obtención de datos en `useEffect`:
  - Tabla `purchase_invoices` (factura)
  - Tabla `purchase_payments` (pagos por `invoice_id`)
  - Tabla `purchase_invoice_lines` con `Product` anidado (líneas)
  - Tablas auxiliares `Supplier` y `Warehouse` (si existen `supplier_id` / `warehouse_id`).
- Cliente Supabase de navegador:
  ```ts
  import { createBrowserClient } from '@supabase/ssr'
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  ```
- UI con tarjetas (shadcn): Información de la Factura, Información Financiera, Proveedor, Bodega, Productos/Servicios.

### Cálculos en UI
- Neto/IVA/Total: usa cabecera; si faltan, se calculan desde las líneas.
- IVA por línea: si `tax_amount` es nulo/0 y hay `tax_rate`, se computa; si tampoco hay tasa, se infiere desde `line_total`.
- `Total Pagado` = suma de `amount` de `payments`.
- `Saldo Pendiente` = `total` de la factura − `Total Pagado`.
- `Estado de Pago` derivado si no existe: `paid` si pagado ≥ total − 1; `partial` si > 0; `pending` si 0.
- Último pago y métodos: se derivan desde `payments`.
- Formateo CLP: `toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })`.

### Razón de diseño
- Evitar errores de hidratación y warnings de cookies haciendo la vista completamente cliente.
- Mantener la experiencia consistente independientemente de la sesión/puerto.
- Mostrar valores coherentes aunque en BD falten `tax_amount`/`subtotal`/`payment_status` (se derivan en cliente para visualización).

### Verificación
- Abrir `http://localhost:3000/dashboard/purchases/invoices/<id>`
- Confirmar:
  - Badges de estado (Aprobada/Borrador/Anulada) y pago (Pagada/Pendiente/Parcial) en español.
  - Neto, IVA y Total correctos (o calculados desde líneas).
  - Tabla de líneas con IVA y Total por línea.
  - Información financiera: pagos, total pagado, saldo, último pago y métodos.

### Observaciones
- Si `Supplier`/`Warehouse` no tienen columnas esperadas, la tarjeta muestra texto de fallback ("Sin proveedor" / "Sin bodega asignada").
- Si aparecen respuestas 406 o advertencias de cookies, limpiar datos del sitio y re-iniciar sesión.
- La aprobación corrige IVA/total de líneas vacíos y sincroniza cabecera antes de validar (ver server action `approvePurchaseInvoice`).


