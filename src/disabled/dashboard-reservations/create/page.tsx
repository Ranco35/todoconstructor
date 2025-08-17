import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getRooms, getSpaProducts, getCompanies } from '@/actions/reservations/get';
import { getRealLodgingPrograms } from '@/actions/reservations/real-lodging-programs';
import { redirect } from 'next/navigation';
import CreateReservationClient from './CreateReservationClient';

// Marcar como página dinámica
export const dynamic = 'force-dynamic';

export default async function CreateReservationPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Obtener datos necesarios
  const [rooms, spaProducts, lodgingPrograms, companies] = await Promise.all([
    getRooms(),
    getSpaProducts(),
    getRealLodgingPrograms(),
    getCompanies()
  ]);

  return (
    <CreateReservationClient 
      user={currentUser}
      rooms={rooms}
      spaProducts={spaProducts}
      lodgingPrograms={lodgingPrograms}
      companies={companies}
    />
  );
} 