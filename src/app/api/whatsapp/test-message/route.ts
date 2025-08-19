import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: 'phoneNumber y message son requeridos'
      }, { status: 400 });
    }

    console.log('📤 Enviando mensaje de prueba:', { phoneNumber, message });

    // Verificar que el cliente esté conectado usando solo el status del manager
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    const status = whatsappManager.getStatus();
    console.log('🔍 Estado actual del manager:', status);

    if (!status.connected || !status.managerReady) {
      console.log('❌ Cliente no está listo:', { 
        connected: status.connected, 
        managerReady: status.managerReady,
        fullStatus: status 
      });
      return NextResponse.json({
        success: false,
        error: 'WhatsApp no está conectado. Estado actual: ' + status.status,
        debug: status
      }, { status: 400 });
    }

    // Formatear número de teléfono si es necesario
    const formattedPhone = phoneNumber.includes('@c.us') ? phoneNumber : phoneNumber.replace(/\D/g, '') + '@c.us';
    console.log('📱 Número formateado:', formattedPhone);

    // Enviar mensaje
    console.log('🚀 Intentando enviar mensaje...');
    const result = await whatsappManager.sendMessage(formattedPhone, message);
    console.log('📋 Resultado del envío:', result);

    // Si el envío falló, devolver error 400
    if (!result.success) {
      console.log('❌ Envío falló:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Error desconocido al enviar mensaje',
        debug: { formattedPhone, originalPhone: phoneNumber, result }
      }, { status: 400 });
    }

    console.log('✅ Mensaje enviado exitosamente');
    return NextResponse.json({
      success: true,
      data: result.data,
      messageId: result.messageId,
      debug: { formattedPhone, originalPhone: phoneNumber }
    });

  } catch (error) {
    console.error('❌ Error enviando mensaje de prueba:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      debug: { 
        errorType: error?.constructor?.name,
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 