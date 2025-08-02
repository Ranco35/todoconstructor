import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 API de prueba Anthropic ejecutado');

    // Verificar si la API key está configurada
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    console.log('📊 ANTHROPIC_API_KEY:', anthropicKey ? `Configurada (${anthropicKey.slice(0, 20)}...)` : 'No configurada');

    if (!anthropicKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY no está configurada en el servidor',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Importar función de manera dinámica
    console.log('⚙️ Importando función chatWithClaude...');
    const { chatWithClaude } = await import('@/actions/ai/anthropic-actions');
    console.log('✅ Función chatWithClaude importada');

    // Probar llamada simple a Anthropic
    console.log('⚙️ Probando llamada a Anthropic...');
    const result = await chatWithClaude({
      messages: [
        {
          role: 'user',
          content: 'Responde solo con "Hola desde Claude" para probar la conexión.'
        }
      ],
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
    });

    console.log('📊 Resultado de Anthropic:', {
      success: result.success,
      messageLength: result.data?.message?.length,
      usage: result.data?.usage,
      error: result.error
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Error en llamada a Anthropic',
        details: result.error,
        context: 'anthropic_call'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prueba de Anthropic completada exitosamente',
      data: result.data,
      anthropicConfigured: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en prueba Anthropic:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno en prueba Anthropic',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 