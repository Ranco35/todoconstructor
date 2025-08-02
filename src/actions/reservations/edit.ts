'use server';

import { updateModularReservation } from '@/actions/products/modular-products';

export async function editReservation(reservationId: number, formData: FormData) {
  try {
    const result = await updateModularReservation(reservationId, formData);
    return result;
  } catch (error) {
    console.error('Error updating reservation:', error);
    return { success: false, error: 'Error al actualizar la reserva' };
  }
} 