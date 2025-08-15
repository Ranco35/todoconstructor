// Utilidades para manejo de errores sin contaminar la consola

/**
 * Maneja errores silenciosamente para evitar que Next.js intercepte los logs
 * Solo usa console.error en desarrollo para debugging
 */
export function handleError(error: unknown, context?: string): void {
  // Solo mostrar errores en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '[Error]';
    console.warn(prefix, error);
  }
}

/**
 * Maneja errores con callback opcional para notificaciones al usuario
 */
export function handleErrorWithCallback(
  error: unknown, 
  onError?: (message: string) => void,
  context?: string
): void {
  handleError(error, context);
  
  if (onError) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    onError(message);
  }
}

/**
 * Wrapper para fetch con manejo de errores consistente
 */
export async function safeFetch(
  url: string, 
  options?: RequestInit
): Promise<Response | null> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    handleError(error, `Fetch ${url}`);
    return null;
  }
}

/**
 * Wrapper para operaciones async con manejo de errores
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}