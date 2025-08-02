import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para notificar cuando se completa un análisis automático
 * Este endpoint puede ser llamado por cron jobs o sistemas externos
 * para notificar al frontend que se ha completado un análisis
 */

export async function POST(request: NextRequest) {
  try {
    const { timeSlot, success, message } = await request.json();

    // Validar datos requeridos
    if (!timeSlot) {
      return NextResponse.json({ 
        success: false, 
        error: 'timeSlot es requerido' 
      }, { status: 400 });
    }

    console.log(`📧 [NOTIFICATION] Análisis completado - Time Slot: ${timeSlot}, Success: ${success}`);

    // Aquí podrías implementar lógica adicional como:
    // - Enviar notificaciones push
    // - Actualizar base de datos de notificaciones
    // - Disparar eventos WebSocket
    // - Enviar emails de notificación

    // Para este caso, simplemente logueamos la notificación
    const notificationData = {
      timestamp: new Date().toISOString(),
      timeSlot,
      success: success !== false, // Default true si no se especifica
      message: message || 'Análisis completado exitosamente',
      type: 'automatic_analysis'
    };

    // Simular guardado de notificación (podrías usar base de datos)
    console.log('📊 [NOTIFICATION DATA]:', JSON.stringify(notificationData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Notificación procesada exitosamente',
      data: notificationData
    });

  } catch (error) {
    console.error('❌ Error procesando notificación de análisis:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint para verificar el estado del sistema de notificaciones
    const status = {
      active: true,
      timestamp: new Date().toISOString(),
      endpoints: {
        notification: '/api/emails/analysis-notification',
        analysis: '/api/emails/analyze'
      },
      instructions: {
        usage: 'POST con { timeSlot, success?, message? }',
        example: {
          timeSlot: 'morning',
          success: true,
          message: 'Análisis matutino completado exitosamente'
        }
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Sistema de notificaciones activo',
      data: status
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de notificaciones:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 