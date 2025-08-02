import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 API de prueba OpenAI ejecutado');

  try {
    // Verificar variable de entorno
    const openaiKey = process.env.OPENAI_API_KEY;
    console.log('📊 OPENAI_API_KEY:', openaiKey ? `Configurada (${openaiKey.slice(0, 20)}...)` : 'No configurada');

    if (!openaiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY no está configurada en el servidor',
        context: 'environment_check'
      }, { status: 500 });
    }

    // Probar importación de la función
    console.log('⚙️ Importando función chatWithOpenAI...');
    const { chatWithOpenAI } = await import('@/actions/ai/openai-actions');
    console.log('✅ Función chatWithOpenAI importada');

    // Probar llamada simple a OpenAI
    console.log('⚙️ Probando llamada a OpenAI...');
    const result = await chatWithOpenAI({
      messages: [
        {
          role: 'user',
          content: 'Responde simplemente "OK" para confirmar que estás funcionando.'
        }
      ],
      taskType: 'email_analysis'
    });

    console.log('📊 Resultado de OpenAI:', {
      success: result.success,
      hasResponse: !!result.data?.message,
      hasError: !!result.error
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Error en llamada a OpenAI',
        details: result.error,
        context: 'openai_call'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prueba de OpenAI completada exitosamente',
      data: {
        openaiConfigured: true,
        responseReceived: !!result.data?.message,
        response: result.data?.message?.substring(0, 100), // Solo primeros 100 caracteres
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en prueba OpenAI:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno en prueba OpenAI',
      details: error instanceof Error ? error.message : 'Error desconocido',
      context: 'general_error'
    }, { status: 500 });
  }
} 