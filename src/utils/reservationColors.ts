/**
 * Utilidad para determinar colores de reservas según estado y pagos
 * Sistema de colores del calendario de reservas
 * 
 * PRIORIDAD: Estado de reserva > Estado de pago
 * 1. 🔴 ROJO: Cancelada (status: 'cancelled') - MÁXIMA PRIORIDAD
 * 2. 🟠 NARANJA: En curso/Check-in (status: 'en_curso') - ALTA PRIORIDAD
 * 3. ⚫ GRIS: Finalizada/Check-out (status: 'finalizada') - ALTA PRIORIDAD
 * 4. Luego por estado de pago:
 *    - 🟡 AMARILLO: Sin abono (prereserva) - payment_status: 'no_payment'
 *    - 🔵 AZUL: Pago parcial - payment_status: 'partial' con monto < total
 *    - 🟢 VERDE: Pagado completo - payment_status: 'paid' o monto ≥ total
 */

export interface ReservationColorInfo {
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
}

/**
 * Determina el color y estilo de una reserva basado en su estado y pagos
 * @param status Estado de la reserva
 * @param paymentStatus Estado del pago
 * @param paidAmount Monto pagado
 * @returns Información de colores y estilos
 */
export function getReservationColor(
  status: string, 
  paymentStatus: string, 
  paidAmount: number = 0
): ReservationColorInfo {
  
  // 🔴 ROJO: Cancelada - MÁXIMA PRIORIDAD
  if (status === 'cancelled') {
    return {
      bgColor: 'bg-gradient-to-br from-red-400 to-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-300',
      label: 'Cancelada'
    };
  }
  
  // ⚫ GRIS: Cliente hizo check-out (finalizada) - ALTA PRIORIDAD
  if (status === 'finalizada') {
    return {
      bgColor: 'bg-gradient-to-br from-gray-400 to-gray-500',
      textColor: 'text-white',
      borderColor: 'border-gray-300',
      label: 'Finalizada'
    };
  }
  
  // 🟠 NARANJA: Cliente en curso (check-in realizado) - ALTA PRIORIDAD
  if (status === 'en_curso') {
    return {
      bgColor: 'bg-gradient-to-br from-orange-400 to-orange-500',
      textColor: 'text-white',
      borderColor: 'border-orange-300',
      label: 'En curso'
    };
  }
  
  // 🟡 AMARILLO: Pre-reserva o reserva pendiente sin abono
  if ((status === 'prereserva' || status === 'pendiente' || status === 'pending') && (paymentStatus === 'no_payment' || paidAmount === 0)) {
    return {
      bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-300',
      label: 'Pre-reserva'
    };
  }
  
  // 🟢 VERDE: Reserva confirmada con abono
  if (status === 'confirmada' || (paymentStatus === 'partial' && paidAmount > 0)) {
    return {
      bgColor: 'bg-gradient-to-br from-green-400 to-green-500',
      textColor: 'text-white', 
      borderColor: 'border-green-300',
      label: 'Confirmada'
    };
  }
  
  // Por defecto: azul claro
  return {
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-500',
    textColor: 'text-white',
    borderColor: 'border-blue-300',
    label: 'Desconocido'
  };
}

/**
 * Obtiene el color para el calendario (versión compacta)
 */
export function getCalendarColor(status: string, paymentStatus: string, paidAmount: number = 0): string {
  const colors = getReservationColor(status, paymentStatus, paidAmount);
  return `${colors.bgColor} ${colors.textColor}`;
}

/**
 * Función de fallback con colores más explícitos
 * PRIORIDAD: Estado de reserva (check-in/check-out) > Estado de pago
 */
export function getCalendarColorExplicit(status: string, paymentStatus: string, paidAmount: number = 0, totalAmount: number = 0): string {
  // 🔴 ROJO: CANCELADA - Máxima prioridad
  if (status === 'cancelled') {
    return 'bg-gradient-to-br from-red-400 to-red-500 text-white';
  }
  
  // 🟠 NARANJA: EN CURSO (CHECK-IN) - Alta prioridad
  if (status === 'en_curso') {
    return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
  }
  
  // ⚫ GRIS: FINALIZADA (CHECK-OUT) - Alta prioridad
  if (status === 'finalizada') {
    return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white';
  }
  
  // 🟡 AMARILLO: PRERESERVA - Cualquier reserva sin abono
  if (paymentStatus === 'no_payment' || paymentStatus === null || paymentStatus === undefined || paidAmount === 0) {
    return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white';
  }
  
  // 🟢 VERDE: PAGADO COMPLETO - Múltiples condiciones para detectar pago completo
  if (paymentStatus === 'paid' || 
      (totalAmount > 0 && paidAmount >= totalAmount) || 
      (paymentStatus === 'partial' && totalAmount > 0 && paidAmount >= totalAmount)) {
    return 'bg-gradient-to-br from-green-400 to-green-500 text-white';
  }
  
  // 🔵 AZUL: PAGO PARCIAL - Reservas con abono parcial (pero no completo)
  if (paymentStatus === 'partial' && paidAmount > 0 && (totalAmount === 0 || paidAmount < totalAmount)) {
    return 'bg-gradient-to-br from-blue-400 to-blue-500 text-white';
  }
  
  // Default: amarillo para cualquier caso sin pago (failsafe)
  return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white';
}

/**
 * Obtiene el color para tarjetas de reserva (versión completa con borde)
 */
export function getCardColor(status: string, paymentStatus: string, paidAmount: number = 0): string {
  const colors = getReservationColor(status, paymentStatus, paidAmount);
  return `${colors.bgColor} ${colors.textColor} ${colors.borderColor}`;
}

/**
 * Lista de todos los estados posibles con sus colores (para leyenda)
 * Ordenada por prioridad: Estado de reserva > Estado de pago
 */
export const RESERVATION_COLOR_LEGEND = [
  // PRIORIDADES ALTAS: Estados de reserva
  {
    status: 'cancelled',
    paymentStatus: 'any', 
    color: 'bg-gradient-to-br from-red-400 to-red-500',
    label: '🔴 Cancelada',
    description: 'Reserva cancelada'
  },
  {
    status: 'en_curso',
    paymentStatus: 'any',
    color: 'bg-gradient-to-br from-orange-400 to-orange-500', 
    label: '🟠 En Curso (Check-In)',
    description: 'Cliente ha llegado y está alojado'
  },
  {
    status: 'finalizada',
    paymentStatus: 'any',
    color: 'bg-gradient-to-br from-gray-400 to-gray-500',
    label: '⚫ Finalizada (Check-Out)',
    description: 'Cliente ha completado su estadía'
  },
  // ESTADOS DE PAGO: Para reservas activas/pendientes
  {
    status: 'any',
    paymentStatus: 'no_payment',
    color: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
    label: '🟡 Prereserva (sin abono)',
    description: 'Reserva sin pago - requiere confirmación'
  },
  {
    status: 'any', 
    paymentStatus: 'partial',
    color: 'bg-gradient-to-br from-blue-400 to-blue-500',
    label: '🔵 Pago Parcial',
    description: 'Reserva con abono parcial (monto < total)'
  },
  {
    status: 'any',
    paymentStatus: 'paid',
    color: 'bg-gradient-to-br from-green-400 to-green-500',
    label: '🟢 Pagado Completo',
    description: 'Reserva totalmente pagada (monto ≥ total)'
  }
]; 