# Restricción de Acceso al Módulo de Usuarios, Garzones y Cocina

## Resumen

Se ha implementado un sistema completo de restricción de acceso que:

1. **Módulo de Usuarios**: Solo accesible para usuarios con rol de **Administrador** o **Super Usuario**
2. **Módulo de Garzones**: Accesible para usuarios con rol de **Garzones** Y **Administradores/Super Usuarios**
3. **Módulo de Cocina**: Accesible para usuarios con rol de **Cocina** Y **Administradores/Super Usuarios**
4. **Dashboard Principal**: Muestra módulos condicionalmente según el rol del usuario

## Implementación

### 1. Funciones de Verificación de Roles

**Archivo:** `src/actions/configuration/auth-actions.ts`

Se agregaron cuatro funciones de verificación:

```typescript
// Verificar si el usuario actual es administrador
export async function isAdminUser(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }
    
    // Verificar si el usuario tiene rol de administrador
    return currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'SUPER_USER';
  } catch (error) {
    console.error('Error verificando rol de administrador:', error);
    return false;
  }
}

// Verificar si el usuario es garzón
export async function isGarzonUser(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }
    
    // Verificar si el usuario tiene rol de garzón
    return currentUser.role === 'GARZONES';
  } catch (error) {
    console.error('Error verificando rol de garzón:', error);
    return false;
  }
}

// Verificar si el usuario es de cocina
export async function isCocinaUser(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }
    
    // Verificar si el usuario tiene rol de cocina
    return currentUser.role === 'COCINA';
  } catch (error) {
    console.error('Error verificando rol de cocina:', error);
    return false;
  }
}

// Verificar si el usuario tiene un rol específico
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }
    
    return currentUser.role === requiredRole;
  } catch (error) {
    console.error('Error verificando rol específico:', error);
    return false;
  }
}
```

### 2. Layouts de Protección

#### Layout de Usuarios
**Archivo:** `src/app/dashboard/configuration/users/layout.tsx`

```typescript
import { isAdminUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario es administrador
  const isAdmin = await isAdminUser();
  
  if (!isAdmin) {
    // Redirigir a dashboard si no es administrador
    redirect('/dashboard');
  }

  return (
    <div>
      {children}
    </div>
  );
}
```

#### Layout de Garzones
**Archivo:** `src/app/dashboard/garzones/layout.tsx`

```typescript
import { isGarzonUser, isAdminUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';

export default async function GarzonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario es garzón O administrador
  const isGarzon = await isGarzonUser();
  const isAdmin = await isAdminUser();
  
  if (!isGarzon && !isAdmin) {
    // Redirigir a dashboard si no es garzón ni administrador
    redirect('/dashboard');
  }

  return (
    <div>
      {children}
    </div>
  );
}
```

#### Layout de Cocina
**Archivo:** `src/app/dashboard/cocina/layout.tsx`

```typescript
import { isCocinaUser, isAdminUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';

export default async function CocinaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario es de cocina O administrador
  const isCocina = await isCocinaUser();
  const isAdmin = await isAdminUser();
  
  if (!isCocina && !isAdmin) {
    // Redirigir a dashboard si no es de cocina ni administrador
    redirect('/dashboard');
  }

  return (
    <div>
      {children}
    </div>
  );
}
```

### 3. Dashboard Principal con Acceso Condicional

**Archivo:** `src/app/dashboard/page.tsx`

- **Administradores**: Ven todos los módulos del sistema + módulos especializados
- **Garzones**: Solo ven su módulo especializado
- **Cocina**: Solo ven su módulo especializado
- **Otros roles**: Ven módulos según sus permisos

### 4. Páginas Protegidas

#### Módulo de Usuarios
- Página principal: `/dashboard/configuration/users`
- Crear usuario: `/dashboard/configuration/users/create`
- Editar usuario: `/dashboard/configuration/users/edit/[id]`

#### Módulo de Garzones
- Panel principal: `/dashboard/garzones`

#### Módulo de Cocina
- Panel principal: `/dashboard/cocina`

## Roles y Accesos

### Administradores (ADMINISTRADOR, SUPER_USER)
- ✅ Acceso completo a todos los módulos
- ✅ Gestión de usuarios
- ✅ **Panel de garzones** (para supervisión)
- ✅ **Panel de cocina** (para supervisión)
- ✅ Todos los módulos del sistema

### Garzones (GARZONES)
- ✅ Solo acceso a su panel especializado
- ❌ Sin acceso a otros módulos
- ❌ Sin acceso a gestión de usuarios
- ❌ Sin acceso a configuración del sistema

### Cocina (COCINA)
- ✅ Solo acceso a su panel especializado
- ❌ Sin acceso a otros módulos
- ❌ Sin acceso a gestión de usuarios
- ❌ Sin acceso a configuración del sistema

### Otros Roles
- ❌ Sin acceso al módulo de usuarios
- ❌ Sin acceso al panel de garzones
- ❌ Sin acceso al panel de cocina
- ❌ Acceso limitado según permisos específicos

## Comportamiento del Sistema

### 1. Acceso Directo a URLs

#### Para Garzones
Si un usuario no garzón intenta acceder a `/dashboard/garzones`:
**Resultado:** Redirección automática a `/dashboard`

#### Para Cocina
Si un usuario no de cocina intenta acceder a `/dashboard/cocina`:
**Resultado:** Redirección automática a `/dashboard`

#### Para Administradores
Si un usuario no administrador intenta acceder a módulos protegidos:
**Resultado:** Redirección automática a `/dashboard`

### 2. Navegación desde Dashboard

#### Garzones
- ✅ Ven solo su panel especializado
- ✅ Badge "🔒 Solo Garzones" en su módulo
- ✅ Mensaje informativo sobre acceso restringido
- ❌ No ven otros módulos del sistema

#### Cocina
- ✅ Ven solo su panel especializado
- ✅ Badge "🔒 Solo Cocina" en su módulo
- ✅ Mensaje informativo sobre acceso restringido
- ❌ No ven otros módulos del sistema

#### Administradores
- ✅ Ven todos los módulos del sistema
- ✅ **Ven el módulo de garzones** con badge "👁️ Administradores"
- ✅ **Ven el módulo de cocina** con badge "👁️ Administradores"
- ✅ Badges de restricción en módulos protegidos
- ✅ Acceso completo a todas las funcionalidades

### 3. Indicadores Visuales
- Badge naranja "🔒 Solo Garzones" en panel de garzones (para garzones)
- Badge naranja "👁️ Administradores" en panel de garzones (para administradores)
- Badge rojo "🔒 Solo Cocina" en panel de cocina (para cocina)
- Badge rojo "👁️ Administradores" en panel de cocina (para administradores)
- Badge rojo "🔒 Solo Administradores" en módulo de usuarios
- Mensajes claros sobre restricciones de acceso

## Seguridad

### Múltiples Capas de Protección
1. **Layout Level**: Protección en `layout.tsx` para todas las rutas
2. **Page Level**: Verificación individual en cada página
3. **Dashboard Level**: Ocultación condicional en el dashboard principal

### Manejo de Errores
- Verificación robusta de roles
- Logging de errores para debugging
- Redirección segura en caso de fallo

## Archivos Modificados

1. `src/actions/configuration/auth-actions.ts` - Nuevas funciones de verificación
2. `src/app/dashboard/configuration/users/layout.tsx` - Layout de protección usuarios
3. `src/app/dashboard/garzones/layout.tsx` - Layout de protección garzones
4. `src/app/dashboard/cocina/layout.tsx` - Layout de protección cocina
5. `src/app/dashboard/configuration/users/page.tsx` - Página principal protegida
6. `src/app/dashboard/configuration/users/create/page.tsx` - Página crear protegida
7. `src/app/dashboard/configuration/users/edit/[id]/page.tsx` - Página editar protegida
8. `src/app/dashboard/page.tsx` - Dashboard con verificación condicional

## Beneficios

### Seguridad
- ✅ Acceso restringido por roles específicos
- ✅ Múltiples capas de protección
- ✅ Redirección automática para usuarios no autorizados

### UX
- ✅ Indicadores visuales claros
- ✅ Navegación intuitiva por rol
- ✅ Mensajes informativos sobre restricciones

### Mantenibilidad
- ✅ Código reutilizable
- ✅ Funciones centralizadas
- ✅ Fácil extensión para otros roles

## Casos de Uso

### Escenario 1: Usuario Garzón
1. Inicia sesión como garzón
2. Ve solo su panel especializado en el dashboard
3. Puede acceder únicamente a su módulo
4. Ve mensaje informativo sobre acceso restringido
5. Si intenta acceder a otros módulos, es redirigido

### Escenario 2: Usuario Cocina
1. Inicia sesión como personal de cocina
2. Ve solo su panel especializado en el dashboard
3. Puede acceder únicamente a su módulo
4. Ve mensaje informativo sobre acceso restringido
5. Si intenta acceder a otros módulos, es redirigido

### Escenario 3: Usuario Administrador
1. Inicia sesión como administrador
2. Ve todos los módulos del sistema
3. **Ve el módulo de garzones** con badge "👁️ Administradores"
4. **Ve el módulo de cocina** con badge "👁️ Administradores"
5. Puede acceder a todas las funciones
6. Ve badges de restricción en módulos protegidos

### Escenario 4: Usuario No Autorizado
1. Inicia sesión con rol sin permisos especiales
2. NO ve módulos protegidos en el dashboard
3. Si intenta acceder directamente a URLs protegidas, es redirigido
4. Solo ve módulos según sus permisos básicos

## Próximos Pasos

### Extensión a Otros Roles
Este patrón puede aplicarse a otros roles específicos:
- **RECEPCION**: Panel especializado para recepción
- **MANTENIMIENTO**: Panel especializado para mantenimiento
- **LIMPIEZA**: Panel especializado para limpieza

### Mejoras Futuras
- Logging de intentos de acceso no autorizado
- Notificaciones al administrador sobre intentos de acceso
- Auditoría de cambios por rol
- Roles más granulares con permisos específicos

## Estado Actual

✅ **COMPLETADO**: Sistema de restricción de acceso implementado
✅ **FUNCIONAL**: Todas las rutas protegidas por rol
✅ **PROBADO**: Verificación de roles operativa
✅ **DOCUMENTADO**: Guía completa de implementación

El sistema ahora maneja correctamente el acceso diferenciado por roles, con garzones y cocina limitados a sus módulos especializados, y administradores con acceso completo al sistema incluyendo supervisión de todos los módulos especializados. 