/**
 * Obtener el siguiente estado lógico para una reserva
 * @param currentStatus Estado actual
 * @param paymentStatus Estado de pago actual
 * @returns Siguiente estado sugerido
 */
export function getNextLogicalStatus(
  currentStatus: string, 
  paymentStatus: string
): { status: string; label: string; action: string } | null {
  
  switch (currentStatus) {
    case 'prereserva':
      if (paymentStatus === 'no_payment') {
        return { status: 'confirmada', label: 'Confirmar con abono', action: 'confirm' };
      }
      break;
    
    case 'confirmada':
      return { status: 'en_curso', label: 'Realizar Check-in', action: 'checkin' };
    
    case 'en_curso':
      return { status: 'finalizada', label: 'Realizar Check-out', action: 'checkout' };
    
    case 'finalizada':
      return null; // No hay siguiente estado
    
    case 'cancelled':
      return null; // No hay siguiente estado
  }
  
  return null;
}

/**
 * Obtener el color CSS para un estado de reserva
 * @param status Estado de la reserva
 * @returns Color CSS correspondiente
 */
export function getReservationStatusColor(status: string): string {
  switch (status) {
    case 'prereserva':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmada':
      return 'bg-blue-100 text-blue-800';
    case 'en_curso':
      return 'bg-green-100 text-green-800';
    case 'finalizada':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Obtener el label de estado en español
 * @param status Estado de la reserva
 * @returns Label en español
 */
export function getReservationStatusLabel(status: string): string {
  switch (status) {
    case 'prereserva':
      return 'Pre-reserva';
    case 'confirmada':
      return 'Confirmada';
    case 'en_curso':
      return 'En curso';
    case 'finalizada':
      return 'Finalizada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
} 

const STATUS_MAP = [
  {
    keys: ['prereserva', 'pending', 'pendiente', 'prereserved'],
    label: 'Pre-Reserva',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  {
    keys: ['confirmada', 'confirmed', 'reservada', 'reserved'],
    label: 'Reservada',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  {
    keys: ['en_curso', 'checkin', 'check-in'],
    label: 'Check-In',
    color: 'bg-orange-100 text-orange-800',
    icon: '🏨'
  },
  {
    keys: ['finalizada', 'checkout', 'check-out'],
    label: 'Check-Out',
    color: 'bg-gray-100 text-gray-800',
    icon: '🏁'
  },
  {
    keys: ['cancelada', 'cancelled', 'canceled'],
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  }
];

export function getReservationStatusBadge(status: string) {
  const found = STATUS_MAP.find(s => s.keys.includes(status));
  if (found) return { label: found.icon + ' ' + found.label, color: found.color, icon: found.icon };
  return { label: status, color: 'bg-gray-100 text-gray-800', icon: '' };
} 