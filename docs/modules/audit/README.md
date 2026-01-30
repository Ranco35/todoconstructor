# Módulo de Auditoría (Ventas POS y Facturas)

## Descripción general

Sistema de auditoría que registra todos los cambios (creación, modificación y eliminación) en:

- **Ventas POS** (`POSSale`)
- **Facturas de venta** (`invoices`)

Solo los **triggers** pueden insertar en las tablas de auditoría; el cliente autenticado no tiene permiso de escritura (RLS + REVOKE).

---

## Tablas

| Tabla | Descripción |
|-------|-------------|
| `public.pos_sale_audit_log` | Historial de cambios de ventas POS |
| `public.invoice_audit_log` | Historial de cambios de facturas de venta |

Columnas comunes: `id`, `sale_id`/`invoice_id`, `action_type` (CREATE \| UPDATE \| DELETE), `user_id`, `field_name`, `old_value`, `new_value`, `change_reason`, `created_at`.

---

## Triggers y funciones

- **`audit_pos_sale_changes()`** (SECURITY DEFINER): se ejecuta en INSERT/UPDATE/DELETE sobre `POSSale`. Audita cambios en `status` y en totales (`total`, `discountAmount`).
- **`audit_invoice_changes()`** (SECURITY DEFINER): se ejecuta en INSERT/UPDATE/DELETE sobre `invoices`. Audita cambios en `status`, `total` y `number`.

Los triggers insertan con el contexto del dueño de la función, por lo que pueden escribir en el audit log aunque RLS bloquee al rol `authenticated`.

---

## Seguridad (endurecimiento)

- **RLS** activado en ambas tablas.
- **Políticas:** solo `SELECT` para `authenticated`; `INSERT` bloqueado con `WITH CHECK (false)`.
- **Privilegios:** `REVOKE INSERT, UPDATE, DELETE` para `anon` y `authenticated`; `GRANT SELECT` para `authenticated`.

Detalle en la migración `20250130000002_harden_audit_logs.sql` y en [Verificación de audit logs](../../VERIFY_AUDIT_LOGS.md).

---

## Migraciones

| Archivo | Contenido |
|---------|-----------|
| `20250130000001_sales_and_invoice_audit_log.sql` | Creación de tablas, índices simples, políticas iniciales y triggers |
| `20250130000002_harden_audit_logs.sql` | RLS, políticas de solo lectura, REVOKE/GRANT, índices compuestos |

---

## Índices compuestos

- `idx_pos_sale_audit_log_sale_id_created_at` sobre `(sale_id, created_at DESC)`
- `idx_invoice_audit_log_invoice_id_created_at` sobre `(invoice_id, created_at DESC)`

Optimizan consultas por entidad ordenadas por fecha descendente.

---

## Código de aplicación

### Server actions

- **`src/actions/pos/get-sale-audit-history.ts`**  
  - `getPOSSaleAuditHistory(saleId)`: devuelve venta y audit log con usuarios resueltos.  
  - `user_name`: `user_id` null → "Sistema"; no resuelto en `User` → "Sin usuario"; resuelto → nombre.  
  - `user_email`: solo si existe en `User`; si no, `null`.  
  - Orden: `created_at DESC`.

- **`src/actions/sales/invoices/get-invoice-audit-history.ts`**  
  - `getInvoiceAuditHistory(invoiceId)`: devuelve factura y audit log con usuarios resueltos.  
  - Misma lógica de `user_name`/`user_email` y orden.

### Componentes UI

- **`src/components/pos/POSSaleAuditHistory.tsx`**: card de auditoría en el detalle de venta POS (`/dashboard/pos/sales/[id]`).
- **`src/components/sales/InvoiceAuditHistory.tsx`**: card de auditoría en el detalle de factura (`/dashboard/sales/invoices/[id]`).

Comportamiento: valores JSON en `old_value`/`new_value` se muestran formateados; CREATE/DELETE sin `field_name` muestran etiqueta "Acción"; usuario vacío se muestra como "Sistema".

---

## Verificación

Pasos para comprobar que el cliente no puede insertar, que los triggers sí insertan y que se usan los índices:

**[Verificación de audit logs (VERIFY_AUDIT_LOGS.md)](../../VERIFY_AUDIT_LOGS.md)**

Incluye:

- INSERT manual que debe fallar.
- UPDATE que cambie un campo auditado y comprobación de nueva fila en el audit log.
- `EXPLAIN (ANALYZE)` para revisar uso de índices.
- Consultas opcionales de políticas y grants.

---

## Resumen de archivos

```
supabase/migrations/
├── 20250130000001_sales_and_invoice_audit_log.sql
└── 20250130000002_harden_audit_logs.sql

src/actions/
├── pos/get-sale-audit-history.ts
└── sales/invoices/get-invoice-audit-history.ts

src/components/
├── pos/POSSaleAuditHistory.tsx
└── sales/InvoiceAuditHistory.tsx

docs/
├── VERIFY_AUDIT_LOGS.md
└── modules/audit/README.md  (este documento)
```
