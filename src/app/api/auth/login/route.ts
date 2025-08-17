import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Normalizar entrada
    const rawUsername = typeof username === 'string' ? username : '';
    const rawPassword = typeof password === 'string' ? password : '';
    const normalizedUsername = rawUsername.trim();
    const normalizedPassword = rawPassword;

    // Validación básica
    if (!normalizedUsername || !normalizedPassword) {
      return NextResponse.json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      }, { status: 400 });
    }

    // Preparar un portador de cookies para que Supabase pueda escribir Set-Cookie
    const cookieCarrier = NextResponse.next();

    // Crear cliente Supabase con adaptador de cookies basado en la respuesta
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieCarrier.cookies.set(name, value, options as CookieOptions)
            );
          },
        },
      }
    );

    // Determinar email del usuario
    let userEmail: string = normalizedUsername;
    if (!normalizedUsername.includes('@')) {
      try {
        // Usar cliente de servicio para bypassear RLS al resolver username → email
        const serviceClient = await getSupabaseServiceClient();

        // Buscar por username exacto primero
        const { data: byUsername } = await serviceClient
          .from('User')
          .select('email')
          .eq('username', normalizedUsername)
          .single();

        if (byUsername?.email) {
          userEmail = byUsername.email;
        } else {
          // Fallback: buscar por name exacto
          const { data: byName } = await serviceClient
            .from('User')
            .select('email')
            .eq('name', normalizedUsername)
            .single();

          if (byName?.email) {
            userEmail = byName.email;
          } else {
            const final401 = NextResponse.json(
              { success: false, message: 'Usuario no encontrado' },
              { status: 401 }
            );
            cookieCarrier.cookies.getAll().forEach((c) => {
              final401.cookies.set(c.name, c.value, c as unknown as CookieOptions);
            });
            return final401;
          }
        }
      } catch (resolveErr: any) {
        const final401 = NextResponse.json(
          { success: false, message: `No fue posible validar el usuario: ${resolveErr?.message || 'Error'}` },
          { status: 401 }
        );
        cookieCarrier.cookies.getAll().forEach((c) => {
          final401.cookies.set(c.name, c.value, c as unknown as CookieOptions);
        });
        return final401;
      }
    }

    // Iniciar sesión con Supabase (esto adjunta cookies a 'response')
    userEmail = userEmail.toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: normalizedPassword,
    });

    if (error) {
      const final401 = NextResponse.json(
        { success: false, message: `Error de autenticación: ${error.message}` },
        { status: 401 }
      );
      cookieCarrier.cookies.getAll().forEach((c) => {
        final401.cookies.set(c.name, c.value, c as unknown as CookieOptions);
      });
      return final401;
    }

    // Actualizar lastLogin de forma no crítica
    try {
      await supabase
        .from('User')
        .update({ lastLogin: new Date().toISOString() })
        .eq('email', userEmail);
    } catch {}

    const result = {
      success: true,
      user: data?.user ?? null,
      session: {
        access_token: data?.session?.access_token ?? '',
        refresh_token: data?.session?.refresh_token ?? '',
      },
    };

    const final200 = NextResponse.json(result, { status: 200 });
    // Transferir cookies emitidas por Supabase al response final JSON
    cookieCarrier.cookies.getAll().forEach((c) => {
      final200.cookies.set(c.name, c.value, c as unknown as CookieOptions);
    });
    return final200;

  } catch (error: any) {
    console.error('API Login error:', error);
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${error.message || 'Error desconocido'}`
    }, { status: 500 });
  }
}