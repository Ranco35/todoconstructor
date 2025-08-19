import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import fs from 'fs';
import path from 'path';

async function forceDeleteDirectory(dirPath: string, maxRetries = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (fs.existsSync(dirPath)) {
        // En Windows, esperar un poco y reintentar si hay archivos en uso
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`🧹 Datos de autenticación limpiados (intento ${i + 1})`);
        return;
      } else {
        console.log('ℹ️ No se encontraron datos de autenticación previos');
        return;
      }
    } catch (error: any) {
      console.warn(`⚠️ Intento ${i + 1} de limpieza falló:`, error.message);
      
      if (i === maxRetries - 1) {
        // Último intento: usar comando del sistema en Windows
        try {
          const { exec } = require('child_process');
          await new Promise((resolve, reject) => {
            exec(`rmdir /s /q "${dirPath}"`, (error: any) => {
              if (error) reject(error);
              else resolve(null);
            });
          });
          console.log('🧹 Datos de autenticación limpiados usando comando del sistema');
          return;
        } catch (systemError) {
          console.error('❌ No se pudo limpiar autenticación:', systemError);
          throw new Error('No se pudo limpiar la autenticación después de múltiples intentos');
        }
      }
    }
  }
}

export async function POST() {
  try {
    console.log('🔴 API WhatsApp Unlink: Desvinculando bot...');
    
    // Paso 1: Destruir el cliente actual completamente
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    await whatsappManager.destroy();
    console.log('✅ Cliente destruido exitosamente');
    
    // Paso 2: Esperar que todos los procesos terminen
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Paso 3: Limpiar datos de autenticación con reintentos
    const authPath = path.join(process.cwd(), '.wwebjs_auth');
    await forceDeleteDirectory(authPath);
    
    // Paso 4: Esperar antes de reinicializar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Paso 5: Forzar nueva inicialización (debería generar QR)
    console.log('🔄 Reinicializando cliente para generar nuevo QR...');
    await whatsappManager.initialize();
    
    return NextResponse.json({
      success: true,
      message: 'Cliente desvinculado y reinicializado. Se debería generar un nuevo QR en unos segundos.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error desvinculando WhatsApp:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 