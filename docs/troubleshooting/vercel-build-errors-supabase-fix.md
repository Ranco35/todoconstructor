# Corrección de Errores de Build de Vercel - Supabase

## Problema Original

El build de Vercel fallaba con los siguientes errores:

### Error 1: next/headers en Client Components
```
./src/lib/supabase.ts
Error: You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.

Import trace for requested module:
./src/lib/supabase.ts
./src/lib/supabase-utils.ts
./src/components/shared/SupabaseTest.tsx
```

### Error 2: Importación Faltante
```
Attempted import error: 'removeProductFromWarehouse' is not exported from './warehouse-actions'
```

### Error 3: Cookies fuera del contexto de request
```
Error: `cookies` was called outside a request scope.
```

## Solución Implementada

### 1. Separación de Clientes Supabase

**Antes:** Todo mezclado en `src/lib/supabase.ts`
```typescript
// ❌ Problemático - next/headers se importaba para uso en client components
import { cookies } from 'next/headers'
```

**Después:** Separación clara entre client y server

**`src/lib/supabase.ts` (Solo para Client Components):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para el navegador (browser/client components)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
```

**`src/lib/supabase-server.ts` (Solo para Server Components/Actions):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Funciones para server components, route handlers y server actions
export async function createServerComponentClient() { ... }
export function createRouteHandlerClient() { ... }
export function createServerActionClient() { ... }
```

### 2. Proxy para supabaseServer

**Problema:** `cookies()` se ejecutaba durante el build (fuera del contexto de request)

**Solución:** Implementación de Proxy lazy-loading
```typescript
// Cliente por defecto para server actions
// Proxy que inicializa el cliente solo cuando se accede por primera vez
let _client: ReturnType<typeof createServerActionClient> | null = null;

export const supabaseServer = new Proxy({} as ReturnType<typeof createServerActionClient>, {
  get(target, prop) {
    if (!_client) {
      _client = createServerActionClient();
    }
    return (_client as any)[prop];
  }
});
```

### 3. Corrección de Server Actions

**Archivo:** `src/actions/configuration/petty-cash-import-export.ts`

**Cambio:** Agregar directiva `'use server'` al inicio
```typescript
'use server';

import { supabaseServer } from '@/lib/supabase-server';
// ... resto de imports
```

### 4. Función Faltante Agregada

**Archivo:** `src/actions/configuration/warehouse-actions.ts`

**Agregado:**
```typescript
// --- ELIMINAR PRODUCTO DE BODEGA (FUNCIÓN CORE) ---
export async function removeProductFromWarehouse(productId: number, warehouseId: number) {
  try {
    const supabase = await supabaseServer;
    
    const { error } = await supabase
      .from('Warehouse_Product')
      .delete()
      .eq('productid', productId)
      .eq('warehouseid', warehouseId);

    if (error) {
      throw new Error(`Error removiendo producto: ${error.message}`);
    }

    return { success: true, message: 'Producto removido de la bodega exitosamente.' };
  } catch (error: any) {
    console.error('Error al remover producto de bodega:', error);
    throw new Error('Error al remover el producto de la bodega.');
  }
}
```

### 5. Actualización de supabase-utils.ts

**Antes:**
```typescript
import { supabase } from './supabase' // ❌ No existía esta exportación
```

**Después:**
```typescript
import { createClient } from './supabase'
import type { Database } from './supabase'

// Cliente para uso en browser/client components
const supabase = createClient()
```

## Archivos Modificados

1. `src/lib/supabase.ts` - Limpiado para solo client components
2. `src/lib/supabase-server.ts` - Nuevo archivo para server functions
3. `src/lib/supabase-utils.ts` - Corregida importación
4. `src/actions/configuration/petty-cash-import-export.ts` - Agregado 'use server'
5. `src/actions/configuration/warehouse-assignment-actions.ts` - Corregida importación
6. `src/actions/configuration/warehouse-actions.ts` - Agregada función faltante

## Resultado

✅ **Build exitoso en Vercel**
- Sin errores de `next/headers` en client components
- Sin errores de importaciones faltantes
- Sin errores de `cookies()` fuera de contexto
- Separación clara entre cliente y servidor

## Patrón de Uso

### Para Client Components:
```typescript
import { createClient } from '@/lib/supabase'

const supabase = createClient()
```

### Para Server Components/Actions:
```typescript
import { supabaseServer } from '@/lib/supabase-server'

// Usar directamente supabaseServer
const { data, error } = await supabaseServer.from('table').select('*')
```

### Para Route Handlers:
```typescript
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient(request, NextResponse.next())
  // ...
}
```

## Notas Importantes

1. **Nunca importar `supabase-server.ts` en client components**
2. **Siempre usar `'use server'` en archivos que usan `supabaseServer`**
3. **El Proxy lazy-loading evita la ejecución de `cookies()` durante el build**
4. **La separación de archivos mantiene el build bundle optimizado**

---
**Fecha:** 28 de Junio, 2025  
**Estado:** ✅ Resuelto  
**Commit:** `beed46a` 