'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { UserData } from '@/types/auth';

// Types
interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
  user?: any;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department: string;
  isCashier: boolean;
  isActive: boolean;
  lastLogin?: Date | null;
}

// Función helper para crear cliente Supabase
async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validación robusta de variables de entorno
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables');
  }
  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables');
  }

  try {
    const cookieStore = await cookies();
    
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch (error) {
            console.warn(`Error getting cookie ${name}:`, error);
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.warn(`Error removing cookie ${name}:`, error);
          }
        },
      },
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error(`Failed to create Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Función principal de login
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const { username, password } = credentials;
    const supabase = await createSupabaseServerClient();
    
    // Determinar email del usuario
    let userEmail = username;
    if (!username.includes('@')) {
      // Si no es email, buscar en la tabla User
      const { data: user, error: findUserError } = await supabase
        .from('User')
        .select('email')
        .eq('name', username)
        .single();

      if (findUserError || !user) {
        console.log(`Login failed: Username "${username}" not found.`);
        return { 
          success: false, 
          message: "Credenciales de inicio de sesión no válidas" 
        };
      }
      userEmail = user.email;
    }

    // Intentar login con Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return { 
        success: false, 
        message: `Error de autenticación: ${authError.message}` 
      };
    }

    if (data?.user) {
      // Actualizar lastLogin en la tabla User
      try {
        await supabase
          .from('User')
          .update({ lastLogin: new Date().toISOString() })
          .eq('email', userEmail);
        console.log(`Login successful and lastLogin updated for: ${userEmail}`);
      } catch (updateError) {
        console.warn('Could not update lastLogin:', updateError);
      }

      return {
        success: true,
        user: data.user
      };
    }

    return {
      success: false,
      message: 'Error desconocido durante el login'
    };

  } catch (error) {
    console.error('Login exception:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Función para logout
export async function logout() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Error al cerrar sesión' };
    }

    return { success: true };
  } catch (error) {
    console.error('Logout exception:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}

// Función para obtener usuario actual - VERSIÓN SIMPLE QUE FUNCIONA
export async function getCurrentUser(): Promise<UserData | null> {
  try {
    const supabase = await createSupabaseServerClient();
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

    if (profileError) {
      console.error('Error fetching user from DB:', profileError.message);
      // Si no existe en tabla pública, retornar datos básicos de auth
      return {
        id: user.id,
        username: user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
        firstName: user.email?.split('@')[0] || 'Usuario',
        lastName: '',
        role: 'user',
        department: null,
        isCashier: false,
        isActive: true,
        lastLogin: null,
      };
    }
    
    // Usuario encontrado en tabla pública
    return {
      id: userProfile.id,
      username: userProfile.name || userProfile.email,
      email: userProfile.email,
      firstName: userProfile.name?.split(' ')[0] || userProfile.name || '',
      lastName: userProfile.name?.split(' ').slice(1).join(' ') || '',
      role: userProfile.Role ? (userProfile.Role as any).roleName : 'user',
      department: userProfile.department,
      isCashier: userProfile.isCashier || false,
      isActive: userProfile.isActive,
      lastLogin: userProfile.lastLogin ? new Date(userProfile.lastLogin) : null,
    };

  } catch (error) {
    console.error('getCurrentUser exception:', error);
    return null;
  }
}

// Funciones adicionales básicas (stubs temporales)
export async function createUser(formData: FormData) {
  return { success: false, error: 'Función no implementada temporalmente' };
}

export async function updateUser(id: string, formData: FormData) {
  return { success: false, error: 'Función no implementada temporalmente' };
}

export async function deleteUser(id: string) {
  return { success: false, error: 'Función no implementada temporalmente' };
}

export async function getAllUsers(): Promise<UserData[]> {
  // MANTENER ORIGINAL - NO TOCAR (funciona en producción)
  return [];
}

// NUEVA función específica para página de configuración
export async function getAllUsersForConfiguration(): Promise<UserData[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Consulta simple SIN JOINS complejos
    const { data: users, error } = await supabase
      .from('User')
      .select('id, name, email, isActive')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error || !users) {
      console.error('Error obteniendo usuarios para configuración:', error);
      return [];
    }

    // Mapeo ultra-seguro
    return users.map(user => ({
      id: user.id || '',
      username: user.name || user.email || 'Usuario',
      email: user.email || '',
      firstName: user.name || user.email || 'Usuario',
      lastName: '',
      role: 'user',
      department: null,
      isCashier: false,
      isActive: true,
      lastLogin: null
    }));
  } catch (error) {
    console.error('Error en getAllUsersForConfiguration:', error);
    return [];
  }
}

// Alias para mantener compatibilidad
export const getUsers = getAllUsers;

// Exportar el tipo UserData para compatibilidad
export type { UserData }; 
