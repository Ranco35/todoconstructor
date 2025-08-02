// 🎯 UTILIDADES PARA IDs COMPUESTOS DE RESERVAS
// Solución definitiva para eliminar confusión entre reservation_id y modular_id

/**
 * Crea un ID compuesto único para reservas
 * @param reservationId ID de la tabla reservations (principal)
 * @param modularId ID de la tabla modular_reservations
 * @returns String formato "R{reservationID}-M{modularID}"
 */
export function createCompositeReservationId(reservationId: number, modularId: number): string {
  return `R${reservationId}-M${modularId}`;
}

/**
 * Parsea un ID compuesto de reserva
 * @param compositeId String formato "R{reservationID}-M{modularID}"
 * @returns Objeto con reservationId y modularId separados
 * @throws Error si el formato es inválido
 */
export function parseCompositeReservationId(compositeId: string): {
  reservationId: number;
  modularId: number;
} {
  const match = compositeId.match(/^R(\d+)-M(\d+)$/);
  if (!match) {
    throw new Error(`Formato de ID compuesto inválido: ${compositeId}. Use formato R{id}-M{id}`);
  }
  
  return {
    reservationId: parseInt(match[1], 10),
    modularId: parseInt(match[2], 10)
  };
}

/**
 * Verifica si un string es un ID compuesto válido
 * @param id String a verificar
 * @returns true si es formato válido, false si no
 */
export function isCompositeReservationId(id: string | number): boolean {
  if (typeof id === 'number') return false;
  return /^R\d+-M\d+$/.test(id);
}

/**
 * Convierte un ID simple a compuesto (para compatibilidad temporal)
 * @param id ID simple (número)
 * @param isModular true si el ID es modular, false si es principal
 * @returns ID compuesto o lanza error si falta información
 */
export function convertSimpleToCompositeId(id: number, isModular: boolean = false): string {
  if (isModular) {
    // Si es ID modular, necesitamos buscar el reservation_id correspondiente
    throw new Error(`No se puede convertir ID modular ${id} sin reservation_id. Use createCompositeReservationId()`);
  } else {
    // Si es ID principal, necesitamos buscar el modular_id correspondiente
    throw new Error(`No se puede convertir ID principal ${id} sin modular_id. Use createCompositeReservationId()`);
  }
}

/**
 * Helper para logging más claro en debugging
 * @param compositeId ID compuesto
 * @returns String descriptivo para logs
 */
export function formatReservationIdForLog(compositeId: string): string {
  try {
    const { reservationId, modularId } = parseCompositeReservationId(compositeId);
    return `Reserva Principal: ${reservationId}, Modular: ${modularId}`;
  } catch {
    return `ID inválido: ${compositeId}`;
  }
} 

// Tipos para los descuentos y recargos
export interface DiscountInfo {
  discount_type?: 'none' | 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount?: number;
}

export interface SurchargeInfo {
  surcharge_type?: 'none' | 'percentage' | 'fixed_amount';
  surcharge_value?: number;
  surcharge_amount?: number;
}

export interface ReservationFinancials extends DiscountInfo, SurchargeInfo {
  total_amount: number;
}

/**
 * Calcula el total final de una reserva considerando descuentos y recargos
 */
export function calculateFinalAmount(reservation: ReservationFinancials): number {
  const baseAmount = reservation.total_amount || 0;
  const discount = reservation.discount_amount || 0;
  const surcharge = reservation.surcharge_amount || 0;
  
  return Math.max(0, baseAmount - discount + surcharge);
}

/**
 * Calcula el monto del descuento basado en el tipo y valor
 */
export function calculateDiscountAmount(
  baseAmount: number,
  discountType: string,
  discountValue: number
): number {
  if (discountType === 'percentage') {
    return Math.round(baseAmount * (discountValue / 100));
  } else if (discountType === 'fixed_amount') {
    return Math.min(discountValue, baseAmount);
  }
  return 0;
}

/**
 * Calcula el monto del recargo basado en el tipo y valor
 */
export function calculateSurchargeAmount(
  baseAmount: number,
  surchargeType: string,
  surchargeValue: number
): number {
  if (surchargeType === 'percentage') {
    return Math.round(baseAmount * (surchargeValue / 100));
  } else if (surchargeType === 'fixed_amount') {
    return surchargeValue;
  }
  return 0;
}

/**
 * Obtiene información detallada de descuentos y recargos para mostrar en UI
 */
export function getFinancialBreakdown(reservation: ReservationFinancials) {
  const baseAmount = reservation.total_amount || 0;
  const discountAmount = reservation.discount_amount || 0;
  const surchargeAmount = reservation.surcharge_amount || 0;
  const finalAmount = calculateFinalAmount(reservation);

  return {
    baseAmount,
    discountAmount,
    surchargeAmount,
    finalAmount,
    hasDiscount: discountAmount > 0,
    hasSurcharge: surchargeAmount > 0,
    hasFinancialAdjustments: discountAmount > 0 || surchargeAmount > 0
  };
}

/**
 * Formatea montos en formato chileno
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
} 