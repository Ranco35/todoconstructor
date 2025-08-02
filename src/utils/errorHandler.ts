import { toast } from 'sonner';

/**
 * Maneja errores de manera consistente en toda la aplicación
 * Evita mostrar errores técnicos en la consola del navegador
 * Solo muestra mensajes amigables al usuario via toast
 */
export function handleError(
  error: any, 
  userMessage: string = 'Ha ocurrido un error',
  showConsoleInDev: boolean = false
) {
  // En desarrollo, opcionalmente mostrar en consola
  if (showConsoleInDev && process.env.NODE_ENV === 'development') {
    console.error('Error técnico:', error);
  }
  
  // Siempre mostrar mensaje amigable al usuario
  toast.error(userMessage);
}

/**
 * Maneja errores específicos de operaciones CRUD
 */
export function handleCrudError(
  error: any,
  operation: 'crear' | 'actualizar' | 'eliminar' | 'cargar',
  entity: string
) {
  const messages = {
    crear: `Error al crear ${entity}`,
    actualizar: `Error al actualizar ${entity}`,
    eliminar: `Error al eliminar ${entity}`,
    cargar: `Error al cargar ${entity}`
  };
  
  handleError(error, messages[operation]);
}

/**
 * Maneja errores de validación
 */
export function handleValidationError(error: any, field?: string) {
  const message = field 
    ? `Error en el campo "${field}"`
    : 'Error de validación';
  
  handleError(error, message);
}

/**
 * Maneja errores de permisos
 */
export function handlePermissionError() {
  handleError(null, 'No tienes permisos para realizar esta acción');
}

/**
 * Maneja errores de red/conectividad
 */
export function handleNetworkError() {
  handleError(null, 'Error de conexión. Verifica tu internet e intenta nuevamente');
} 