import React from 'react';
import { notFound } from 'next/navigation';
import UserForm from '@/components/shared/UserForm';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UserData } from '@/types/auth';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

async function getUser(id: string): Promise<UserData | null> {
  const cookieStore = await cookies();
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
            // Ignorar
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ignorar
          }
        },
      } 
    }
  );

  try {
    console.log('Fetching user with ID:', id);
    
    // Primero verificar si el usuario existe
    const { data: userExists, error: existsError } = await supabase
      .from('User')
      .select('id')
      .eq('id', id);

    if (existsError) {
      console.error('Error checking if user exists:', existsError.message);
      return null;
    }

    if (!userExists || userExists.length === 0) {
      console.error('User not found with ID:', id);
      return null;
    }

    if (userExists.length > 1) {
      console.error('Multiple users found with ID:', id, 'Count:', userExists.length);
      return null;
    }

    // Ahora obtener el usuario completo con su rol
    const { data: user, error } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user details:', error.message);
      return null;
    }

    if (!user) {
      console.error('User details not found after existence check');
      return null;
    }

    console.log('User found:', { id: user.id, name: user.name, email: user.email });

    // Dividir el nombre completo en firstName y lastName
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: user.id,
      username: user.username || user.email,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      role: user.Role ? (user.Role as any).roleName : 'USUARIO_FINAL',
      department: user.department,
      isCashier: user.isCashier || false,
      isActive: user.isActive,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching user:', error.message);
    return null;
  }
}

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard/configuration/users"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
              <p className="text-gray-600 mt-2">
                Modifica la información de {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Información del usuario actual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>@{user.username}</span>
                <span>•</span>
                <span>{user.email}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'SUPER_USER' 
                    ? 'bg-red-100 text-red-800'
                    : user.role === 'ADMINISTRADOR'
                    ? 'bg-blue-100 text-blue-800'
                    : user.role === 'JEFE_SECCION'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Último acceso</div>
              <div className="text-sm font-medium text-gray-900">
                {user.lastLogin 
                  ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nunca'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Información importante para edición */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-amber-900 mb-2">
                Precauciones al Editar Usuario
              </h3>
              <div className="text-amber-800 space-y-2">
                <p>• <strong>Username:</strong> No se puede modificar una vez creado</p>
                <p>• <strong>Contraseña:</strong> Solo cambiar si es necesario (dejar vacío para mantener actual)</p>
                <p>• <strong>Rol:</strong> Cambios de rol afectan permisos inmediatamente</p>
                <p>• <strong>Estado:</strong> Desactivar usuario bloquea inmediatamente el acceso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Modificar Información</h2>
            <p className="text-sm text-gray-600 mt-1">
              Actualiza los campos que necesites modificar
            </p>
          </div>
          
          <div className="p-6">
            <UserForm user={user} isEdit={true} />
          </div>
        </div>
      </div>
    </div>
  );
} 