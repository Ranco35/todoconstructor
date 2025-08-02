import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import ReconciliationClient from './ReconciliationClient';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function ReconciliationPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Verificar que solo administradores y super usuarios puedan acceder
  if (!['SUPER_USER', 'ADMINISTRADOR'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 text-red-400">⛔</span>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Solo administradores y super usuarios pueden acceder a las conciliaciones bancarias.</p>
          <p className="text-sm text-gray-500">Tu rol actual: <span className="font-medium">{currentUser.role}</span></p>
        </div>
      </div>
    );
  }

  return <ReconciliationClient currentUser={currentUser} />;
} 