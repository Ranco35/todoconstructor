# Migración y Correcciones para Next.js 15

## 📋 **Resumen**

**Problema:** Next.js 15 introdujo cambios breaking en la API de `params` y `cookies()` que requieren `await`.

**Impacto:** Errores de compilación y runtime en páginas que usan parámetros dinámicos y cookies.

## 🔧 **Cambios Requeridos en Next.js 15**

### **1. Parámetros de Ruta (`params`)**

**Antes (Next.js 14):**
```typescript
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  // ...
}
```

**Después (Next.js 15):**
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### **2. Cookies (`cookies()`)**

**Antes (Next.js 14):**
```typescript
import { cookies } from 'next/headers';

export default function Page() {
  const cookieStore = cookies();
  // ...
}
```

**Después (Next.js 15):**
```typescript
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  // ...
}
```

## 📁 **Archivos Corregidos**

### **Página de Edición de Usuarios**
```typescript
// src/app/dashboard/configuration/users/edit/[id]/page.tsx

// Antes
export default function EditUserPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const cookieStore = cookies();

// Después
export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
```

### **Configuración de Supabase SSR**
```typescript
// Configuración mejorada para cookies
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { 
    cookies: { 
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignorar errores de cookies en SSR
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Ignorar errores de cookies en SSR
        }
      },
    } 
  }
);
```

## 🚨 **Errores Comunes y Soluciones**

### **Error 1: "params is not iterable"**
```typescript
// ❌ Incorrecto
const { id } = params;

// ✅ Correcto
const { id } = await params;
```

### **Error 2: "cookies is not a function"**
```typescript
// ❌ Incorrecto
const cookieStore = cookies();

// ✅ Correcto
const cookieStore = await cookies();
```

### **Error 3: "Cannot read properties of undefined"**
```typescript
// ❌ Incorrecto
export default function Page({ params }) {
  const { id } = params; // params puede ser undefined

// ✅ Correcto
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

## 📝 **Checklist de Migración**

### **Para cada página con parámetros dinámicos:**

- [ ] Agregar `async` a la función del componente
- [ ] Agregar `await` antes de `params`
- [ ] Tipar `params` como `Promise<{...}>`
- [ ] Agregar `await` antes de `cookies()`
- [ ] Verificar que todas las funciones que usan estos valores sean `async`

### **Para componentes que usan cookies:**

- [ ] Agregar `async` a la función
- [ ] Agregar `await` antes de `cookies()`
- [ ] Manejar errores de cookies en SSR
- [ ] Verificar que el cliente de Supabase tenga métodos completos de cookies

## 🔍 **Verificación de Cambios**

### **Comandos de Verificación:**

```bash
# Verificar errores de TypeScript
npx tsc --noEmit

# Verificar errores de ESLint
npm run lint

# Verificar build
npm run build

# Limpiar caché si hay problemas
Remove-Item -Recurse -Force .next
```

### **Pruebas Recomendadas:**

1. **Páginas con parámetros dinámicos:**
   - `/dashboard/configuration/users/edit/[id]`
   - `/dashboard/suppliers/[id]`
   - `/dashboard/customers/[id]`

2. **Páginas que usan cookies:**
   - Cualquier página que use autenticación
   - Páginas que usen Supabase SSR

## 📚 **Referencias**

- [Next.js 15 Migration Guide](https://nextjs.org/docs/upgrading)
- [Next.js 15 Breaking Changes](https://nextjs.org/docs/upgrading#breaking-changes)
- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## ✅ **Estado de Migración**

- [x] **Página de edición de usuarios** - Corregida
- [x] **Configuración de Supabase SSR** - Corregida
- [ ] **Otras páginas con parámetros dinámicos** - Pendiente de revisión
- [ ] **Páginas que usan cookies** - Pendiente de revisión

---

**Fecha de Migración:** 24 de Junio, 2025  
**Versión de Next.js:** 15.3.3  
**Estado:** ✅ **EN PROGRESO** 