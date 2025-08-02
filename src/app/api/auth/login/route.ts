import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/actions/configuration/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validación básica
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      }, { status: 400 });
    }

    // Llamar a la función de login
    const result = await login({ username, password });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Login error:', error);
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${error.message || 'Error desconocido'}`
    }, { status: 500 });
  }
}