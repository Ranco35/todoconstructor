import { NextRequest, NextResponse } from 'next/server';
import { translateContent } from '@/actions/ai/openai-actions';

interface TranslateRequest {
  content: string;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();

    // Validar que tenemos contenido
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Se requiere contenido para traducir' 
        },
        { status: 400 }
      );
    }

    // Validar longitud del contenido (máximo 8,000 caracteres)
    if (body.content.length > 8000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El contenido es demasiado largo (máximo 8,000 caracteres)' 
        },
        { status: 400 }
      );
    }

    // Idioma objetivo por defecto
    const targetLanguage = body.targetLanguage || 'inglés';

    // Validar idioma objetivo
    const supportedLanguages = [
      'inglés', 'english',
      'francés', 'français', 'french',
      'alemán', 'deutsch', 'german',
      'italiano', 'italiano', 'italian',
      'portugués', 'português', 'portuguese',
      'japonés', '日本語', 'japanese',
      'chino', '中文', 'chinese',
      'coreano', '한국어', 'korean',
      'ruso', 'русский', 'russian',
      'árabe', 'العربية', 'arabic',
    ];

    if (!supportedLanguages.includes(targetLanguage.toLowerCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Idioma no soportado: ${targetLanguage}. Idiomas disponibles: ${supportedLanguages.join(', ')}` 
        },
        { status: 400 }
      );
    }

    console.log('🌍 API Translate: Procesando traducción', {
      contentLength: body.content.length,
      targetLanguage: targetLanguage,
      sourceLanguage: body.sourceLanguage || 'auto-detect',
    });

    // Llamar a la función de traducción
    const response = await translateContent(body.content, targetLanguage);

    // Devolver respuesta
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en API Translate:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// Método GET para obtener información sobre idiomas soportados
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de traducción funcionando correctamente',
    supportedLanguages: {
      'inglés': 'English',
      'francés': 'Français',
      'alemán': 'Deutsch',
      'italiano': 'Italiano',
      'portugués': 'Português',
      'japonés': '日本語',
      'chino': '中文',
      'coreano': '한국어',
      'ruso': 'Русский',
      'árabe': 'العربية',
    },
    usage: {
      method: 'POST',
      endpoint: '/api/ai/translate',
      body: {
        content: 'string (requerido, máximo 8,000 caracteres)',
        targetLanguage: 'string (opcional, por defecto: inglés)',
        sourceLanguage: 'string (opcional, auto-detectado)',
      },
    },
    features: [
      'Traducción automática de alta calidad',
      'Detección automática de idioma origen',
      'Preservación del formato y contexto',
      'Soporte para múltiples idiomas',
      'Traducción contextual y natural',
    ],
  });
} 