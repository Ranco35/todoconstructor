'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { redirect } from 'next/navigation';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
  user?: any;
}

export async function loginSimple(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const { username, password } = credentials;
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
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
              // Ignorar errores de cookies
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (_error) {
              // Ignorar errores de cookies
            }
          },
        },
      }
    );

    // Intentar login con email
    let userEmail = username;
    if (!username.includes('@')) {
      userEmail = username + '@termasllifen.cl';
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Credenciales incorrectas'
      };
    }

    if (data?.user) {
      return {
        success: true,
        user: data.user
      };
    }

    return {
      success: false,
      message: 'Error desconocido'
    };

  } catch (error) {
    console.error('Login exception:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
} 