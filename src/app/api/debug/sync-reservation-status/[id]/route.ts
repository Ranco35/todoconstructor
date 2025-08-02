import { NextRequest, NextResponse } from 'next/server';
import { syncReservationStatus } from '@/actions/reservations/sync-status';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleSyncReservationStatus(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleSyncReservationStatus(request, params);
}

async function handleSyncReservationStatus(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    
    if (isNaN(reservationId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de reserva inválido' 
      }, { status: 400 });
    }

    console.log(`🔄 Sincronizando estado de reserva ${reservationId}...`);

    // Ejecutar sincronización
    const result = await syncReservationStatus(reservationId);

    if (result.success) {
      console.log(`✅ Sincronización exitosa: ${result.message}`);
      
      // Revalidar cache para que los cambios se reflejen inmediatamente
      revalidatePath('/dashboard/reservations');
      revalidatePath('/dashboard/reservations/calendar');
      revalidatePath(`/dashboard/reservations/${reservationId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Estado sincronizado exitosamente',
        data: result,
        cache_cleared: true,
        next_steps: [
          'Refresca la página del calendario',
          'Abre el modal de gestión de reserva',
          'Verifica que ahora muestre el estado correcto'
        ]
      });
    } else {
      console.error(`❌ Error en sincronización: ${result.message}`);
      return NextResponse.json({
        success: false,
        error: result.message,
        data: result
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in sync reservation status endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 