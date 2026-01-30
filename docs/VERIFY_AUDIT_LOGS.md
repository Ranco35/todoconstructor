# Verificación de audit logs (POS e invoices)

Pasos para comprobar que los audit logs están endurecidos: solo triggers insertan, cliente no puede insertar, e índices se usan correctamente.

## Requisitos

- Acceso a la base de datos (Supabase SQL Editor o `psql`).
- Rol `authenticated` para las pruebas de inserción bloqueada.

---

## 1. Comprobar que el cliente NO puede insertar

Con una sesión autenticada (o simulando rol `authenticated`), ejecutar:

```sql
-- Debe fallar con error de política RLS o de permiso
INSERT INTO public.pos_sale_audit_log (sale_id, action_type, user_id, field_name, old_value, new_value)
VALUES (1, 'CREATE', auth.uid(), NULL, NULL, 'test manual');
```

Resultado esperado: **error** (policy violation o `permission denied for table pos_sale_audit_log`).

```sql
-- Debe fallar igual
INSERT INTO public.invoice_audit_log (invoice_id, action_type, user_id, field_name, old_value, new_value)
VALUES (1, 'CREATE', auth.uid(), NULL, NULL, 'test manual');
```

Resultado esperado: **error**.

Si no tienes `auth.uid()` en SQL Editor, usa un UUID cualquiera; el importante es que el INSERT falle.

---

## 2. Comprobar que el trigger SÍ inserta

Tras un UPDATE en la tabla origen que **cambie un campo auditado**, debe aparecer una fila nueva en el audit log (el trigger corre como `SECURITY DEFINER`, por tanto puede insertar aunque el cliente no pueda).

### POS

El trigger audita cambios en `status` y en totales (`total`, `discountAmount`). Ejemplo cambiando descuento:

```sql
-- Sustituir <id> por un id real de POSSale
-- Cambiar un campo auditado para que el trigger inserte (ej.: discountAmount +1 luego -1 para no alterar datos)
UPDATE public."POSSale"
SET "discountAmount" = COALESCE("discountAmount", 0) + 1
WHERE id = <id>;

-- Ver últimas filas del audit (sustituir <id> por el mismo)
SELECT id, sale_id, action_type, user_id, field_name, old_value, new_value, created_at
FROM public.pos_sale_audit_log
WHERE sale_id = <id>
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:** aparece al menos una fila nueva con `action_type = 'UPDATE'` y `field_name = 'totals'` (o `'status'` si se audita ese cambio). Opcional: revertir el cambio con `SET "discountAmount" = "discountAmount" - 1 WHERE id = <id>`.

### Invoice

El trigger audita cambios en `status`, `total` y `number`. Ejemplo cambiando estado:

```sql
-- Sustituir <id> por un id real de invoices y usar un valor distinto al actual (ej. draft -> sent)
-- Primero ver el status actual: SELECT id, status FROM public.invoices WHERE id = <id>;
UPDATE public.invoices
SET status = CASE WHEN status = 'draft' THEN 'sent' ELSE 'draft' END
WHERE id = <id>;

SELECT id, invoice_id, action_type, user_id, field_name, old_value, new_value, created_at
FROM public.invoice_audit_log
WHERE invoice_id = <id>
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:** aparece una fila nueva con `action_type = 'UPDATE'` y `field_name = 'status'`. Opcional: ejecutar de nuevo el UPDATE para dejar el status como estaba.

---

## 3. Comprobar índices con EXPLAIN ANALYZE

Para consultas por `sale_id` / `invoice_id` ordenadas por `created_at DESC`, el plan debería usar los índices compuestos.

### POS

```sql
-- Sustituir 1 por un sale_id existente
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.pos_sale_audit_log
WHERE sale_id = 1
ORDER BY created_at DESC;
```

Comprobar en el plan que se use `idx_pos_sale_audit_log_sale_id_created_at` (o equivalente) cuando exista el índice.

### Invoice

```sql
-- Sustituir 1 por un invoice_id existente
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.invoice_audit_log
WHERE invoice_id = 1
ORDER BY created_at DESC;
```

Comprobar uso de `idx_invoice_audit_log_invoice_id_created_at` (o equivalente).

---

## 4. Consultas útiles de validación (opcional)

Listar políticas de las tablas de auditoría:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('pos_sale_audit_log', 'invoice_audit_log');
```

Listar privilegios por tabla:

```sql
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('pos_sale_audit_log', 'invoice_audit_log')
ORDER BY table_name, grantee, privilege_type;
```

Esperado: para `authenticated` (y `anon` si aplica) solo `SELECT`; no `INSERT`, `UPDATE` ni `DELETE`.

---

## Notas

- Si el SQL Editor de Supabase no ejecuta como `authenticated`, el INSERT podría fallar por otro motivo (por ejemplo, por `REVOKE`). Lo importante es que **no** se permita insertar desde la aplicación/cliente.
- Los triggers están definidos con `SECURITY DEFINER`, por lo que se ejecutan con el dueño de la función y pueden insertar aunque RLS bloquee al rol `authenticated`.

---

## Documentación del módulo

Documentación completa del módulo de auditoría (tablas, triggers, código, migraciones): [modules/audit/README.md](modules/audit/README.md).
