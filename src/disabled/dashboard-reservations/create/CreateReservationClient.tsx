'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModularReservationForm from '@/components/reservations/ModularReservationForm';

interface CreateReservationClientProps {
  user: any;
  rooms: any[];
  spaProducts: any[];
  lodgingPrograms: RealLodgingProgram[];
  companies: any[];
}

export default function CreateReservationClient({ user, rooms, spaProducts, lodgingPrograms, companies }: CreateReservationClientProps) {
  const handleSuccess = (reservation: any) => {
    // Redirigir al listado de reservas después de crear
    window.location.href = '/dashboard/reservations/list';
  };

  const handleClose = () => {
    // Volver al dashboard si se cierra el modal
    window.location.href = '/dashboard/reservations';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Reserva</h1>
          <p className="text-gray-600">Crear una nueva reserva en el sistema</p>
        </div>
        <Link
          href="/dashboard/reservations"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Formulario de creación de reserva */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ModularReservationForm
          isEditMode={false}
          onCancel={handleClose}
        />
      </div>
    </div>
  );
} 