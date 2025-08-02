import { NextRequest, NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Forzando inicialización del cliente WhatsApp...');
    
    // Destruir cliente existente si existe
    await whatsappManager.destroy();
    console.log('✅ Cliente anterior destruido');
    
    // Inicializar nuevo cliente
    await whatsappManager.initialize();
    console.log('✅ Cliente WhatsApp inicializado');
    
    // Esperar un momento para que se genere QR si es necesario
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Obtener estado actual
    const status = whatsappManager.getStatus();
    const qrCode = whatsappManager.getQRCode();
    
    console.log('📊 Estado después de inicialización:', {
      connected: status.connected,
      hasQR: status.hasQR,
      qrCodeExists: !!qrCode
    });
    
    return NextResponse.json({
      success: true,
      message: 'Cliente WhatsApp inicializado exitosamente',
      status: status,
      hasQR: !!qrCode,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error forzando inicialización:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = whatsappManager.getStatus();
    const qrCode = whatsappManager.getQRCode();
    
    return NextResponse.json({
      success: true,
      status: status,
      hasQR: !!qrCode,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 