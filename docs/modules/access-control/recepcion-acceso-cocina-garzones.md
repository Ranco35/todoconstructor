## Acceso de Recepción a Paneles Operativos (Cocina y Garzones)

### Resumen
Se habilitó que usuarios con rol Recepción puedan:
- Ver las tarjetas “Panel Cocina” y “Panel Garzones” en el dashboard principal.
- Ingresar al módulo de Cocina (no se redirige más al dashboard).

Esto mejora la visibilidad operativa para Recepción sin otorgar privilegios de administración.

### Archivos modificados
- `src/actions/configuration/auth-actions.ts`
  - Agregado `isRecepcionUser()` que considera:
    - Rol: `RECEPCION` / `RECEPCIÓN`
    - Departamento: contiene la cadena "RECEPC"

- `src/app/dashboard/page.tsx`
  - Condición de renderizado de tarjetas: ahora muestra “Panel Cocina” y “Panel Garzones” si `isRecepcionUser()` es true.
  - Badge adicional “👁️ Recepción” cuando aplica.

- `src/app/dashboard/cocina/layout.tsx`
  - Guard de acceso actualizado para permitir acceso si el usuario es `Cocina`, `Administrador` o `Recepción`:

```12:16:src/app/dashboard/cocina/layout.tsx
  const isCocina = await isCocinaUser();
  const isAdmin = await isAdminUser();
  const isRecepcion = await isRecepcionUser();
  
  if (!isCocina && !isAdmin && !isRecepcion) {
    redirect('/dashboard');
  }
```

### Verificación rápida
1) Iniciar sesión con usuario de Recepción.
2) Ir a `/dashboard` y confirmar que se ven las tarjetas de “Cocina” y “Garzones” con badge “👁️ Recepción”.
3) Hacer clic en “Panel Cocina” y confirmar que ingresa al módulo (sin redirección).

### Notas
- Si aparece el warning de Supabase “Failed to parse cookie string… base64-…”, no bloquea el acceso. Es un aviso del adaptador de cookies del SDK y no afecta esta funcionalidad.

### Impacto
- Recepción obtiene visibilidad operativa inmediata sobre paneles críticos.
- No se alteran permisos de edición/administración existentes.

### Rollback
- Revertir el guard en `src/app/dashboard/cocina/layout.tsx` eliminando `isRecepcionUser()` de la condición.
- Revertir las condiciones en `src/app/dashboard/page.tsx` para ocultar las tarjetas a Recepción.







