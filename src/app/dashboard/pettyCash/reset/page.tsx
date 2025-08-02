import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import ResetCashSessionPage from '@/components/petty-cash/ResetCashSessionPage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ResetPage() {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }

    // Solo administradores y super usuarios pueden hacer reset
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
      throw new Error('No tienes permisos para acceder a esta sección');
    }

    return <ResetCashSessionPage currentUser={currentUser} />;
  } catch (error) {
    console.error('Error loading reset page:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error de Acceso
            </h2>
            <p className="text-red-600">
              No tienes permisos para acceder a esta sección de reset.
            </p>
          </div>
        </div>
      </div>
    );
  }
} 