// Configuración de timeouts y reintentos
export const CONFIG = {
  defaultTimeout: 10000, // 10 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo entre reintentos
  maxRetryDelay: 5000, // máximo 5 segundos
};

// Error personalizado para problemas de conectividad
export class ConnectivityError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConnectivityError';
  }
} 