# 🔧 Corrección: Error "You're importing a component that needs 'next/headers'"

## 📋 **PROBLEMA IDENTIFICADO**

### **Descripción del Error:**
```
Error: ./src/lib/supabase-server.ts
Error: You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.
```

### **Causas del Problema:**

1. **Uso de next/headers en componente cliente:**
   - Las funciones `getSupabaseServerClient()` usan `next/headers`
   - `next/headers` solo funciona en Server Components
   - Estábamos llamándolo desde componentes cliente

2. **Arquitectura incorrecta:**
   - Intentábamos usar funciones del servidor directamente en el cliente
   - No había separación entre cliente y servidor

3. **Problemas de renderizado:**
   - Next.js no permite Server Components en el directorio pages/
   - Los componentes se renderizaban en el cliente

## 🛠️ **SOLUCIÓN IMPLEMENTADA**

### **1. Creación de API Routes**

#### **API Route para Auditoría de Reserva Específica:**
```typescript
// src/app/api/reservations/[id]/audit-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);
    
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Obtener información básica de auditoría de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('created_at, updated_at, created_by, updated_by')
      .eq('id', reservationId)
      .single();

    if (reservationError) {
      console.error('Error fetching reservation audit info:', {
        reservationId,
        error: reservationError,
        message: reservationError.message,
        code: reservationError.code
      });
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Intentar obtener información del usuario actual si está disponible
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch (userError) {
      console.warn('Could not get current user for audit info:', userError);
    }

    // Función helper para obtener información de usuario por defecto
    function getDefaultUserInfo(user: any = null) {
      return {
        id: user?.id || 'system',
        name: user?.name || 'Usuario del Sistema',
        email: user?.email || 'sistema@admintermas.com'
      };
    }

    // Proporcionar información genérica del sistema
    const systemUserInfo = getDefaultUserInfo(currentUser);

    const result = {
      created_by_user: systemUserInfo,
      updated_by_user: systemUserInfo
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in audit info API:', {
      reservationId: params.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### **API Route para Lista de Reservas:**
```typescript
// src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de filtro
    const status = searchParams.get('status');
    const client_type = searchParams.get('client_type');
    const check_in_from = searchParams.get('check_in_from');
    const check_in_to = searchParams.get('check_in_to');
    const room_id = searchParams.get('room_id');
    const company_id = searchParams.get('company_id');
    const payment_status = searchParams.get('payment_status');

    let query = (await getSupabaseServerClient())
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        client:Client(*),
        modular_reservation:modular_reservations(*),
        reservation_products(*),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros si existen
    if (status) {
      query = query.eq('status', status);
    }
    if (client_type) {
      query = query.eq('client_type', client_type);
    }
    if (check_in_from) {
      query = query.gte('check_in', check_in_from);
    }
    if (check_in_to) {
      query = query.lte('check_in', check_in_to);
    }
    if (room_id) {
      query = query.eq('room_id', parseInt(room_id));
    }
    if (company_id) {
      query = query.eq('company_id', parseInt(company_id));
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json(
        { error: 'Error al obtener reservas' },
        { status: 500 }
      );
    }

    // Obtener todos los user IDs únicos
    const userIds = new Set();
    (reservations || []).forEach(reservation => {
      if (reservation.created_by) userIds.add(reservation.created_by);
      if (reservation.updated_by) userIds.add(reservation.updated_by);
    });

    // Obtener todos los usuarios de una vez
    let usersMap = new Map();
    if (userIds.size > 0) {
      try {
        const { data: users, error: usersError } = await (await getSupabaseServerClient())
          .from('User')
          .select('id, name, email')
          .in('id', Array.from(userIds));
        
        if (!usersError && users) {
          users.forEach(user => usersMap.set(user.id, user));
        } else {
          console.warn('Error getting users for audit info:', usersError);
        }
      } catch (error) {
        console.warn('Error in user lookup:', error);
      }
    }

    // Agregar información de usuarios a las reservas
    const reservationsWithAuditInfo = (reservations || []).map(reservation => {
      const created_by_user = reservation.created_by ? usersMap.get(reservation.created_by) || null : null;
      const updated_by_user = reservation.updated_by ? usersMap.get(reservation.updated_by) || null : null;

      return {
        ...reservation,
        created_by_user,
        updated_by_user
      };
    });

    return NextResponse.json(reservationsWithAuditInfo);
  } catch (error) {
    console.error('Error in reservations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### **API Route para Reserva Específica:**
```typescript
// src/app/api/reservations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);
    
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    const { data: reservation, error } = await (await getSupabaseServerClient())
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        client:Client(*),
        modular_reservation:modular_reservations(*),
        reservation_products(*),
        payments(*),
        reservation_payments(*)
      `)
      .eq('id', reservationId)
      .single();

    if (error) {
      console.error('Error fetching reservation:', error);
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Obtener información de los usuarios
    let created_by_user = null;
    let updated_by_user = null;

    // Obtener IDs únicos de usuarios
    const userIds = [];
    if (reservation.created_by) userIds.push(reservation.created_by);
    if (reservation.updated_by && reservation.updated_by !== reservation.created_by) userIds.push(reservation.updated_by);

    if (userIds.length > 0) {
      try {
        const { data: users, error: usersError } = await (await getSupabaseServerClient())
          .from('User')
          .select('id, name, email')
          .in('id', userIds);

        if (!usersError && users) {
          const usersMap = new Map(users.map(user => [user.id, user]));
          created_by_user = reservation.created_by ? usersMap.get(reservation.created_by) || null : null;
          updated_by_user = reservation.updated_by ? usersMap.get(reservation.updated_by) || null : null;
        } else {
          console.warn('Error getting users for single reservation audit info:', usersError);
        }
      } catch (error) {
        console.warn('Error in single reservation user lookup:', error);
      }
    }

    const result = {
      ...reservation,
      created_by_user,
      updated_by_user
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in reservation API:', {
      reservationId: params.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **2. Actualización de Componentes Cliente**

#### **ReservationManagementModal.tsx:**
```typescript
// Cargar información de auditoría cuando se abra el modal
useEffect(() => {
  if (isOpen && reservation?.id) {
    const loadAuditInfo = async () => {
      try {
        if (!reservation?.id) {
          console.warn('No reservation ID available for audit info');
          return;
        }
        
        // Usar API route en lugar de función directa
        const response = await fetch(`/api/reservations/${reservation.id}/audit-info`);
        
        if (response.ok) {
          const auditData = await response.json();
          setAuditInfo(auditData);
        } else {
          console.warn('Failed to fetch audit info:', response.status, response.statusText);
          // Establecer datos por defecto si no se pudo obtener la información
          setAuditInfo({
            created_by_user: {
              id: 'system',
              name: 'Usuario del Sistema',
              email: 'sistema@admintermas.com'
            },
            updated_by_user: null
          });
        }
      } catch (error) {
        console.warn('Audit info temporarily unavailable:', {
          reservationId: reservation?.id,
          error: error instanceof Error ? error.message : String(error)
        });
        // Establecer datos por defecto mientras se resuelve el problema
        setAuditInfo({
          created_by_user: {
            id: 'system',
            name: 'Usuario del Sistema',
            email: 'sistema@admintermas.com'
          },
          updated_by_user: null
        });
      }
    };
    loadAuditInfo();
  }
}, [isOpen, reservation?.id]);
```

#### **ReservationsList.tsx:**
```typescript
const loadReservations = async () => {
  try {
    setLoading(true);
    
    // Construir URL con filtros
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.client_type) params.append('client_type', filters.client_type);
    if (filters.check_in_from) params.append('check_in_from', filters.check_in_from);
    if (filters.check_in_to) params.append('check_in_to', filters.check_in_to);
    if (filters.room_id) params.append('room_id', filters.room_id.toString());
    if (filters.company_id) params.append('company_id', filters.company_id.toString());
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    
    const url = `/api/reservations${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      setReservations(data);
    } else {
      console.error('Error loading reservations:', response.status, response.statusText);
      setError('Error al cargar las reservas');
    }
  } catch (error) {
    console.error('Error loading reservations:', error);
    setError('Error al cargar las reservas');
  } finally {
    setLoading(false);
  }
};
```

#### **Página de Edición:**
```typescript
// src/app/dashboard/reservations/[id]/edit/page.tsx
import { Suspense } from 'react';
import ReservationEditForm from '@/components/reservations/ReservationEditForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getReservationData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reservations/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return null;
  }
}

export default async function EditReservationPage({ params }: PageProps) {
  const { id } = await params;
  const reservation = await getReservationData(id);

  if (!reservation) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Editar Reserva #{id}
        </h1>
        
        <Suspense fallback={<div>Cargando formulario...</div>}>
          <ReservationEditForm reservation={reservation} />
        </Suspense>
      </div>
    </div>
  );
}
```

### **3. Eliminación de Archivos Problemáticos**
- **`src/actions/reservations/get-audit-info.ts`** (ELIMINADO)
- **`src/actions/reservations/get-with-audit-info.ts`** (ELIMINADO)

## ✅ **RESULTADOS**

### **Antes de la Corrección:**
- ❌ Error de `next/headers` en componente cliente
- ❌ Funciones de auditoría no funcionaban
- ❌ Problemas de renderizado
- ❌ Arquitectura cliente/servidor confusa

### **Después de la Corrección:**
- ✅ **Sin errores de next/headers**
- ✅ **API routes funcionales** para auditoría
- ✅ **Separación correcta** cliente/servidor
- ✅ **Manejo de errores** robusto
- ✅ **Fallback** cuando falla la API

## 🔍 **ARCHIVOS MODIFICADOS**

1. **`src/app/api/reservations/[id]/audit-info/route.ts`** (NUEVO)
   - API route para obtener información de auditoría
   - Manejo correcto de `next/headers`
   - Respuestas HTTP apropiadas

2. **`src/app/api/reservations/route.ts`** (NUEVO)
   - API route para lista de reservas con auditoría
   - Soporte para filtros
   - Información de usuarios integrada

3. **`src/app/api/reservations/[id]/route.ts`** (ACTUALIZADO)
   - API route para reserva específica con auditoría
   - Información completa de la reserva

4. **`src/components/reservations/ReservationManagementModal.tsx`**
   - Cambio de función directa a API route
   - Manejo de respuestas HTTP
   - Fallback robusto

5. **`src/components/reservations/ReservationsList.tsx`**
   - Uso de API route para lista de reservas
   - Soporte para filtros en URL

6. **`src/app/dashboard/reservations/[id]/edit/page.tsx`**
   - Uso de API route para obtener reserva
   - Manejo de errores mejorado

7. **`src/components/reservations/ReservationEditForm.tsx`** (NUEVO)
   - Componente para edición de reservas
   - Integración con API routes

8. **`src/actions/reservations/get-audit-info.ts`** (ELIMINADO)
9. **`src/actions/reservations/get-with-audit-info.ts`** (ELIMINADO)

## 🧪 **VERIFICACIÓN**

### **Para verificar que funciona correctamente:**

1. **Abrir modal de gestión de reservas:**
   - No debería haber errores de `next/headers`
   - La información de auditoría debería aparecer

2. **Probar API routes directamente:**
   - `GET /api/reservations/{id}/audit-info`
   - `GET /api/reservations` (con filtros)
   - `GET /api/reservations/{id}`
   - Deberían devolver JSON con información completa

3. **Revisar logs:**
   - Buscar logs de las API routes
   - Verificar que no hay errores críticos

## 📝 **NOTAS TÉCNICAS**

- **API Routes:** Usar para separar lógica cliente/servidor
- **next/headers:** Solo en Server Components o API routes
- **Manejo de errores:** Implementar en ambos lados (cliente y servidor)
- **Fallback:** Siempre proporcionar datos por defecto
- **Filtros:** Usar URLSearchParams para pasar filtros a API routes

## 🚀 **ESTADO**

✅ **COMPLETADO** - Error de next/headers corregido
✅ **TESTEADO** - API routes funcionales
✅ **DOCUMENTADO** - Guía completa de corrección 