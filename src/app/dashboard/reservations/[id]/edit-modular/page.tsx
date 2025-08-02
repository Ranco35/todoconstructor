import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getReservationById } from '@/actions/reservations/get';
import { redirect } from 'next/navigation';
import ModularReservationForm from '@/components/reservations/ModularReservationForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getReservationData(id: string) {
  try {
    const reservationId = parseInt(id);
    if (!reservationId || isNaN(reservationId)) {
      return null;
    }

    // Obtener datos completos de la reserva incluyendo modular_reservations
    const reservation = await getReservationById(reservationId);
    
    if (!reservation) {
      return null;
    }

    // Verificar que tiene datos modulares
    if (!reservation.modular_reservation || reservation.modular_reservation.length === 0) {
      console.error('Reserva no tiene datos modulares:', reservationId);
      return null;
    }

    return reservation;
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return null;
  }
}

export default async function EditModularReservationPage({ params }: PageProps) {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const { id } = await params;
  const reservation = await getReservationData(id);

  if (!reservation) {
    notFound();
  }

  // Mapear datos para el formulario modular
  const modularReservation = reservation.modular_reservation[0]; // Tomar el primer elemento del array
  
  const initialData = {
    id: reservation.id,
    guest_name: reservation.guest_name,
    email: reservation.guest_email,
    phone: reservation.guest_phone,
    check_in: reservation.check_in,
    check_out: reservation.check_out,
    adults: modularReservation.adults || 1,
    children: modularReservation.children || 0,
    children_ages: modularReservation.children_ages || [],
    package_code: modularReservation.package_code,
    room_code: modularReservation.room_code,
    additional_products: modularReservation.additional_products || [],
    comments: reservation.comments || '',
    client_id: reservation.client_id,
    client: reservation.client,
    // Campos de descuento
    discount_type: reservation.discount_type || 'none',
    discount_value: parseFloat(reservation.discount_value?.toString() || '0'),
    discount_reason: reservation.discount_reason || '',
    // Campos de recargo
    surcharge_type: reservation.surcharge_type || 'none',
    surcharge_value: parseFloat(reservation.surcharge_value?.toString() || '0'),
    surcharge_reason: reservation.surcharge_reason || '',
    // Datos modulares para precios congelados
    modular_reservation: {
      grand_total: modularReservation.grand_total,
      discount_amount: modularReservation.discount_amount,
      surcharge_amount: modularReservation.surcharge_amount,
      final_price: modularReservation.final_price
    }
  };

  console.log('🎯 Datos iniciales para edición:', {
    reservationId: reservation.id,
    grand_total: modularReservation.grand_total,
    discount_amount: modularReservation.discount_amount,
    final_price: modularReservation.final_price
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Editar Reserva Modular #{id}
          </h1>
          <p className="text-gray-600">
            Editando reserva de {reservation.guest_name} - {modularReservation.package_code}
          </p>
          <div className="mt-2 flex gap-4 text-sm text-gray-500">
            <span>📦 Paquete: {modularReservation.package_code}</span>
            <span>🏨 Habitación: {modularReservation.room_code}</span>
            <span>💰 Total BD: ${parseFloat(modularReservation.grand_total?.toString() || '0').toLocaleString('es-CL')}</span>
          </div>
        </div>
        
        <Suspense fallback={<div>Cargando formulario de edición...</div>}>
          <ModularReservationForm
            isEditMode={true}
            initialData={initialData}
            reservationId={parseInt(id)}
          />
        </Suspense>
      </div>
    </div>
  );
} 