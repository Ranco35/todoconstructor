'use server';

import getOpenAIClient, { checkOpenAIAvailability } from '@/lib/openai-client';
import { checkOpenAIStatus } from './openai-actions';

export interface ChatGPTAdminStats {
  isConfigured: boolean;
  isWorking: boolean;
  apiKeyStatus: 'valid' | 'invalid' | 'missing';
  lastCheck: Date;
  error?: string;
  configuration: {
    hasApiKey: boolean;
    defaultModel: string;
    availableModels: string[];
  };
  features: {
    chat: boolean;
    analysis: boolean;
    summarization: boolean;
    translation: boolean;
    codeAssistance: boolean;
  };
  endpoints: {
    [key: string]: {
      available: boolean;
      path: string;
    };
  };
}

/**
 * Obtiene estadísticas completas del estado de ChatGPT para administradores
 */
export async function getChatGPTAdminStats(): Promise<ChatGPTAdminStats> {
  try {
    console.log('🔍 Obteniendo estadísticas de administración de ChatGPT...');

    // Verificar configuración de API Key
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    let isWorking = false;
    let apiKeyStatus: 'valid' | 'invalid' | 'missing' = 'missing';
    let error: string | undefined;

    if (hasApiKey) {
      // Verificar conectividad
      const availabilityCheck = await checkOpenAIAvailability();
      isWorking = availabilityCheck.success;
      apiKeyStatus = availabilityCheck.success ? 'valid' : 'invalid';
      error = availabilityCheck.error;
    } else {
      error = 'OPENAI_API_KEY no está configurada en las variables de entorno';
    }

    // Configuración
    const configuration = {
      hasApiKey,
      defaultModel: 'gpt-3.5-turbo',
      availableModels: [
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'gpt-4',
        'gpt-4-turbo-preview'
      ]
    };

    // Estado de las funciones
    const features = {
      chat: isWorking,
      analysis: isWorking,
      summarization: isWorking,
      translation: isWorking,
      codeAssistance: isWorking
    };

    // Estado de los endpoints
    const endpoints = {
      chat: {
        available: isWorking,
        path: '/api/ai/chat'
      },
      analyze: {
        available: isWorking,
        path: '/api/ai/analyze'
      },
      summarize: {
        available: isWorking,
        path: '/api/ai/summarize'
      },
      translate: {
        available: isWorking,
        path: '/api/ai/translate'
      },
      status: {
        available: true,
        path: '/api/ai/status'
      }
    };

    const stats: ChatGPTAdminStats = {
      isConfigured: hasApiKey,
      isWorking,
      apiKeyStatus,
      lastCheck: new Date(),
      error,
      configuration,
      features,
      endpoints
    };

    console.log('✅ Estadísticas de ChatGPT obtenidas:', {
      configured: stats.isConfigured,
      working: stats.isWorking,
      apiKeyStatus: stats.apiKeyStatus
    });

    return stats;

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de ChatGPT:', error);
    
    return {
      isConfigured: false,
      isWorking: false,
      apiKeyStatus: 'invalid',
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : 'Error desconocido',
      configuration: {
        hasApiKey: false,
        defaultModel: 'gpt-3.5-turbo',
        availableModels: []
      },
      features: {
        chat: false,
        analysis: false,
        summarization: false,
        translation: false,
        codeAssistance: false
      },
      endpoints: {}
    };
  }
}

/**
 * Verifica la conectividad con OpenAI de forma detallada
 */
export async function performDetailedHealthCheck(): Promise<{
  success: boolean;
  checks: {
    apiKey: boolean;
    connection: boolean;
    chatCompletion: boolean;
    responseTime: number;
  };
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Realizando verificación detallada de salud de ChatGPT...');

    // Check 1: API Key
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    if (!hasApiKey) {
      return {
        success: false,
        checks: {
          apiKey: false,
          connection: false,
          chatCompletion: false,
          responseTime: Date.now() - startTime
        },
        error: 'API Key no configurada'
      };
    }

    // Check 2: Conexión básica
    const availabilityCheck = await checkOpenAIAvailability();
    if (!availabilityCheck.success) {
      return {
        success: false,
        checks: {
          apiKey: true,
          connection: false,
          chatCompletion: false,
          responseTime: Date.now() - startTime
        },
        error: availabilityCheck.error
      };
    }

    // Check 3: Chat completion funcional
    const statusCheck = await checkOpenAIStatus();
    const responseTime = Date.now() - startTime;

    if (statusCheck.success) {
      console.log('✅ Verificación detallada completada exitosamente');
      return {
        success: true,
        checks: {
          apiKey: true,
          connection: true,
          chatCompletion: true,
          responseTime
        }
      };
    } else {
      return {
        success: false,
        checks: {
          apiKey: true,
          connection: true,
          chatCompletion: false,
          responseTime
        },
        error: statusCheck.error
      };
    }

  } catch (error) {
    console.error('❌ Error en verificación detallada:', error);
    return {
      success: false,
      checks: {
        apiKey: !!process.env.OPENAI_API_KEY,
        connection: false,
        chatCompletion: false,
        responseTime: Date.now() - startTime
      },
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene información de configuración para administradores
 */
export async function getChatGPTConfiguration(): Promise<{
  environment: {
    hasApiKey: boolean;
    nodeEnv: string;
    timestamp: string;
  };
  models: {
    default: string;
    available: string[];
    recommended: string[];
  };
  limits: {
    maxTokens: number;
    temperatureRange: [number, number];
    supportedLanguages: string[];
  };
  documentation: {
    official: string;
    integration: string;
    troubleshooting: string;
  };
}> {
  return {
    environment: {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    models: {
      default: 'gpt-3.5-turbo',
      available: [
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'gpt-4',
        'gpt-4-turbo-preview'
      ],
      recommended: ['gpt-3.5-turbo', 'gpt-4']
    },
    limits: {
      maxTokens: 4096,
      temperatureRange: [0, 2],
      supportedLanguages: [
        'Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 
        'Portugués', 'Japonés', 'Chino', 'Coreano', 'Ruso', 'Árabe'
      ]
    },
    documentation: {
      official: 'https://platform.openai.com/docs',
      integration: '/docs/integration/openai-chatgpt-integration.md',
      troubleshooting: '/docs/troubleshooting/chatgpt-issues.md'
    }
  };
} 