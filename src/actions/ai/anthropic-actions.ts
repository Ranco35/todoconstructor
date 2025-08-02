'use server';

import getAnthropicClient, { 
  DEFAULT_CLAUDE_CONFIG, 
  TASK_CONFIGS, 
  AnthropicResponse, 
  AnthropicMessage, 
  AnthropicRequest,
  convertMessagesToAnthropic
} from '@/lib/anthropic-client';
import { logTokenUsage } from '@/actions/ai/token-usage-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

// Función principal para chatear con Anthropic Claude
export async function chatWithClaude(request: AnthropicRequest): Promise<AnthropicResponse> {
  const startTime = Date.now();
  let currentUser = null;
  
  try {
    // Obtener usuario actual para el logging
    try {
      currentUser = await getCurrentUser();
    } catch (userError) {
      console.warn('⚠️ No se pudo obtener usuario actual para logging:', userError);
    }

    // Validar que tenemos la API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY no está configurada',
      };
    }

    // Determinar configuración a usar
    const config = request.taskType 
      ? { ...DEFAULT_CLAUDE_CONFIG, ...TASK_CONFIGS[request.taskType] }
      : { ...DEFAULT_CLAUDE_CONFIG, model: request.model, max_tokens: request.max_tokens, temperature: request.temperature };

    console.log('🤖 Enviando solicitud a Claude:', {
      model: config.model,
      messageCount: request.messages.length,
      taskType: request.taskType || 'general',
      userId: currentUser?.id || 'anónimo',
    });

    // Convertir mensajes al formato de Anthropic
    const { system, messages } = convertMessagesToAnthropic(request.messages);

    // Realizar la llamada a Anthropic
    const response = await getAnthropicClient().messages.create({
      model: config.model as any,
      max_tokens: config.max_tokens as number,
      temperature: config.temperature,
      system: system || request.system,
      messages: messages,
    });

    const assistantMessage = response.content[0]?.type === 'text' ? response.content[0].text : '';

    console.log('✅ Respuesta de Claude recibida:', {
      responseLength: assistantMessage.length,
      usage: response.usage,
      userId: currentUser?.id || 'anónimo',
    });

    // 🎯 LOGGING AUTOMÁTICO DE TOKENS - Nueva funcionalidad para Anthropic
    if (response.usage) {
      try {
        const logResult = await logTokenUsage({
          session_id: request.sessionId || `session-${startTime}`,
          feature_type: request.taskType || 'chat',
          model_used: config.model as string,
          prompt_tokens: response.usage.input_tokens || 0,
          completion_tokens: response.usage.output_tokens || 0,
          request_type: 'completion',
          endpoint_used: '/messages',
          success: true,
          processing_time_ms: Date.now() - startTime,
        });

        if (!logResult.success) {
          console.warn('⚠️ Error al registrar uso de tokens:', logResult.error);
        } else {
          console.log('📊 Tokens registrados exitosamente:', {
            id: logResult.data?.id,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            estimatedCost: logResult.data?.estimated_cost_usd,
          });
        }
      } catch (logError) {
        console.warn('⚠️ Error en logging de tokens:', logError);
        // No interrumpimos la función principal por errores de logging
      }
    }

    return {
      success: true,
      data: {
        message: assistantMessage,
        usage: response.usage,
        model: response.model,
      },
    };

  } catch (error) {
    console.error('❌ Error en llamada a Claude:', error);

    // Log del error en tokens
    try {
      await logTokenUsage({
        session_id: request.sessionId || `session-${startTime}`,
        feature_type: request.taskType || 'chat',
        model_used: request.model || DEFAULT_CLAUDE_CONFIG.model,
        prompt_tokens: 0,
        completion_tokens: 0,
        request_type: 'completion',
        endpoint_used: '/messages',
        success: false,
        error_message: error instanceof Error ? error.message : 'Error desconocido',
      });
    } catch (logError) {
      console.warn('⚠️ Error en logging de error:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al comunicarse con Claude',
    };
  }
}

// Función para generar resumen con Claude
export async function generateSummaryWithClaude(content: string, maxWords: number = 100): Promise<AnthropicResponse> {
  const systemMessage: AnthropicMessage = {
    role: 'system',
    content: `Eres un asistente que genera resúmenes concisos. Genera un resumen de máximo ${maxWords} palabras del contenido proporcionado.`,
  };

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: `Resume el siguiente contenido en máximo ${maxWords} palabras:\n\n${content}`,
  };

  return chatWithClaude({
    messages: [systemMessage, userMessage],
    taskType: 'analysis',
  });
}

// Función para generar respuestas de email automáticas con Claude
export async function generateEmailResponseWithClaude(
  emailContent: string, 
  tone: 'formal' | 'friendly' | 'professional' = 'professional'
): Promise<AnthropicResponse> {
  const systemMessage: AnthropicMessage = {
    role: 'system',
    content: `Eres un asistente que genera respuestas de email ${tone}es para un hotel/spa. Mantén un tono ${tone} y profesional.`,
  };

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: `Genera una respuesta adecuada para el siguiente email:\n\n${emailContent}`,
  };

  return chatWithClaude({
    messages: [systemMessage, userMessage],
    taskType: 'email_generation',
  });
}

// Función específica para generar presupuestos de grupos con HTML
export async function generateGroupBudgetWithClaude(
  budgetData: {
    clientName: string;
    budgetNumber: string;
    total: number;
    totalGuests: number;
    totalTrips?: number;
    guestsPerTrip?: number;
    items: Array<{ name: string; quantity: number; price: number; description?: string }>;
    validUntil?: string;
  },
  tone: 'formal' | 'friendly' | 'professional' = 'professional'
): Promise<AnthropicResponse> {
  const systemMessage: AnthropicMessage = {
    role: 'system',
    content: `Eres un asistente especializado en generar presupuestos grupales para Hotel/Spa Termas Llifen. 
    Genera presupuestos ${tone}es, profesionales y orientados a grupos grandes.
    
    Características del hotel:
    - Hotel & Spa de lujo en Chile
    - Servicios premium de termas y spa
    - Experiencias para grupos y eventos corporativos
    - Especializado en programas de bienestar grupal
    
    El presupuesto debe:
    - Ser ${tone} y profesional
    - Destacar beneficios para grupos
    - Incluir detalles de servicios grupales
    - Mencionar flexibilidad para grupos grandes
    - Enfocarse en la experiencia de bienestar colectiva`,
  };

  // Calcular estadísticas automáticamente si no se proporcionan
  const totalTrips = budgetData.totalTrips || Math.ceil(budgetData.totalGuests / 42);
  const guestsPerTrip = budgetData.guestsPerTrip || Math.round(budgetData.totalGuests / totalTrips);

  const itemsList = budgetData.items.map(item => 
    `- ${item.name} (Cantidad: ${item.quantity}, Precio: $${item.price.toLocaleString('es-CL')})`
  ).join('\n');

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: `Genera un email profesional para un presupuesto GRUPAL con los siguientes datos:

Cliente/Organización: ${budgetData.clientName}
Número de presupuesto: ${budgetData.budgetNumber}
Total: $${budgetData.total.toLocaleString('es-CL')}
Válido hasta: ${budgetData.validUntil || '30 días'}

DETALLES DEL GRUPO:
- Total de huéspedes: ${budgetData.totalGuests} personas
- Viajes programados: ${totalTrips}
- Personas por viaje: ${guestsPerTrip}

Servicios incluidos:
${itemsList}

El email debe incluir:
1. Saludo apropiado para grupos/organizaciones
2. Presentación del programa grupal
3. Destacar beneficios para grupos grandes
4. Mencionar flexibilidad y personalización
5. Información de contacto para coordinación
6. Despedida profesional

IMPORTANTE: Este es un presupuesto para GRUPOS, no individual. Enfócate en:
- Experiencias colectivas
- Beneficios de grupo
- Coordinación de eventos
- Servicios especiales para grupos

Genera solo el contenido del email (sin asunto).`,
  };

  return chatWithClaude({
    messages: [systemMessage, userMessage],
    taskType: 'email_generation',
  });
}

// Función específica para generar emails de presupuestos con Claude Sonnet 4
export async function generateBudgetEmailWithClaude(
  budgetData: {
    clientName: string;
    budgetNumber: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    validUntil?: string;
  },
  tone: 'formal' | 'friendly' | 'professional' = 'professional',
  customInstructions?: string
): Promise<AnthropicResponse> {
  const systemMessage: AnthropicMessage = {
    role: 'system',
    content: `Eres Claude Sonnet 4, el asistente de IA más avanzado de Anthropic, especializado en redacción comercial para el Hotel & Spa Termas Llifen, un resort de lujo en Chile.

CONTEXTO DEL NEGOCIO:
- Hotel & Spa premium con aguas termales naturales
- Ubicado en Chile, ambiente relajante y de lujo
- Servicios de spa, masajes, gastronomía y alojamiento
- Clientela que busca experiencias de bienestar y relajación

TU MISIÓN:
Generar un email ${tone} pero persuasivo y cálido que haga que el cliente QUIERA reservar inmediatamente.

CARACTERÍSTICAS CLAVE DEL EMAIL:
- Tono ${tone} pero acogedor y lujoso
- Enfoque en los beneficios únicos de las termas
- Crear urgencia sutil pero elegante
- Destacar el valor y la experiencia premium
- Incluir elementos emocionales (relajación, bienestar, desconexión)
- Llamada a la acción clara y motivadora

ELEMENTOS OBLIGATORIOS:
1. Saludo personalizado y cálido
2. Contexto sobre los beneficios de las termas
3. Resumen de servicios incluidos con valor agregado
4. Sentido de urgencia elegante
5. Información de contacto directa
6. Despedida que genere acción inmediata`,
  };

  const itemsList = budgetData.items.map(item => 
    `• ${item.name} (${item.quantity} ${item.quantity > 1 ? 'unidades' : 'unidad'}) - $${item.price.toLocaleString('es-CL')}`
  ).join('\n');

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: `GENERA UN EMAIL COMERCIAL EXCEPCIONAL con estos datos:

📋 DATOS DEL PRESUPUESTO:
• Cliente: ${budgetData.clientName}
• Número: ${budgetData.budgetNumber}
• Total: $${budgetData.total.toLocaleString('es-CL')} CLP
• Validez: ${budgetData.validUntil || '30 días'}

🏨 SERVICIOS INCLUIDOS:
${itemsList}

${customInstructions ? `\n🎯 INSTRUCCIONES ESPECIALES:\n${customInstructions}` : ''}

📝 REQUERIMIENTOS:
- Email en español chileno
- Máximo 400 palabras
- Tono ${tone} pero vendedor
- Enfatizar beneficios únicos de las termas
- Crear deseo y urgencia elegante
- Incluir datos de contacto específicos
- NO incluir asunto (solo cuerpo del email)

💡 ELEMENTOS CLAVE A INCLUIR:
- Los beneficios terapéuticos de las aguas termales
- La experiencia de relajación y desconexión
- El valor excepcional de la oferta
- Sentido de exclusividad y lujo
- Llamada a la acción motivadora

¡Genera el mejor email comercial posible que convierta este presupuesto en una reserva confirmada!`,
  };

  return chatWithClaude({
    messages: [systemMessage, userMessage],
    taskType: 'email_generation',
  });
}

// Función para traducir contenido con Claude
export async function translateContentWithClaude(content: string, targetLanguage: string = 'inglés'): Promise<AnthropicResponse> {
  const systemMessage: AnthropicMessage = {
    role: 'system',
    content: `Eres un traductor profesional. Traduce el contenido de manera precisa y natural al ${targetLanguage}.`,
  };

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: `Traduce el siguiente contenido al ${targetLanguage}:\n\n${content}`,
  };

  return chatWithClaude({
    messages: [systemMessage, userMessage],
    taskType: 'translation',
  });
}

// Función para ayuda con código usando Claude
export async function getCodeAssistanceWithClaude(codeContext: string, question: string): Promise<AnthropicResponse> {
  const systemMessage: AnthropicMessage = {
    role: 'system',
    content: `Eres un asistente experto en programación, especialmente en TypeScript, React y Next.js. Proporciona respuestas técnicas precisas y útiles.`,
  };

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: `Contexto del código:\n${codeContext}\n\nPregunta:\n${question}`,
  };

  return chatWithClaude({
    messages: [systemMessage, userMessage],
    taskType: 'code_assistant',
  });
}

// Función para verificar el estado de la API de Anthropic
export async function checkClaudeStatus(): Promise<AnthropicResponse> {
  try {
    const testResponse = await chatWithClaude({
      messages: [
        { role: 'user', content: 'Responde solo con "OK" para verificar la conexión.' }
      ],
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
    });

    return {
      success: testResponse.success,
      data: testResponse.data,
      error: testResponse.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar estado de Claude',
    };
  }
} 