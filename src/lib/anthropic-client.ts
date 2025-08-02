import Anthropic from '@anthropic-ai/sdk';

// Cliente Anthropic con inicialización perezosa
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// Exportar función en lugar del cliente directo
export default getAnthropicClient;

// Interfaces para Anthropic
export interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AnthropicRequest {
  messages: AnthropicMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
  taskType?: keyof typeof TASK_CONFIGS;
  sessionId?: string;
}

export interface AnthropicResponse {
  success: boolean;
  data?: {
    message: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
    model?: string;
  };
  error?: string;
}

// Configuración por defecto para Claude
export const DEFAULT_CLAUDE_CONFIG = {
  model: 'claude-3-5-sonnet-20241022', // Claude Sonnet 4 - Más reciente y potente
  max_tokens: 2000,
  temperature: 0.7,
} as const;

// Configuración para diferentes tipos de tareas
export const TASK_CONFIGS = {
  // Para análisis de texto y datos
  analysis: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3,
    max_tokens: 2000,
  },
  
  // Para generación de contenido
  content_generation: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.8,
    max_tokens: 3000,
  },
  
  // Para asistencia con código
  code_assistant: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.2,
    max_tokens: 4000,
  },
  
  // Para traducción
  translation: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.2,
    max_tokens: 2000,
  },
  
  // Para respuestas de email y presupuestos - MEJORADO
  email_generation: {
    model: 'claude-3-5-sonnet-20241022', // Claude Sonnet 4
    temperature: 0.5, // Más creativo pero controlado
    max_tokens: 3000, // Más espacio para emails detallados
  },
  
  // Para chat general
  general: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    max_tokens: 2000,
  },
} as const;

// Verificar disponibilidad de Anthropic
export async function checkAnthropicAvailability(): Promise<{
  available: boolean;
  error?: string;
  model?: string;
}> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        available: false,
        error: 'ANTHROPIC_API_KEY no está configurada en las variables de entorno',
      };
    }

    // Test simple de conectividad
    const response = await getAnthropicClient().messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [
        { role: 'user', content: 'Responde solo "OK"' }
      ],
    });

    return {
      available: true,
      model: response.model,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Error desconocido al verificar Anthropic',
    };
  }
}

// Función auxiliar para convertir mensajes de OpenAI a formato Anthropic
export function convertMessagesToAnthropic(messages: AnthropicMessage[]): {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  let system: string | undefined;
  const filteredMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const message of messages) {
    if (message.role === 'system') {
      // Anthropic maneja el system message separadamente
      system = message.content;
    } else if (message.role === 'user' || message.role === 'assistant') {
      filteredMessages.push({
        role: message.role,
        content: message.content,
      });
    }
  }

  return { system, messages: filteredMessages };
} 