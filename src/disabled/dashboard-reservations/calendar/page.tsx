import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getRooms, getSpaProducts, getCompanies } from '@/actions/reservations/get';
import { getRealLodgingPrograms } from '@/actions/reservations/real-lodging-programs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReservationCalendar from '@/components/reservations/ReservationCalendar';

// Línea eliminada: export const dynamic = 'force-dynamic';

export default async function ReservationsCalendarPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Obtener datos
  const [rooms, spaProducts, lodgingPrograms, companies] = await Promise.all([
    getRooms(),
    getSpaProducts(),
    getRealLodgingPrograms(),
    getCompanies()
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Reservas</h1>
          <p className="text-gray-600">Vista completa del calendario de reservaciones</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reservations"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Volver al Dashboard
          </Link>
          <Link
            href="/dashboard/reservations/nueva"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nueva Reserva
          </Link>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <ReservationCalendar
          initialReservations={[]}
          rooms={rooms}
          spaProducts={spaProducts}
          lodgingPrograms={lodgingPrograms}
          companies={companies}
        />
      </div>
    </div>
  );
} 