import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/actions/ai/openai-actions';

interface SummarizeRequest {
  content: string;
  maxLength?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();

    // Validar que tenemos contenido
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Se requiere contenido para resumir' 
        },
        { status: 400 }
      );
    }

    // Validar longitud del contenido (máximo 15,000 caracteres)
    if (body.content.length > 15000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El contenido es demasiado largo (máximo 15,000 caracteres)' 
        },
        { status: 400 }
      );
    }

    // Validar maxLength
    const maxLength = body.maxLength || 200;
    if (maxLength < 50 || maxLength > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La longitud máxima debe estar entre 50 y 1000 palabras' 
        },
        { status: 400 }
      );
    }

    console.log('📄 API Summarize: Procesando resumen', {
      contentLength: body.content.length,
      maxLength: maxLength,
    });

    // Llamar a la función de resumen
    const response = await generateSummary(body.content, maxLength);

    // Devolver respuesta
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en API Summarize:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// Método GET para obtener información sobre el endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de resúmenes funcionando correctamente',
    usage: {
      method: 'POST',
      endpoint: '/api/ai/summarize',
      body: {
        content: 'string (requerido, máximo 15,000 caracteres)',
        maxLength: 'number (opcional, por defecto: 200, rango: 50-1000)',
      },
    },
    features: [
      'Resúmenes concisos y precisos',
      'Longitud personalizable',
      'Mantiene información clave',
      'Formato profesional en español',
    ],
  });
} 