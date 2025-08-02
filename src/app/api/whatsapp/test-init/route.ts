import { NextRequest, NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Iniciando prueba de inicialización...');
    
    // Paso 1: Verificar estado inicial
    const initialStatus = whatsappManager.getStatus();
    console.log('📊 Estado inicial:', initialStatus);
    
    // Paso 2: Intentar destruir cliente existente
    try {
      await whatsappManager.destroy();
      console.log('✅ Cliente destruido exitosamente');
    } catch (destroyError) {
      console.log('⚠️ Error destruyendo cliente (continuando):', destroyError);
    }
    
    // Paso 3: Intentar inicializar nuevo cliente
    try {
      console.log('🚀 Iniciando nueva inicialización...');
      await whatsappManager.initialize();
      console.log('✅ Inicialización completada');
    } catch (initError) {
      console.error('❌ Error en inicialización:', initError);
      return NextResponse.json({
        success: false,
        error: 'Error en inicialización: ' + (initError instanceof Error ? initError.message : 'Error desconocido'),
        details: {
          errorType: initError?.constructor?.name,
          stack: initError instanceof Error ? initError.stack : undefined
        }
      }, { status: 500 });
    }
    
    // Paso 4: Verificar estado final
    await new Promise(resolve => setTimeout(resolve, 2000));
    const finalStatus = whatsappManager.getStatus();
    const qrCode = whatsappManager.getQRCode();
    
    console.log('📊 Estado final:', {
      connected: finalStatus.connected,
      hasQR: finalStatus.hasQR,
      qrCodeExists: !!qrCode
    });
    
    return NextResponse.json({
      success: true,
      message: 'Prueba de inicialización completada',
      initialStatus: initialStatus,
      finalStatus: finalStatus,
      hasQR: !!qrCode,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de inicialización:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: {
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 