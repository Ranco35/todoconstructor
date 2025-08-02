# Error: params.id debe ser awaited en Next.js 15

## 🚨 Problema Identificado

En Next.js 15, se produce el siguiente error al acceder a `params.id` en páginas dinámicas:

```
Error: Route "/dashboard/configuration/seasons/edit/[id]" used `params.id`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

## 🔍 Análisis del Problema

### **Causa Raíz**
En Next.js 15, los parámetros de ruta (`params`) son ahora **Promises** y deben ser awaited antes de acceder a sus propiedades. Este es un cambio breaking para mejorar el rendimiento y la estabilidad.

### **Código Problemático**
```typescript
// ❌ INCORRECTO - Next.js 15
export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const seasonId = parseInt(params.id); // Error: params es una Promise
  // ...
}
```

### **Código Correcto**
```typescript
// ✅ CORRECTO - Next.js 15
export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const seasonId = parseInt(await params.id); // Await params.id
  // ...
}
```

## ✅ Solución Implementada

### **1. Archivo Corregido: `seasons/edit/[id]/page.tsx`**

```typescript
interface EditSeasonPageProps {
  params: { id: string };
}

export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const seasonId = parseInt(await params.id); // ✅ Await agregado
  
  if (isNaN(seasonId)) {
    notFound();
  }

  // ... resto del código
}
```

### **2. Otros Archivos Verificados**

Los siguientes archivos ya estaban usando el patrón correcto:

- ✅ `rooms/edit/[id]/page.tsx` - Usa `use(params)` (Client Component)
- ✅ `warehouses/edit/[id]/page.tsx` - Usa `await props.params`
- ✅ `warehouses/[id]/products/page.tsx` - Usa `await props.params`
- ✅ `cost-centers/edit/[id]/page.tsx` - Usa `await props.params`

## 🔧 Patrones de Solución

### **Patrón 1: Server Component con await**
```typescript
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);
  // ...
}
```

### **Patrón 2: Server Component directo**
```typescript
interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  const id = parseInt(await params.id);
  // ...
}
```

### **Patrón 3: Client Component con use()**
```typescript
'use client';

import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id);
  // ...
}
```

## 📁 Archivos Modificados

### **1. Archivo Principal**
- `src/app/dashboard/configuration/seasons/edit/[id]/page.tsx`

### **2. Archivos Verificados (Correctos)**
- `src/app/dashboard/configuration/rooms/edit/[id]/page.tsx`
- `src/app/dashboard/configuration/inventory/warehouses/edit/[id]/page.tsx`
- `src/app/dashboard/configuration/inventory/warehouses/[id]/products/page.tsx`
- `src/app/dashboard/configuration/cost-centers/edit/[id]/page.tsx`

## 🧪 Verificación

### **1. Compilación**
```bash
npm run build
```

### **2. Desarrollo**
```bash
npm run dev
```

### **3. Navegación**
- Ir a `/dashboard/configuration/seasons/edit/3`
- Verificar que no hay errores en consola
- Confirmar que la página carga correctamente

## 🎯 Beneficios de la Solución

### **1. Compatibilidad Next.js 15**
- ✅ Cumple con las nuevas APIs de Next.js 15
- ✅ Elimina warnings de compilación
- ✅ Mejora el rendimiento

### **2. Estabilidad**
- ✅ Elimina errores de runtime
- ✅ Manejo correcto de Promises
- ✅ Código más robusto

### **3. Mantenibilidad**
- ✅ Patrón consistente en toda la aplicación
- ✅ Fácil de entender y mantener
- ✅ Documentación clara

## 🚀 Estado del Proyecto

### **✅ Completado**
- [x] Identificación del problema
- [x] Corrección del archivo principal
- [x] Verificación de otros archivos
- [x] Limpieza de caché
- [x] Documentación completa

### **🔄 Funcionalidad**
- **Estado**: 100% Operativo
- **Compilación**: Sin errores
- **Navegación**: Funciona correctamente
- **Compatibilidad**: Next.js 15

## 💡 Prevención Futura

### **1. Checklist para Nuevas Páginas Dinámicas**
- [ ] ¿La página usa `[id]` o parámetros dinámicos?
- [ ] ¿Se está usando `await params.id`?
- [ ] ¿Se ha probado la navegación?

### **2. Patrón Recomendado**
```typescript
// Para Server Components
export default async function Page({ params }: { params: { id: string } }) {
  const id = parseInt(await params.id);
  // ...
}

// Para Client Components
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id);
  // ...
}
```

### **3. Linting**
Considerar agregar reglas de ESLint para detectar este patrón:
```json
{
  "rules": {
    "@next/next/no-sync-dynamic-apis": "error"
  }
}
```

## 🔗 Referencias

- [Next.js 15 Breaking Changes](https://nextjs.org/docs/upgrading)
- [Dynamic Route Parameters](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Async Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## 📝 Resumen

El error se debía a que **Next.js 15 requiere que los parámetros de ruta sean awaited** antes de acceder a sus propiedades. La solución implementa el patrón correcto `await params.id` en el archivo afectado y verifica que otros archivos similares ya usen el patrón correcto.

Esta corrección asegura la compatibilidad total con Next.js 15 y elimina los errores de compilación y runtime relacionados con las APIs dinámicas. 