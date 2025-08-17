import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import ReservationsList from '@/components/reservations/ReservationsList';

export const dynamic = 'force-dynamic';

export default async function ReservationsListPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  return <ReservationsList />;
} 