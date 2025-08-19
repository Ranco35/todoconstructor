import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🔄 API WhatsApp Status: Verificando estado del bot...');
    
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    const status = whatsappManager.getStatus();
    const qrCode = whatsappManager.getQRCode();
    
    const response = {
      success: true,
      connected: status.connected,
      status: status.status,
      hasQR: status.hasQR,
      clientConnected: status.clientConnected,
      managerConnected: status.managerConnected,
      managerReady: status.managerReady,
      qrCode: qrCode,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Estado del bot obtenido:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error obteniendo estado de WhatsApp:', error);
    return NextResponse.json({
      success: false,
      connected: false,
      status: 'error',
      hasQR: false,
      clientConnected: false,
      managerConnected: false,
      managerReady: false,
      qrCode: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    });
  }
}

// Endpoint para obtener información detallada del bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { includeConfig = false } = body;

    console.log('🔍 API WhatsApp Status: Obteniendo información detallada...');

    const { whatsappManager } = await import('@/lib/whatsapp-client');
    const client = whatsappManager.getClient();
    
    if (!client) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          status: 'disconnected',
          qrCode: null,
          error: 'Cliente WhatsApp no inicializado'
        }
      });
    }

    const isConnected = client.isConnected || false;
    const qrCode = whatsappManager.getQRCode();
    const status = isConnected ? 'connected' : 'disconnected';

    // Filtrar información sensible si no se solicita configuración completa
    const data = includeConfig 
      ? {
          connected: isConnected,
          status,
          qrCode,
          config: {
            name: 'AdminTermas Bot',
            businessHours: {
              start: '08:00',
              end: '22:00',
              timezone: 'America/Santiago'
            },
            autoReplyEnabled: true
          }
        }
      : {
          connected: isConnected,
          status,
          qrCode,
          config: {
            name: 'AdminTermas Bot',
            businessHours: {
              start: '08:00',
              end: '22:00',
              timezone: 'America/Santiago'
            },
            autoReplyEnabled: true
          }
        };

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error en detailed status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      data: {
        connected: false,
        status: 'error',
        qrCode: null
      }
    }, { status: 500 });
  }
} 