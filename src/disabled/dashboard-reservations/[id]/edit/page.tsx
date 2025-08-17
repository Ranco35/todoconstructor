import { Suspense } from 'react';
import ReservationEditForm from '@/components/reservations/ReservationEditForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getReservationData(id: string) {
  try {
    // Construir URL absoluta para server-side fetch
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/reservations/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return null;
  }
}

export default async function EditReservationPage({ params }: PageProps) {
  const { id } = await params;
  const reservation = await getReservationData(id);

  if (!reservation) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Editar Reserva #{id}
        </h1>
        
        <Suspense fallback={<div>Cargando formulario...</div>}>
          <ReservationEditForm reservation={reservation} />
        </Suspense>
      </div>
    </div>
  );
} 