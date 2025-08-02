import { NextRequest, NextResponse } from 'next/server';
import { checkOpenAIStatus } from '@/actions/ai/openai-actions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Status: Verificando estado de OpenAI...');

    // Verificar variables de entorno
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY no está configurada',
        status: 'not_configured',
        checks: {
          apiKey: false,
          connection: false,
        },
      });
    }

    // Verificar conexión con OpenAI
    const connectionTest = await checkOpenAIStatus();

    const status = {
      success: connectionTest.success,
      status: connectionTest.success ? 'operational' : 'error',
      checks: {
        apiKey: hasApiKey,
        connection: connectionTest.success,
      },
      timestamp: new Date().toISOString(),
      endpoints: {
        chat: '/api/ai/chat',
        analyze: '/api/ai/analyze',
        summarize: '/api/ai/summarize',
        translate: '/api/ai/translate',
        status: '/api/ai/status',
      },
      features: [
        'Chat conversacional',
        'Análisis de texto',
        'Generación de resúmenes',
        'Traducción automática',
        'Generación de descripciones de productos',
        'Optimización SEO',
        'Respuestas de email automáticas',
        'Asistencia con código',
      ],
    };

    if (!connectionTest.success) {
      status.error = connectionTest.error;
    }

    console.log('✅ API Status: Verificación completada', {
      success: connectionTest.success,
      hasApiKey,
    });

    return NextResponse.json(status);

  } catch (error) {
    console.error('❌ Error en API Status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      status: 'error',
      checks: {
        apiKey: !!process.env.OPENAI_API_KEY,
        connection: false,
      },
    });
  }
}

// Método POST para hacer una verificación más profunda
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testMessage = body.testMessage || 'Hola, ¿cómo estás?';

    console.log('🧪 API Status: Ejecutando test profundo...');

    // Ejecutar test de conexión con mensaje personalizado
    const testResult = await checkOpenAIStatus();

    const deepStatus = {
      success: testResult.success,
      status: testResult.success ? 'operational' : 'error',
      testMessage: testMessage,
      response: testResult.data?.message || null,
      usage: testResult.data?.usage || null,
      timestamp: new Date().toISOString(),
      error: testResult.error || null,
    };

    console.log('✅ API Status: Test profundo completado', {
      success: testResult.success,
      responseLength: testResult.data?.message?.length || 0,
    });

    return NextResponse.json(deepStatus);

  } catch (error) {
    console.error('❌ Error en test profundo:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      status: 'error',
    });
  }
} 