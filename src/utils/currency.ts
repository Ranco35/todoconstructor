/**
 * Calcula el monto total de una reserva de manera consistente
 * CORREGIDO: Usa total_amount como fuente oficial (incluye descuentos/recargos aplicados)
 */
export function calculateReservationTotalAmount(reservation: any): number {
  if (!reservation) return 0;
  
  // 🎯 CORREGIDO: Priorizar total_amount que es el valor oficial con descuentos aplicados
  if (reservation.total_amount) {
    return parseFloat(reservation.total_amount.toString());
  }
  
  // Fallback para reservas modulares si no hay total_amount
  if (reservation.modular_reservation?.final_price) {
    return parseFloat(reservation.modular_reservation.final_price.toString());
  }
  
  // Fallback a grand_total (sin descuentos)
  if (reservation.modular_reservation?.grand_total) {
    return parseFloat(reservation.modular_reservation.grand_total.toString());
  }
  
  return 0;
}

/**
 * Formatea un monto como moneda chilena
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats a number as currency without the currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parses a currency string back to number
 * @param currencyString - The formatted currency string
 * @returns The numeric value
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces, then parse
  const cleanString = currencyString.replace(/[^\d,-]/g, '').replace(',', '.')
  return parseFloat(cleanString) || 0
} 