import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    
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

    if (!reservation) {
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
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 