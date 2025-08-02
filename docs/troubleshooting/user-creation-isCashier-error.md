# Solución: Error de Creación de Usuario por Columna Faltante

Este documento detalla la resolución del error `Could not find the 'isCashier' column of 'User' in the schema cache` que ocurría durante la creación de usuarios.

## Resumen del Problema

- **Error principal:** Al crear un usuario, el sistema fallaba porque no encontraba la columna `isCashier` en la tabla `User` de la base de datos de Supabase.
- **Error secundario:** Se encontraron errores de `cookies()` en las server actions de autenticación, debido a cambios en Next.js 15 que requieren el uso de `await`.

## Causa Raíz

1.  **Desincronización del Esquema:** El esquema de Prisma (`schema.prisma`) definía la columna `isCashier`, pero esta no se había añadido a la tabla `User` en la base de datos de Supabase a través de una migración.
2.  **Uso de API Obsoleta:** Las funciones en `src/actions/configuration/auth-actions.ts` no utilizaban `await` al invocar `cookies()`, lo cual es un requerimiento en versiones recientes de Next.js para server actions.

## Solución Implementada

La solución se implementó en dos partes:

### 1. Actualización de la Base de Datos

Se creó y aplicó una migración SQL para alinear el esquema de la base de datos con el de la aplicación:

- **Archivo de migración:** `supabase/migrations/20250627000001_add_isCashier_to_user.sql`
- **Contenido del SQL:**
  ```sql
  -- Agregar columna isCashier a la tabla User
  ALTER TABLE "public"."User" 
  ADD COLUMN "isCashier" BOOLEAN DEFAULT false;

  -- Comentario para documentar el cambio
  COMMENT ON COLUMN "public"."User"."isCashier" IS 'Indica si el usuario es cajero y puede manejar sesiones de caja';
  ```
- **Aplicación:** El script se ejecutó manualmente en el "SQL Editor" del dashboard de Supabase para efectuar el cambio inmediatamente.

### 2. Corrección del Código de Autenticación

Se modificó el archivo `src/actions/configuration/auth-actions.ts` para usar `await` con `cookies()`:

- **Funciones afectadas:** `login`, `logout`, y `getCurrentUser`.
- **Cambio:** Se reemplazó `const cookieStore = cookies();` por `const cookieStore = await cookies();` al inicio de cada función.

## Verificación

El usuario confirmó que tras la aplicación de la migración en la base de datos, la funcionalidad de creación de usuarios fue restaurada y opera correctamente.

## Estado Final

- ✅ **Problema resuelto.**
- ✅ **Base de datos actualizada.**
- ✅ **Código de autenticación corregido.**
- ✅ **Funcionalidad verificada por el usuario.**

## Notas adicionales

- El problema también incluía errores con `cookies()` en Next.js 15 que ya fueron corregidos
- La columna `isCashier` es necesaria para el sistema de caja menor
- Por defecto, todos los usuarios tendrán `isCashier = false`
- Solo los usuarios marcados como cajeros podrán manejar sesiones de caja

## Archivos modificados

- `src/actions/configuration/auth-actions.ts`: Corregido el problema con `cookies()` que debe ser awaited
- `supabase/migrations/20250627000001_add_isCashier_to_user.sql`: Nueva migración creada
- `scripts/add-isCashier-column.sql`: Script SQL para ejecución manual
- `scripts/apply-migration-simple.js`: Script de verificación

## Estado
- ✅ Problema identificado
- ✅ Código corregido
- ⏳ Pendiente: Ejecutar SQL en Supabase Dashboard
- ⏳ Pendiente: Verificar funcionamiento 