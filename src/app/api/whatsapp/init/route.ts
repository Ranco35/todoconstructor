import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🚀 API WhatsApp Init: Forzando inicialización del bot...');
    
    // Reinicializar el cliente
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    await whatsappManager.initialize();
    
    console.log('✅ Cliente de WhatsApp inicializado exitosamente');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cliente de WhatsApp inicializado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error inicializando WhatsApp',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Método GET para obtener información sobre la inicialización
export async function GET() {
  try {
    console.log('🔍 API WhatsApp Init: Obteniendo información de inicialización...');

    // Obtener estado actual
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    const status = whatsappManager.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Información de inicialización de WhatsApp Bot',
      data: {
        currentStatus: status,
        initializationInfo: {
          required: !status.isReady,
          steps: [
            'Inicializar cliente de WhatsApp',
            'Configurar autenticación local',
            'Generar código QR (si es necesario)',
            'Conectar con WhatsApp Web',
            'Registrar handlers de mensajes',
            'Activar respuestas automáticas',
          ],
          notes: [
            'El proceso puede tomar 30-60 segundos',
            'Se generará un código QR si es la primera vez',
            'Mantén el navegador abierto durante la inicialización',
            'Una vez conectado, el bot responderá automáticamente',
          ],
        },
      },
    });

  } catch (error) {
    console.error('❌ Error obteniendo info de inicialización:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }, { status: 500 });
  }
}

// Método DELETE para detener/reiniciar el bot
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔴 API WhatsApp Init: Deteniendo bot...');

    // Aquí podrías agregar lógica para detener el bot si es necesario
    // Por ahora, solo devolvemos información

    return NextResponse.json({
      success: true,
      message: 'Solicitud de detención recibida',
      data: {
        action: 'stop_requested',
        note: 'El bot se detendrá en la próxima reinicialización del servidor',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error deteniendo bot:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }, { status: 500 });
  }
} 