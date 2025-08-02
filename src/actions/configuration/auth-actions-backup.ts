'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Types
interface LoginCredentials {
  username: string;
  password: string;
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

interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

// Función helper para crear cliente Supabase
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (_error) {
            // Ignorar
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (_error) {
            // Ignorar
          }
        },
      },
    }
  );
}

// Funciones de autenticación
export async function login(credentials: LoginCredentials) {
  const { username, password } = credentials;
  const supabase = await createSupabaseServerClient();
  
  let userEmail = username;
  try {
    const isEmail = username.includes('@');

    if (!isEmail) {
      const { data: user, error: findUserError } = await supabase
        .from('User')
        .select('email')
        .eq('name', username)
        .single();

      if (findUserError || !user) {
        console.log(`Login failed: Username "${username}" not found.`);
        return { success: false, message: "Credenciales de inicio de sesión no válidas" };
      }
      userEmail = user.email;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return { success: false, message: `Error de autenticación: ${authError.message}` };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const supabaseClient = await getSupabaseClient();
      await supabaseClient
        .from('User')
        .update({ lastLogin: new Date().toISOString() })
        .eq('id', user.id);
      console.log(`Login successful and lastLogin updated for: ${userEmail}`);
    } else {
      console.log(`Login successful for: ${userEmail}, but could not get user from session to update lastLogin.`);
    }

    return { success: true, message: "Inicio de sesión exitoso" };

  } catch (error: any) {
    console.error("Error inesperado en login:", error.message);
    return { success: false, message: "Error en el servidor" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  redirect('/login');
}

export async function getCurrentUser(): Promise<UserData | null> {
  const cookieStore = await cookies();

  const supabase = createSupabaseServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError.message);
      return null;
    }

    if (!user) {
      return null;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 es "JSON object requested, multiple (or no) rows returned"
      // Lo ignoramos porque lo manejaremos a continuación, pero otros errores sí los registramos.
      console.error('Error fetching user from DB:', profileError.message);
      return null;
    }
    
    // Si el usuario existe, lo retornamos.
    if (userProfile) {
        return {
            id: userProfile.id,
            username: userProfile.name,
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            role: userProfile.Role ? (userProfile.Role as any).roleName : 'user',
            department: userProfile.department,
            isCashier: userProfile.isCashier || false,
            isActive: userProfile.isActive,
            lastLogin: userProfile.lastLogin ? new Date(userProfile.lastLogin) : null,
        };
    }

    // Si el usuario NO existe en nuestra tabla pública (profileError.code === 'PGRST116')
    // lo creamos "Just-In-Time".
    if (profileError && profileError.code === 'PGRST116' && user) {
      console.log(`User with ID ${user.id} not found in public.User. Creating profile JIT...`);

      const defaultRole = await supabase.from('Role').select('id').eq('roleName', 'USUARIO_FINAL').single();
      if (!defaultRole.data) {
        console.error('Could not find default role "USUARIO_FINAL" to create JIT profile.');
        return null;
      }

      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email, // Usar nombre de metadata o email
          username: user.user_metadata?.name || user.email,
          roleId: defaultRole.data.id,
          isActive: true,
          department: 'SISTEMAS', // Un valor por defecto razonable
        })
        .select('*, Role(roleName)')
        .single();
      
      if (createError) {
        console.error('Error creating JIT user profile:', createError.message);
        return null;
      }

      console.log(`JIT Profile created for user ID ${newUser.id}`);
      return {
        id: newUser.id,
        username: newUser.name,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.Role ? (newUser.Role as any).roleName : 'user',
        department: newUser.department,
        isCashier: newUser.isCashier || false,
        isActive: newUser.isActive,
        lastLogin: newUser.lastLogin ? new Date(newUser.lastLogin) : null,
      };
    }

    return null;
  } catch (error) {
    console.error('Error inesperado en getCurrentUser:', error);
    return null;
  }
}

// Funciones de gestión de usuarios
// NOTA: Estas acciones deben usar el cliente de Supabase con Service Role Key
// para poder gestionar usuarios. Usaremos 'supabaseServer' que ya está configurado.

export async function createUser(formData: FormData): Promise<CreateUserResult> {
  try {
    console.log('🚀 createUser: Iniciando creación de usuario');
    
    // 1. Extraer datos del formulario
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const roleName = formData.get('role') as string;
    const department = formData.get('department') as string;
    const isCashier = formData.get('isCashier') === 'true';

    console.log('📝 createUser: Datos extraídos:', {
      email,
      firstName,
      lastName,
      roleName,
      department,
      isCashier,
      hasPassword: !!password
    });

    // 2. Validaciones básicas
    if (!email || !password || !firstName || !roleName || !department) {
      console.error('❌ createUser: Faltan campos requeridos');
      return { success: false, error: 'Email, contraseña, nombre, rol y departamento son requeridos.' };
    }

    console.log('✅ createUser: Validaciones básicas pasadas');

    // 3. Verificar configuración de Supabase
    console.log('🔧 createUser: Verificando configuración de Supabase...');
    const supabaseClient = await getSupabaseServiceClient();
    if (!supabaseClient) {
      console.error('❌ createUser: No se pudo obtener cliente de Supabase');
      return { success: false, error: 'Error de configuración del servidor.' };
    }

    // 4. Crear el usuario en Supabase Auth
    console.log('🔐 createUser: Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma el email para simplificar
      user_metadata: { name: `${firstName} ${lastName}` }
    });

    if (authError) {
      console.error('❌ createUser: Error creando usuario en Supabase Auth:', authError.message);
      console.error('❌ createUser: Código de error:', authError.status);
      return { success: false, error: `Error de autenticación: ${authError.message}` };
    }
    
    if (!authData?.user) {
      console.error('❌ createUser: No se recibió usuario de Auth');
      return { success: false, error: 'Error: No se pudo crear el usuario de autenticación.' };
    }
    
    const authUser = authData.user;
    console.log('✅ createUser: Usuario creado en Auth con ID:', authUser.id);
    
    // 5. Obtener el ID del rol desde la tabla 'Role'
    console.log('🔍 createUser: Buscando rol:', roleName);
    const { data: roleData, error: roleError } = await supabaseClient
      .from('Role')
      .select('id')
      .eq('roleName', roleName)
      .single();

    if (roleError) {
      console.error('❌ createUser: Error obteniendo rol:', roleError.message);
      // Si falla, borramos el usuario de Auth para evitar inconsistencias
      await supabaseClient.auth.admin.deleteUser(authUser.id);
      return { success: false, error: `Error obteniendo rol: ${roleError.message}` };
    }
    
    if (!roleData) {
      console.error('❌ createUser: Rol no encontrado:', roleName);
      // Si falla, borramos el usuario de Auth para evitar inconsistencias
      await supabaseClient.auth.admin.deleteUser(authUser.id);
      return { success: false, error: `El rol "${roleName}" no existe en el sistema.` };
    }

    console.log('✅ createUser: Rol encontrado con ID:', roleData.id);

    // 6. Crear el perfil en la tabla pública 'User'
    console.log('👤 createUser: Creando perfil en tabla User...');
    const userProfileData = {
      id: authUser.id,
      name: `${firstName} ${lastName}`,
      username: (formData.get('username') as string) || email,
      email: email,
      roleId: roleData.id,
      department: department,
      isCashier: isCashier,
      isActive: true,
    };
    
    console.log('📝 createUser: Datos del perfil:', userProfileData);
    
    const { data: newUser, error: profileError } = await supabaseClient
      .from('User')
      .insert(userProfileData)
      .select('id')
      .single();

    if (profileError) {
      console.error('❌ createUser: Error creando perfil de usuario:', profileError.message);
      console.error('❌ createUser: Código de error:', profileError.code);
      console.error('❌ createUser: Detalles:', profileError.details);
      // Si falla, borramos el usuario de Auth para evitar inconsistencias
      await supabaseClient.auth.admin.deleteUser(authUser.id);
      return { success: false, error: `Error al crear el perfil: ${profileError.message}` };
    }

    if (!newUser) {
      console.error('❌ createUser: No se recibió usuario creado');
      // Si falla, borramos el usuario de Auth para evitar inconsistencias
      await supabaseClient.auth.admin.deleteUser(authUser.id);
      return { success: false, error: 'Error: No se pudo crear el perfil del usuario.' };
    }

    console.log('✅ createUser: Usuario creado exitosamente con ID:', newUser.id);
    revalidatePath('/dashboard/configuration/users');
    return { success: true, userId: newUser.id };

  } catch (error: any) {
    console.error('❌ createUser: Error inesperado:', error.message);
    console.error('❌ createUser: Stack trace:', error.stack);
    console.error('❌ createUser: Tipo de error:', typeof error);
    console.error('❌ createUser: Error completo:', error);
    return { success: false, error: `Error inesperado en el servidor: ${error.message}` };
  }
}

export async function updateUser(userId: string, formData: FormData): Promise<CreateUserResult> {
  try {
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const roleName = formData.get('role') as string;
    const department = formData.get('department') as string;
    const isCashier = formData.get('isCashier') === 'true';
    const isActive = formData.get('isActive') !== 'false';
    const newPassword = formData.get('newPassword') as string;

    // Usar el cliente con service role para operaciones de administración
    const supabaseClient = await getSupabaseServiceClient();
    
    // Obtener el ID del rol
    const { data: roleData, error: roleError } = await supabaseClient
        .from('Role')
        .select('id')
        .eq('roleName', roleName)
        .single();
    
    if (roleError || !roleData) {
        return { success: false, error: `El rol "${roleName}" no es válido.` };
    }

    // Actualizar perfil en tabla 'User'
    const { error: profileError } = await supabaseClient
      .from('User')
      .update({
        name: `${firstName} ${lastName}`,
        email: email,
        roleId: roleData.id,
        department: department,
        isCashier: isCashier,
        isActive: isActive,
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Error actualizando perfil: ${profileError.message}`);
    }

    // Actualizar datos en Supabase Auth
    const { error: authError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { email: email, user_metadata: { name: `${firstName} ${lastName}` } }
    );
    
    if (authError) {
      throw new Error(`Error actualizando usuario en Auth: ${authError.message}`);
    }
    
    // Si se proporciona una nueva contraseña, actualizarla en Auth
    if (newPassword && newPassword.trim()) {
      const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      if (passwordError) {
        throw new Error(`Error actualizando contraseña: ${passwordError.message}`);
      }
    }

    revalidatePath('/dashboard/configuration/users');
    return { success: true };

  } catch (error: any) {
    console.error('Error actualizando usuario:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string): Promise<CreateUserResult> {
  try {
    const supabaseClient = await getSupabaseServiceClient();
    const { error } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (error) {
        // Si el usuario ya no existe en Auth pero sí en perfiles, puede dar error.
        // Podríamos manejarlo, pero por ahora un error es suficiente.
        throw new Error(`Error eliminando usuario de Supabase Auth: ${error.message}`);
    }

    // La tabla 'User' debería borrarse en cascada gracias a la FOREIGN KEY con ON DELETE CASCADE
    revalidatePath('/dashboard/configuration/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando usuario:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const supabaseClient = await getSupabaseClient();
    const { data: users, error } = await supabaseClient
      .from('User')
      .select('*, Role(roleName)')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return [];
    }

    return users.map(user => ({
      id: user.id,
      username: user.name,
      email: user.email,
      firstName: user.name.split(' ')[0] || user.name,
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      role: user.Role ? (user.Role as any).roleName : 'user',
      department: user.department as any,
      isCashier: user.isCashier || false,
      isActive: user.isActive,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null
    }));
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

// Alias para mantener compatibilidad
export const getUsers = getAllUsers;

// Función para verificar permisos
export async function hasPermission(
  userId: string, 
  requiredRole: 'SUPER_USER' | 'ADMINISTRADOR' | 'JEFE_SECCION' | 'USUARIO_FINAL'
): Promise<boolean> {
  try {
    const supabaseClient = await getSupabaseClient();
    const { data: user, error } = await supabaseClient
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', userId)
      .eq('isActive', true)
      .single();

    if (error || !user) return false;
    
    const userRole = user.Role ? (user.Role as any).roleName : null;
    if (!userRole) return false;

    const roleHierarchy = {
      'SUPER_USER': 4,
      'ADMINISTRADOR': 3,
      'JEFE_SECCION': 2,
      'USUARIO_FINAL': 1
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return false;
  }
} 