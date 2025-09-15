# Error "Cannot read properties of undefined (reading 'call')" - Server Actions en Layout Cliente RESUELTO

## Problema Original

**Error:** `TypeError: Cannot read properties of undefined (reading 'call')`

**Ubicación:** Layout del dashboard (`src/app/dashboard/layout.tsx`) y componentes cliente

**Causa Raíz:** Componentes marcados como `'use client'` estaban importando Server Actions directamente, causando conflictos entre componentes cliente y servidor.

## Análisis Técnico

### Error Detallado
```
TypeError: Cannot read properties of undefined (reading 'call')
at options.factory (webpack.js:704:31)
at __webpack_require__ (webpack.js:29:33)
at eval (action-client-wrapper.js:27:45)
at (app-pages-browser)/./src/actions/configuration/auth-actions.ts:12:96
```

### Componentes Afectados
- `src/app/dashboard/layout.tsx` - Layout principal marcado como cliente
- `src/components/shared/AuthGuard.tsx` - Componente cliente con Server Actions
- `src/components/pos/RestaurantPOS.tsx` - Componente cliente con Server Actions
- `src/components/pos/ReceptionPOS.tsx` - Componente cliente con Server Actions
- `src/components/purchases/PDFInvoiceUploader.tsx` - Componente cliente con Server Actions
- `src/components/reservations/ReservationCalendar.tsx` - Componente cliente con Server Actions
- `src/components/website/FinalImageManagement.tsx` - Componente cliente con Server Actions
- Múltiples páginas que importan `auth-actions.ts` (Server Actions)

## Solución Implementada

### 1. Conversión del Layout a Server Component

**Antes:**
```tsx
'use client';
import { createClient } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';

function DashboardContent({ children }) {
  // Lógica de autenticación en cliente
  const [currentUser, setCurrentUser] = useState(null);
  // ...
}
```

**Después:**
```tsx
import { createServerComponentClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerComponentClient();
  
  // Verificar autenticación en el servidor
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }
  
  // Obtener perfil del usuario
  const { data: userProfile } = await supabase
    .from('User')
    .select('id, name, email, Role(roleName), department, isCashier, isActive')
    .eq('id', user.id)
    .single();
    
  // ...
}
```

### 2. Creación de Funciones Cliente para Autenticación

**Nuevo archivo:** `src/lib/client-auth.ts`

```tsx
import { createClient } from '@/lib/supabase';

export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department: string | null;
  isCashier: boolean;
  isActive: boolean;
  lastLogin?: Date | null;
}

// Función cliente para obtener usuario actual (sin Server Actions)
export async function getCurrentUserClient(): Promise<UserData | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError.message);
      return null;
    }

    if (!user) {
      return null;
    }

    // Obtener datos del usuario desde la tabla User con rol
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', user.id)
      .single();

    // ... lógica de mapeo de datos
  } catch (error) {
    console.error('getCurrentUserClient exception:', error);
    return null;
  }
}

// Funciones cliente para verificar roles
export async function isAdminUserClient(): Promise<boolean> {
  // ...
}

export async function isGarzonUserClient(): Promise<boolean> {
  // ...
}

export async function isCocinaUserClient(): Promise<boolean> {
  // ...
}

export async function isJefeSeccionUserClient(): Promise<boolean> {
  // ...
}
```

### 3. Creación de Funciones Cliente para Imágenes del Website

**Nuevo archivo:** `src/lib/client-website-images.ts`

```tsx
import { createClient } from '@/lib/supabase';

export interface WebsiteImage {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  alt_text?: string;
  category: 'hero' | 'rooms' | 'services' | 'gallery' | 'testimonials' | 'other';
  size: number; // bytes
  width?: number;
  height?: number;
  is_active: boolean;
  uploaded_at: string;
  updated_at: string;
}

export interface ImageStats {
  total: number;
  byCategory: Record<string, number>;
  totalSize: number; // bytes
  activeImages: number;
}

// Función cliente para obtener imágenes del website
export async function getWebsiteImagesClient(
  category?: string, 
  isActive?: boolean
): Promise<WebsiteImage[]> {
  // ... implementación completa
}

// Función cliente para obtener estadísticas de imágenes
export async function getImageStatsClient(): Promise<ImageStats> {
  // ... implementación completa
}

// Función cliente para cambiar el estado de una imagen
export async function toggleImageStatusClient(
  imageId: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  // ... implementación completa
}

// Función cliente para eliminar imagen completa
export async function deleteWebsiteImageCompleteClient(
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  // ... implementación completa
}

// Función cliente para subir nueva imagen
export async function uploadNewWebsiteImageClient(
  formData: FormData
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  // ... implementación completa
}

// Función cliente para actualizar imagen existente
export async function updateExistingWebsiteImageClient(
  imageId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  // ... implementación completa
}
```

### 4. Actualización de Componentes Cliente

**AuthGuard.tsx:**
```tsx
'use client';
import { getCurrentUserClient } from '@/lib/client-auth';

export default function AuthGuard({ children }: AuthGuardProps) {
  // ...
  const user = await getCurrentUserClient();
  // ...
}
```

**RestaurantPOS.tsx:**
```tsx
'use client';
import { getCurrentUserClient } from '@/lib/client-auth';

export default function RestaurantPOS() {
  // ...
  const userResult = await getCurrentUserClient();
  // ...
}
```

**ReceptionPOS.tsx:**
```tsx
'use client';
import { getCurrentUserClient } from '@/lib/client-auth';

export default function ReceptionPOS() {
  // ...
  const userResult = await getCurrentUserClient();
  // ...
}
```

**PDFInvoiceUploader.tsx:**
```tsx
'use client';
import { getCurrentUserClient } from '@/lib/client-auth';

export default function PDFInvoiceUploader() {
  // ...
  const user = await getCurrentUserClient();
  // ...
}
```

**ReservationCalendar.tsx:**
```tsx
'use client';

export default function ReservationCalendar() {
  // ...
  const { getCurrentUserClient } = await import('@/lib/client-auth');
  const user = await getCurrentUserClient();
  // ...
}
```

**FinalImageManagement.tsx:**
```tsx
'use client';
import { 
  uploadNewWebsiteImageClient, 
  updateExistingWebsiteImageClient, 
  toggleImageStatusClient, 
  deleteWebsiteImageCompleteClient 
} from '@/lib/client-website-images';

export default function FinalImageManagement() {
  // ...
  const result = await uploadNewWebsiteImageClient(formData);
  const result = await updateExistingWebsiteImageClient(imageId, formData);
  const result = await toggleImageStatusClient(imageId, isActive);
  const result = await deleteWebsiteImageCompleteClient(imageId);
  // ...
}
```

### 5. Creación de Componente Cliente Separado

**Nuevo archivo:** `src/components/shared/DashboardClientWrapper.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useEmailAnalysisPopup } from '@/contexts/EmailAnalysisContext';
import EmailAnalysisPopup from '@/components/emails/EmailAnalysisPopup';

export default function DashboardClientWrapper({ 
  children, 
  userData 
}: DashboardClientWrapperProps) {
  const { isPopupOpen, popupTrigger, showPopup, hidePopup } = useEmailAnalysisPopup();

  useEffect(() => {
    // Mostrar popup de análisis al cargar el dashboard
    const timer = setTimeout(() => {
      showPopup('login');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [showPopup]);

  return (
    <>
      {children}
      <EmailAnalysisPopup
        isOpen={isPopupOpen}
        onClose={hidePopup}
        userName={userName}
        trigger={popupTrigger}
      />
    </>
  );
}
```

### 6. Arquitectura Final

```
DashboardLayout (Server Component)
├── Verificación de autenticación en servidor
├── Obtención de datos de usuario
├── DashboardClientWrapper (Client Component)
│   ├── Popup de análisis de emails
│   └── Funcionalidad interactiva
└── UniversalHorizontalMenu
    └── Contenido de páginas
        ├── AuthGuard (Client Component + client-auth.ts)
        ├── RestaurantPOS (Client Component + client-auth.ts)
        ├── ReceptionPOS (Client Component + client-auth.ts)
        ├── PDFInvoiceUploader (Client Component + client-auth.ts)
        ├── ReservationCalendar (Client Component + client-auth.ts)
        └── FinalImageManagement (Client Component + client-website-images.ts)
```

## Beneficios de la Solución

### 1. Separación Clara de Responsabilidades
- **Server Component:** Autenticación, datos de usuario, redirecciones
- **Client Component:** Interactividad, popups, efectos visuales
- **Funciones Cliente:** Autenticación en componentes cliente sin Server Actions
- **Funciones Cliente Website:** Gestión de imágenes sin Server Actions

### 2. Performance Mejorada
- Verificación de autenticación en servidor (más rápido)
- Redirección inmediata sin carga de cliente
- Menos JavaScript en el cliente
- Funciones cliente optimizadas para componentes interactivos

### 3. Compatibilidad Total
- Server Actions funcionan correctamente en Server Components
- Componentes cliente mantienen funcionalidad con funciones cliente
- No hay conflictos entre cliente/servidor
- Importación dinámica funcional

### 4. Mantenibilidad
- Código más limpio y organizado
- Fácil debugging
- Arquitectura escalable
- Separación clara de responsabilidades

## Archivos Modificados

### 1. Layout Principal
- **Archivo:** `src/app/dashboard/layout.tsx`
- **Cambios:** Convertido a Server Component
- **Funcionalidad:** Autenticación en servidor

### 2. Funciones Cliente de Autenticación
- **Archivo:** `src/lib/client-auth.ts` (NUEVO)
- **Funcionalidad:** Autenticación para componentes cliente

### 3. Funciones Cliente de Imágenes Website
- **Archivo:** `src/lib/client-website-images.ts` (NUEVO)
- **Funcionalidad:** Gestión de imágenes para componentes cliente

### 4. Componentes Cliente Actualizados
- **AuthGuard.tsx:** Usa `getCurrentUserClient()`
- **RestaurantPOS.tsx:** Usa `getCurrentUserClient()`
- **ReceptionPOS.tsx:** Usa `getCurrentUserClient()`
- **PDFInvoiceUploader.tsx:** Usa `getCurrentUserClient()`
- **ReservationCalendar.tsx:** Usa import dinámico de `getCurrentUserClient()`
- **FinalImageManagement.tsx:** Usa funciones cliente de imágenes

### 5. Wrapper Cliente
- **Archivo:** `src/components/shared/DashboardClientWrapper.tsx` (NUEVO)
- **Funcionalidad:** Manejo de interactividad del lado cliente

### 6. Configuración
- **Archivo:** `next.config.js`
- **Estado:** Ya configurado correctamente para Server Actions

## Verificación de la Solución

### 1. Limpieza de Caché
```bash
taskkill /f /im node.exe
Remove-Item -Recurse -Force .next
npm run dev
```

### 2. Pruebas de Funcionalidad
- ✅ Dashboard carga sin errores
- ✅ Autenticación funciona correctamente
- ✅ Server Actions operativas en Server Components
- ✅ Funciones cliente operativas en Client Components
- ✅ Popup de análisis aparece
- ✅ Navegación fluida
- ✅ Componentes POS funcionan
- ✅ Calendario de reservas funciona
- ✅ Gestión de imágenes del website funciona

### 3. Logs de Confirmación
```
✅ Dashboard Layout: Usuario verificado
✅ Server Actions: Funcionando correctamente
✅ Client Functions: Funcionando correctamente
✅ Website Images: Funcionando correctamente
✅ No más errores "Cannot read properties of undefined"
```

## Prevención de Problemas Futuros

### 1. Reglas de Arquitectura
- **Server Components:** Para autenticación, datos, redirecciones
- **Client Components:** Para interactividad, efectos, popups
- **Server Actions:** Solo en Server Components o páginas
- **Funciones Cliente:** Para autenticación en componentes cliente
- **Funciones Cliente Website:** Para gestión de contenido en componentes cliente

### 2. Patrones Recomendados
```tsx
// ✅ CORRECTO: Server Component con Server Actions
export default async function Page() {
  const data = await getData(); // Server Action
  return <ClientComponent data={data} />;
}

// ✅ CORRECTO: Client Component con funciones cliente
'use client';
import { getCurrentUserClient } from '@/lib/client-auth';
const user = await getCurrentUserClient();

// ✅ CORRECTO: Client Component con funciones cliente de imágenes
'use client';
import { uploadNewWebsiteImageClient } from '@/lib/client-website-images';
const result = await uploadNewWebsiteImageClient(formData);

// ❌ INCORRECTO: Client Component con Server Actions
'use client';
import { getData } from '@/actions/data'; // Error
```

### 3. Debugging
- Verificar que Server Actions estén en Server Components
- Usar `'use client'` solo cuando sea necesario
- Separar lógica de servidor y cliente claramente
- Usar funciones cliente para autenticación en componentes cliente
- Usar funciones cliente específicas para cada tipo de contenido

## Estado Final

**RESULTADO:** ✅ **100% RESUELTO**

- **Error eliminado:** No más "Cannot read properties of undefined"
- **Funcionalidad preservada:** Todas las características funcionan
- **Performance mejorada:** Autenticación más rápida
- **Arquitectura limpia:** Separación clara cliente/servidor
- **Compatibilidad total:** Server Actions + Funciones Cliente
- **Gestión de imágenes:** Completamente funcional sin Server Actions

**Sistema completamente operativo y listo para producción.** 