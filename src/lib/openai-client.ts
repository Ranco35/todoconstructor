import OpenAI from 'openai';

// Cliente OpenAI con inicialización perezosa
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Exportar función en lugar del cliente directo
export default getOpenAIClient;

// Configuración por defecto para ChatGPT
export const DEFAULT_CHAT_CONFIG = {
  model: 'gpt-4o', // GPT-4 Omni - Más reciente y potente
  temperature: 0.7,
  max_tokens: 2000, // Aumentado para mejores respuestas
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
} as const;

// Configuración para diferentes tipos de tareas
export const TASK_CONFIGS = {
  // Para análisis de texto y datos
  analysis: {
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2500,
  },
  
  // Para generación de contenido
  content_generation: {
    model: 'gpt-4o',
    temperature: 0.8,
    max_tokens: 3000,
  },
  
  // Para asistencia con código
  code_assistant: {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 4000,
  },
  
  // Para resúmenes
  summarization: {
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 1500,
  },
  
  // Para traducción
  translation: {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 2000,
  },
  
  // Para generación de emails - NUEVO
  email_generation: {
    model: 'gpt-4o',
    temperature: 0.5,
    max_tokens: 3000,
  },
} as const;

// Función para verificar si la API está disponible
export async function checkOpenAIAvailability(): Promise<{
  success: boolean;
  error?: string;
}> {
  const startTime = Date.now();
  let currentUser = null;
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OPENAI_API_KEY no está configurada en las variables de entorno',
      };
    }

    // Obtener usuario actual para el logging (solo si estamos en servidor)
    if (typeof window === 'undefined') {
      try {
        const { getCurrentUser } = await import('@/actions/configuration/auth-actions');
        currentUser = await getCurrentUser();
      } catch (userError) {
        console.warn('⚠️ No se pudo obtener usuario actual para logging:', userError);
      }
    }

    // Probar conexión con una llamada mínima
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });

    // 🎯 LOGGING AUTOMÁTICO DE TOKENS - Nueva funcionalidad
    if (response.usage && typeof window === 'undefined') {
      try {
        const { logTokenUsage } = await import('@/actions/ai/token-usage-actions');
        const logResult = await logTokenUsage({
          user_id: currentUser?.id || null,
          session_id: `availability-check-${startTime}`,
          feature_type: 'system_check',
          model_used: 'gpt-3.5-turbo',
          prompt_tokens: response.usage.prompt_tokens || 0,
          completion_tokens: response.usage.completion_tokens || 0,
          request_type: 'availability_check',
          endpoint_used: '/chat/completions',
          success: true,
          processing_time_ms: Date.now() - startTime,
        });

        if (!logResult.success) {
          console.warn('⚠️ Error al registrar uso de tokens:', logResult.error);
        } else {
          console.log('📊 Tokens registrados exitosamente (Availability Check):', {
            id: logResult.data?.id,
            totalTokens: response.usage.prompt_tokens + response.usage.completion_tokens,
            estimatedCost: logResult.data?.estimated_cost_usd,
          });
        }
      } catch (logError) {
        console.warn('⚠️ Error en logging de tokens:', logError);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    // Registrar error en el sistema de tokens también
    if (typeof window === 'undefined' && (currentUser || startTime)) {
      try {
        const { logTokenUsage } = await import('@/actions/ai/token-usage-actions');
        await logTokenUsage({
          user_id: currentUser?.id || null,
          session_id: `availability-check-${startTime}`,
          feature_type: 'system_check',
          model_used: 'gpt-3.5-turbo',
          prompt_tokens: 0,
          completion_tokens: 0,
          request_type: 'availability_check',
          endpoint_used: '/chat/completions',
          success: false,
          error_message: error instanceof Error ? error.message : 'Error desconocido en availability check',
          processing_time_ms: Date.now() - startTime,
        });
      } catch (logError) {
        console.warn('⚠️ Error al registrar fallo en availability check:', logError);
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Tipos TypeScript para las respuestas
export interface ChatResponse {
  success: boolean;
  data?: {
    message: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  error?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  config?: Partial<typeof DEFAULT_CHAT_CONFIG>;
  taskType?: keyof typeof TASK_CONFIGS;
  sessionId?: string; // Para rastreo de sesiones en logging de tokens
} 