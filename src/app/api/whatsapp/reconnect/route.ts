import { NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp-client';

export async function POST() {
  try {
    console.log('🔄 API WhatsApp Reconnect: Intentando reconectar...');
    
    // Obtener estado actual
    const status = whatsappManager.getStatus();
    console.log('📊 Estado actual:', status);
    
    if (status.connected && status.managerReady) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp ya está conectado',
        status: status
      });
    }
    
    // Intentar reconexión sin destruir
    try {
      console.log('🔄 Iniciando proceso de reconexión...');
      await whatsappManager.initialize();
      
      // Esperar un momento para que se establezca la conexión
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newStatus = whatsappManager.getStatus();
      const qrCode = whatsappManager.getQRCode();
      
      console.log('📊 Nuevo estado:', newStatus);
      
      return NextResponse.json({
        success: true,
        message: newStatus.connected ? 'Reconexión exitosa' : 'QR generado para vinculación',
        status: newStatus,
        qrCode: qrCode,
        timestamp: new Date().toISOString()
      });
      
    } catch (reconnectError) {
      console.error('❌ Error en reconexión:', reconnectError);
      
      return NextResponse.json({
        success: false,
        error: 'Error durante la reconexión',
        details: reconnectError instanceof Error ? reconnectError.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error en API de reconexión:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 