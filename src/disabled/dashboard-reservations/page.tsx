import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import ReservationsDashboard from '@/components/reservations/ReservationsDashboard';

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  return <ReservationsDashboard />;
} 