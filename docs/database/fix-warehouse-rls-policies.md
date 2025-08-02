# Corrección de RLS en tabla Warehouse (Supabase)

## Contexto del Problema

- **Fecha:** 2025-06-30
- **Módulo afectado:** Gestión de Bodegas (`Warehouse`)
- **Error:**
  > Error al crear la bodega: new row violates row-level security policy for table "Warehouse"
- **Síntomas:**
  - No se podían crear bodegas desde la interfaz web ni desde scripts.
  - El error persistía incluso con credenciales correctas y usuarios autenticados.
  - No era posible aplicar migraciones localmente ni conectarse a la base de datos desde el entorno de desarrollo (Docker Desktop no disponible, Supabase CLI no funcional).

## Causa

- La tabla `Warehouse` tenía habilitado Row Level Security (RLS) pero **no existían políticas permisivas** para permitir operaciones de usuarios autenticados ni del service role.
- Esto bloqueaba cualquier intento de inserción, actualización o eliminación, incluso desde scripts con service role.

## Solución Aplicada

### 1. Diagnóstico
- Se revisaron las migraciones y scripts existentes: no había ninguna política RLS explícita para `Warehouse`.
- Se intentó aplicar migraciones y scripts automáticos, pero la función `sql()` de Supabase no estaba disponible y la CLI no funcionaba por falta de Docker.

### 2. Script de Diagnóstico y Prueba
- Se creó el script `scripts/fix-warehouse-rls.js` para:
  - Verificar el estado de RLS y políticas existentes.
  - Probar inserción de una bodega de prueba.
  - Generar instrucciones SQL para ejecutar manualmente en Supabase Studio.

### 3. SQL Manual Ejecutado en Supabase Studio
Se ejecutó el siguiente bloque SQL en el **SQL Editor de Supabase Studio**:

```sql
-- Desactivar RLS temporalmente
ALTER TABLE public."Warehouse" DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow insert Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow read Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow update Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow delete Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Warehouse policy" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public."Warehouse";

-- Crear políticas permisivas
CREATE POLICY "Allow all operations on Warehouse" 
ON public."Warehouse"
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all for service role on Warehouse" 
ON public."Warehouse" 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Reactivar RLS
ALTER TABLE public."Warehouse" ENABLE ROW LEVEL SECURITY;
```

### 4. Corrección Adicional: Error de Importación
Después de resolver el RLS, apareció un error de importación en Next.js 15:
```
TypeError: (0 , next_cache__WEBPACK_IMPORTED_MODULE_3__.redirect) is not a function
```

**Solución:** Cambiar la importación de `redirect` de `next/cache` a `next/navigation`:
```typescript
// ANTES (Next.js 14)
import { revalidatePath, redirect } from 'next/cache';

// DESPUÉS (Next.js 15)
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
```

**Archivos corregidos:**
- `src/actions/configuration/warehouse-actions.ts`
- `src/actions/configuration/warehouse-assignment-actions.ts`

### 5. Verificación Final
- ✅ Se ejecutó el script de prueba y se pudo insertar y eliminar una bodega de prueba correctamente.
- ✅ La creación de bodegas desde la interfaz web funciona sin errores.
- ✅ Las políticas RLS están configuradas correctamente para usuarios autenticados y service role.

## Recomendaciones
- **Siempre** crear políticas RLS permisivas para tablas nuevas con RLS habilitado, especialmente para roles `authenticated` y `service_role`.
- Si no puedes usar la CLI o migraciones locales, usa Supabase Studio > SQL Editor para aplicar correcciones urgentes.
- Mantener un script de diagnóstico (`scripts/fix-warehouse-rls.js`) para futuras incidencias.
- **En Next.js 15+**, usar `redirect` desde `next/navigation` en lugar de `next/cache`.

## Archivos Relacionados
- `supabase/migrations/20250101000017_fix_warehouse_rls_policies.sql` (migración formal)
- `scripts/fix-warehouse-rls.js` (script de diagnóstico y ayuda)
- `src/actions/configuration/warehouse-actions.ts` (corregido para Next.js 15)
- `src/actions/configuration/warehouse-assignment-actions.ts` (corregido para Next.js 15)

## Estado Final
- **100% Resuelto**: Se pueden crear, editar y eliminar bodegas sin errores de RLS.
- **100% Resuelto**: Error de importación de `redirect` corregido para Next.js 15.
- Documentación y SQL de corrección guardados para referencia futura.
- Sistema completamente operativo para gestión de bodegas. 