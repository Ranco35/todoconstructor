import { NextRequest, NextResponse } from 'next/server';
import { processPDFInvoice } from '@/actions/purchases/pdf-processor';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: Endpoint process-pdf ejecutado');
    
    // Obtener FormData de la request
    const formData = await request.formData();
    
    // Log de archivos recibidos
    const file = formData.get('file') as File;
    if (file) {
      console.log(`📄 Archivo recibido: ${file.name} (${file.size} bytes)`);
    }
    
    // Procesar PDF con nuestra función
    const result = await processPDFInvoice(formData);
    
    console.log('✅ Procesamiento API completado:', {
      success: result.success,
      invoiceId: result.invoice_id,
      confidence: result.confidence,
      manualReview: result.manual_review_required
    });
    
    // Devolver resultado
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Error en API process-pdf:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// Configuración para permitir archivos grandes
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 segundos máximo 