import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('📱 Endpoint QR solicitado - Iniciando...');
    
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    // Verificar que el manager existe
    if (!whatsappManager) {
      console.error('❌ whatsappManager no está disponible');
      return NextResponse.json({
        success: false,
        hasQR: false,
        error: 'WhatsApp Manager no está disponible',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ whatsappManager encontrado, obteniendo estado...');
    
    // Obtener estado actual
    const status = whatsappManager.getStatus();
    console.log('📊 Estado actual del manager:', status);
    
    // Obtener QR directamente del manager
    const qrCode = whatsappManager.getQRCode();
    console.log('📱 QR obtenido:', {
      hasQR: !!qrCode,
      qrLength: qrCode ? qrCode.length : 0,
      qrPreview: qrCode ? qrCode.substring(0, 50) + '...' : 'null'
    });
    
    if (qrCode) {
      console.log('✅ QR disponible, enviando respuesta exitosa');
      return NextResponse.json({
        success: true,
        hasQR: true,
        qrCode: qrCode,
        status: status,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('🔄 No hay QR, intentando forzar nueva inicialización...');
      
      try {
        console.log('🗑️ Destruyendo cliente existente...');
        await whatsappManager.destroy();
        
        console.log('🔄 Inicializando nuevo cliente...');
        await whatsappManager.initialize();
        
        // Esperar un momento para que se genere el QR
        console.log('⏳ Esperando 5 segundos para generación de QR...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const newQRCode = whatsappManager.getQRCode();
        const newStatus = whatsappManager.getStatus();
        
        console.log('📊 Estado después de reinicialización:', {
          hasQR: !!newQRCode,
          qrLength: newQRCode ? newQRCode.length : 0,
          status: newStatus.status,
          clientConnected: newStatus.clientConnected,
          managerReady: newStatus.managerReady
        });
        
        if (newQRCode) {
          console.log('✅ QR generado exitosamente después de reinicialización');
          return NextResponse.json({
            success: true,
            hasQR: true,
            qrCode: newQRCode,
            status: newStatus,
            message: 'QR generado exitosamente',
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('⚠️ QR no disponible después de reinicialización');
          return NextResponse.json({
            success: true,
            hasQR: false,
            qrCode: null,
            status: newStatus,
            message: 'QR no disponible después de reinicialización',
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('❌ Error en reinicialización:', error);
        console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
        
        return NextResponse.json({
          success: false,
          hasQR: false,
          error: 'Error reinicializando cliente: ' + (error instanceof Error ? error.message : 'Error desconocido'),
          status: status,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error('❌ Error crítico en endpoint QR:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json({
      success: false,
      hasQR: false,
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido'),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 