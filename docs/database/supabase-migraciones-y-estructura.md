# Documentación Completa de Base de Datos y Migraciones Supabase

## 1. Estructura General de la Base de Datos

La base de datos de este proyecto está gestionada en Supabase (PostgreSQL) y sincronizada mediante migraciones SQL versionadas en la carpeta `supabase/migrations/`.

- **Todas las tablas, relaciones y políticas están definidas en archivos SQL con timestamps.**
- El archivo `schema.md` contiene el detalle de las tablas y relaciones principales.

## 2. Migraciones: Flujo y Buenas Prácticas

- **Cada cambio estructural** (nueva tabla, columna, política, etc.) debe tener su propio archivo de migración con nombre: `<timestamp>_descripcion.sql`.
- Las migraciones se aplican en orden cronológico.
- No modifiques migraciones ya aplicadas en producción. Si necesitas revertir, crea una migración nueva que revierta el cambio.

### Ejemplo de migración:
```sql
-- 20250101000021_add_account_manager_to_supplier.sql
ALTER TABLE "Supplier"
ADD COLUMN "accountManager" TEXT,
ADD COLUMN "purchasingAgent" TEXT;
```

## 3. Sincronización con Supabase CLI (sin Docker)

**Este proyecto NO usa Docker localmente. Todo se sincroniza contra la base de datos remota de Supabase.**

### Pasos para sincronizar migraciones:
1. Inicia sesión en Supabase CLI:
   ```bash
   npx supabase login
   ```
2. Verifica el proyecto remoto:
   ```bash
   npx supabase projects list
   # El proyecto correcto debe estar marcado con ●
   ```
3. Aplica migraciones pendientes:
   ```bash
   npx supabase db push --linked --include-all
   ```
   Si pide confirmación, responde `y`.

### Problemas comunes y solución:
- **Error: columna ya existe**: Si una migración intenta crear una columna que ya existe, elimina o renombra la migración conflictiva y crea una migración vacía que solo marque como aplicada (o simplemente elimina la conflictiva si ya está en la base remota).
- **Error: Could not find column in schema cache**: Esto indica que el código espera una columna que no existe en la base. Verifica que todas las migraciones estén aplicadas y que el código esté actualizado.

## 4. Estructura de archivos relevante
- `supabase/migrations/`: Todas las migraciones SQL versionadas.
- `.env.local`: Variables de entorno con las claves de Supabase (no versionado en git).
- `src/lib/supabase-config.ts`: Configuración del cliente Supabase para frontend y backend.

## 5. Ejemplo de variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 6. Comandos útiles
- Listar migraciones aplicadas:
  ```bash
  npx supabase migration list --linked
  ```
- Ver diferencias entre migraciones locales y remotas:
  ```bash
  npx supabase db diff --linked
  ```

## 7. Notas finales
- **Nunca borres migraciones ya aplicadas en producción.**
- Si tienes dudas, revisa los archivos `schema.md` y `prisma-fields.md` para entender la estructura actual.
- Si necesitas ayuda, consulta la [documentación oficial de Supabase](https://supabase.com/docs/guides/cli).

---

**Última actualización:** 2025-06-27 