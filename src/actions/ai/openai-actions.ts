'use server';

import getOpenAIClient, { 
  DEFAULT_CHAT_CONFIG, 
  TASK_CONFIGS, 
  ChatResponse, 
  ChatMessage, 
  ChatRequest 
} from '@/lib/openai-client';
import { logTokenUsage } from '@/actions/ai/token-usage-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

// Función principal para chatear con OpenAI
export async function chatWithOpenAI(request: ChatRequest): Promise<ChatResponse> {
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
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OPENAI_API_KEY no está configurada',
      };
    }

    // Determinar configuración a usar
    const config = request.taskType 
      ? { ...DEFAULT_CHAT_CONFIG, ...TASK_CONFIGS[request.taskType] }
      : { ...DEFAULT_CHAT_CONFIG, ...request.config };

    console.log('🤖 Enviando solicitud a OpenAI:', {
      model: config.model,
      messageCount: request.messages.length,
      taskType: request.taskType || 'general',
      userId: currentUser?.id || 'anónimo',
    });

    // Realizar la llamada a OpenAI
    const response = await getOpenAIClient().chat.completions.create({
      model: config.model,
      messages: request.messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
    });

    const assistantMessage = response.choices[0]?.message?.content || '';

    console.log('✅ Respuesta de OpenAI recibida:', {
      responseLength: assistantMessage.length,
      usage: response.usage,
      userId: currentUser?.id || 'anónimo',
    });

    // 🎯 LOGGING AUTOMÁTICO DE TOKENS - Nueva funcionalidad
    if (response.usage) {
      try {
        const logResult = await logTokenUsage({
          session_id: request.sessionId || `session-${startTime}`,
          feature_type: request.taskType || 'chat',
          model_used: config.model,
          prompt_tokens: response.usage.prompt_tokens || 0,
          completion_tokens: response.usage.completion_tokens || 0,
          request_type: 'completion',
          endpoint_used: '/chat/completions',
          success: true,
        });

        if (!logResult.success) {
          console.warn('⚠️ Error al registrar uso de tokens:', logResult.error);
        } else {
          console.log('📊 Tokens registrados exitosamente:', {
            id: logResult.data?.id,
            totalTokens: response.usage.prompt_tokens + response.usage.completion_tokens,
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
      },
    };
  } catch (error) {
    console.error('❌ Error en chatWithOpenAI:', error);
    
    // Registrar error en el sistema de tokens también
    if (currentUser || request.taskType) {
      try {
        await logTokenUsage({
          session_id: request.sessionId || `session-${startTime}`,
          feature_type: request.taskType || 'chat',
          model_used: 'unknown',
          prompt_tokens: 0,
          completion_tokens: 0,
          request_type: 'completion',
          endpoint_used: '/chat/completions',
          success: false,
          error_message: error instanceof Error ? error.message : 'Error desconocido',
        });
      } catch (logError) {
        console.warn('⚠️ Error al registrar fallo:', logError);
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función específica para analizar texto
export async function analyzeText(text: string, analysisType: string = 'general'): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un asistente experto en análisis de texto. Proporciona análisis detallados y profesionales en español.`,
  };

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Analiza el siguiente texto desde la perspectiva de ${analysisType}:\n\n${text}`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'analysis',
  });
}

// Función para generar resúmenes
export async function generateSummary(content: string, maxLength: number = 200): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un experto en crear resúmenes concisos y precisos. Crea resúmenes en español de máximo ${maxLength} palabras.`,
  };

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Crea un resumen del siguiente contenido:\n\n${content}`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'summarization',
  });
}

// Función para generar descripciones de productos
export async function generateProductDescription(productName: string, category: string, features: string[]): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un experto en marketing y descripciones de productos para hoteles y spas. Crea descripciones atractivas y profesionales en español.`,
  };

  const featuresText = features.length > 0 ? `Características: ${features.join(', ')}` : '';

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Genera una descripción atractiva para el producto: ${productName}
Categoría: ${category}
${featuresText}

La descripción debe ser profesional, atractiva y adecuada para un hotel/spa.`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'content_generation',
  });
}

// Función para optimizar contenido para SEO
export async function optimizeContentForSEO(content: string, keywords: string[]): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un experto en SEO y optimización de contenido. Optimiza el contenido manteniendo su esencia pero mejorando su SEO.`,
  };

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Optimiza el siguiente contenido para SEO, incluyendo las palabras clave: ${keywords.join(', ')}

Contenido original:
${content}

Mantén el sentido original pero mejora el SEO.`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'content_generation',
  });
}

// Función específica para generar presupuestos de grupos con GPT-4
export async function generateGroupBudgetWithOpenAI(
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
): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres GPT-4, el asistente de IA más avanzado de OpenAI, especializado en redacción comercial B2B para Hotel & Spa Termas Llifen, un resort premium en Chile.

CONTEXTO EMPRESARIAL:
- Resort de lujo con aguas termales naturales terapéuticas
- Especialista en eventos corporativos y grupos grandes
- Ubicación exclusiva en Chile para team building y wellness
- Servicios premium de spa, gastronomía y experiencias grupales
- Cliente corporativo que busca experiencias de bienestar para equipos

TU MISIÓN EMPRESARIAL:
Generar un email comercial B2B ${tone} pero altamente persuasivo que convierta este presupuesto grupal en una confirmación inmediata.

CARACTERÍSTICAS DEL EMAIL CORPORATIVO:
- Tono ${tone} pero ejecutivo y directo
- Enfoque en ROI y beneficios organizacionales
- Destacar wellness corporativo y productividad
- Crear urgencia empresarial elegante
- Propuesta de valor clara para decisores
- Team building y cohesión de equipos
- Beneficios terapéuticos para bienestar laboral

ESTRUCTURA EMPRESARIAL OBLIGATORIA:
1. Saludo ejecutivo personalizado
2. Propuesta de valor corporativa inmediata
3. Beneficios del wellness para equipos y productividad
4. Desglose de servicios con enfoque grupal
5. Valor por colaborador y ROI del bienestar
6. Facilidades empresariales y logística
7. Urgencia profesional para toma de decisión
8. Call-to-action directo para confirmación`,
  };

  // Calcular estadísticas automáticamente si no se proporcionan
  const totalTrips = budgetData.totalTrips || Math.ceil(budgetData.totalGuests / 42);
  const guestsPerTrip = budgetData.guestsPerTrip || Math.round(budgetData.totalGuests / totalTrips);
  const pricePerPerson = budgetData.totalGuests > 0 ? (budgetData.total / budgetData.totalGuests) : 0;

  const itemsList = budgetData.items.map(item => 
    `• ${item.name} - ${item.quantity} ${item.quantity > 1 ? 'servicios' : 'servicio'} ($${item.price.toLocaleString('es-CL')} CLP)`
  ).join('\n');

  const userMessage: ChatMessage = {
    role: 'user',
    content: `GENERA UN EMAIL B2B EXCEPCIONAL para presupuesto CORPORATIVO/GRUPAL:

🏢 DATOS DEL PRESUPUESTO EMPRESARIAL:
• Cliente/Empresa: ${budgetData.clientName}
• Número de presupuesto: ${budgetData.budgetNumber}
• Inversión total: $${budgetData.total.toLocaleString('es-CL')} CLP
• Colaboradores participantes: ${budgetData.totalGuests} personas
• Inversión por colaborador: $${pricePerPerson.toLocaleString('es-CL')} CLP
• Grupos programados: ${totalTrips} viajes
• Personas por grupo: ${guestsPerTrip} colaboradores
• Validez de la propuesta: ${budgetData.validUntil || '30 días'}

🎯 SERVICIOS CORPORATIVOS INCLUIDOS:
${itemsList}

📧 REQUERIMIENTOS DEL EMAIL B2B:
- Dirigido a directores/gerentes/decisores
- Tono ${tone} pero persuasivo y ejecutivo
- Enfoque en beneficios organizacionales
- Máximo 450 palabras
- Destacar ROI del bienestar corporativo
- Incluir valor por colaborador
- Beneficios para productividad y cohesión
- NO incluir asunto (solo cuerpo)

💼 ELEMENTOS CLAVE EMPRESARIALES:
- Wellness corporativo como inversión estratégica
- Team building en ambiente de lujo único
- Beneficios terapéuticos para reducir estrés laboral
- Facilidades empresariales para grupos
- Experiencia premium que fortalece equipos
- Urgencia profesional para confirmar la inversión
- ROI en bienestar y productividad

🎯 LLAMADA A LA ACCIÓN:
- Confirmar la experiencia de wellness para el equipo
- Destacar beneficios únicos de las termas
- Información de contacto corporativo directa

¡Genera el email B2B más persuasivo que convierta esta propuesta grupal en una experiencia corporativa confirmada!`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'email_generation',
    config: {
      model: 'gpt-4o', // Forzar uso de GPT-4
      temperature: 0.7,
      max_tokens: 2000,
    },
  });
}

// Función para generar respuestas de email automáticas
export async function generateEmailResponse(emailContent: string, tone: 'formal' | 'friendly' | 'professional' = 'professional'): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un asistente que genera respuestas de email ${tone}es para un hotel/spa. Mantén un tono ${tone} y profesional.`,
  };

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Genera una respuesta adecuada para el siguiente email:\n\n${emailContent}`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'content_generation',
  });
}

// Función para traducir contenido
export async function translateContent(content: string, targetLanguage: string = 'inglés'): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un traductor profesional. Traduce el contenido de manera precisa y natural al ${targetLanguage}.`,
  };

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Traduce el siguiente contenido al ${targetLanguage}:\n\n${content}`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'translation',
  });
}

// Función para ayuda con código
export async function getCodeAssistance(codeContext: string, question: string): Promise<ChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `Eres un asistente experto en programación, especialmente en TypeScript, React y Next.js. Proporciona respuestas técnicas precisas y útiles.`,
  };

  const userMessage: ChatMessage = {
    role: 'user',
    content: `Contexto del código:\n${codeContext}\n\nPregunta:\n${question}`,
  };

  return chatWithOpenAI({
    messages: [systemMessage, userMessage],
    taskType: 'code_assistant',
  });
}

// Función para verificar el estado de la API
export async function checkOpenAIStatus(): Promise<ChatResponse> {
  try {
    const testResponse = await chatWithOpenAI({
      messages: [
        { role: 'user', content: 'Responde solo con "OK" para verificar la conexión.' }
      ],
      config: { max_tokens: 2000 },
    });

    return {
      success: testResponse.success,
      data: testResponse.data,
      error: testResponse.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar estado',
    };
  }
} 