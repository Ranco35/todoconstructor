/**
 * Utilidades para manejo seguro de fechas sin problemas de zona horaria
 */

/**
 * Formatea una fecha de manera segura evitando problemas de zona horaria
 * @param dateInput - Fecha en formato string (YYYY-MM-DD) o objeto Date
 * @param options - Opciones de formato (opcional)
 * @returns Fecha formateada
 */
export function formatDateSafe(dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateInput) return '';
  
  // Si es un string, usar lógica original
  if (typeof dateInput === 'string') {
    // Si la fecha ya está en formato DD-MM-YYYY, devolverla tal como está (solo si no hay options)
    if (!options && dateInput.includes('-') && dateInput.length === 10) {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        // Si está en formato YYYY-MM-DD
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // Si está en formato DD-MM-YYYY
        if (parts[2].length === 4) {
          return dateInput;
        }
      }
    }
    
    try {
      // Crear fecha directamente desde los componentes para evitar problemas de zona horaria
      const [year, month, day] = dateInput.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month es 0-indexed
      
      return date.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        ...(options || { day: '2-digit', month: '2-digit', year: 'numeric' })
      });
    } catch (error) {
      console.error('Error formatting date string:', error);
      return dateInput;
    }
  }
  
  // Si es un objeto Date
  if (dateInput instanceof Date) {
    try {
      return dateInput.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        ...(options || { day: '2-digit', month: '2-digit', year: 'numeric' })
      });
    } catch (error) {
      console.error('Error formatting Date object:', error);
      return dateInput.toString();
    }
  }
  
  return '';
}

/**
 * Formatea una fecha con hora de manera segura
 * @param dateString - Fecha en formato string
 * @returns Fecha formateada con hora en formato chileno
 */
export function formatDateTimeSafe(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return dateString;
  }
}

/**
 * Convierte una fecha a formato ISO sin problemas de zona horaria
 * @param dateString - Fecha en formato string (YYYY-MM-DD)
 * @returns Fecha en formato ISO para la base de datos
 */
export function toISODateSafe(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0]; // Solo la parte de fecha
  } catch (error) {
    console.error('Error converting to ISO date:', error);
    return dateString;
  }
} 