import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Endpoint de debug solicitado');
    
    // Obtener información del sistema
    const systemInfo = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Obtener estado del manager de WhatsApp
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    const managerStatus = whatsappManager.getStatus();
    const client = whatsappManager.getClient();
    const qrCode = whatsappManager.getQRCode();

    // Información detallada del cliente
    let clientInfo = null;
    try {
      clientInfo = await whatsappManager.getClientInfo();
    } catch (error) {
      console.log('⚠️ No se pudo obtener información del cliente:', error);
    }

    // Verificar procesos del sistema (simulado)
    const processInfo = {
      chromeProcesses: 'Verificar manualmente con Task Manager',
      nodeProcesses: 'Verificar manualmente con Task Manager',
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      cpuUsage: 'No disponible en este endpoint'
    };

    // Estado de conexión detallado
    const connectionStatus = {
      managerConnected: managerStatus.managerConnected,
      managerReady: managerStatus.managerReady,
      clientConnected: managerStatus.clientConnected,
      hasQR: managerStatus.hasQR,
      status: managerStatus.status,
      clientExists: !!client,
      qrCodeExists: !!qrCode,
      qrCodeLength: qrCode ? qrCode.length : 0
    };

    // Diagnóstico de problemas comunes
    const diagnostics = {
      hasClient: !!client,
      isReady: managerStatus.managerReady,
      isConnected: managerStatus.managerConnected,
      hasQR: managerStatus.hasQR,
      potentialIssues: []
    };

    // Detectar problemas potenciales
    if (!client) {
      diagnostics.potentialIssues.push('Cliente WhatsApp no existe');
    }
    
    if (!managerStatus.managerReady) {
      diagnostics.potentialIssues.push('Manager no está listo');
    }
    
    if (!managerStatus.managerConnected) {
      diagnostics.potentialIssues.push('Manager no está conectado');
    }
    
    if (managerStatus.hasQR) {
      diagnostics.potentialIssues.push('QR code pendiente de escanear');
    }

    // Información de red (simulada)
    const networkInfo = {
      port3000: 'Verificar manualmente con netstat -an | findstr :3000',
      internetConnection: 'Verificar manualmente',
      dnsResolution: 'Verificar manualmente'
    };

    const debugInfo = {
      system: systemInfo,
      whatsapp: {
        manager: managerStatus,
        client: clientInfo,
        connection: connectionStatus,
        diagnostics: diagnostics,
        qrCode: qrCode ? 'QR Code disponible' : 'No hay QR Code'
      },
      processes: processInfo,
      network: networkInfo,
      recommendations: []
    };

    // Generar recomendaciones basadas en el estado
    if (diagnostics.potentialIssues.length > 0) {
      debugInfo.recommendations.push('Ejecutar script de limpieza: scripts/fix-whatsapp-system-v3.ps1');
    }
    
    if (!managerStatus.managerReady) {
      debugInfo.recommendations.push('Reiniciar la aplicación: npm run dev');
    }
    
    if (managerStatus.hasQR) {
      debugInfo.recommendations.push('Escanear el código QR desde WhatsApp');
    }
    
    if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // > 500MB
      debugInfo.recommendations.push('Memoria alta - considerar reiniciar la aplicación');
    }

    console.log('📊 Información de debug generada:', {
      managerStatus: managerStatus.status,
      hasClient: !!client,
      hasQR: !!qrCode,
      issues: diagnostics.potentialIssues.length
    });

    return NextResponse.json({
      success: true,
      data: debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en endpoint de debug:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    console.log('🔧 Acción de debug solicitada:', action);
    
    switch (action) {
      case 'restart':
        console.log('🔄 Reiniciando cliente de WhatsApp...');
        const { whatsappManager } = await import('@/lib/whatsapp-client');
        await whatsappManager.destroy();
        await whatsappManager.initialize();
        return NextResponse.json({
          success: true,
          message: 'Cliente de WhatsApp reiniciado',
          timestamp: new Date().toISOString()
        });
        
      case 'destroy':
        console.log('🗑️ Destruyendo cliente de WhatsApp...');
        const { whatsappManager } = await import('@/lib/whatsapp-client');
        await whatsappManager.destroy();
        return NextResponse.json({
          success: true,
          message: 'Cliente de WhatsApp destruido',
          timestamp: new Date().toISOString()
        });
        
      case 'initialize':
        console.log('🚀 Inicializando cliente de WhatsApp...');
        const { whatsappManager } = await import('@/lib/whatsapp-client');
        await whatsappManager.initialize();
        return NextResponse.json({
          success: true,
          message: 'Cliente de WhatsApp inicializado',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida. Acciones disponibles: restart, destroy, initialize'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Error en acción de debug:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 