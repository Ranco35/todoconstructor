import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import AdminPettyCashTransactions from '@/components/petty-cash/AdminPettyCashTransactions';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminPettyCashPage() {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }

    // Verificar si el usuario es administrador
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
      redirect('/dashboard');
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  🛡️
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo - Caja Chica</h1>
                  <p className="text-gray-600 mt-1">Vista completa de transacciones con filtros avanzados</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 rounded-xl border border-purple-200">
                  <p className="text-sm font-medium text-purple-700">Administrador</p>
                  <p className="text-xs text-purple-600">{currentUser.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Component principal */}
          <AdminPettyCashTransactions currentUser={currentUser} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading admin petty cash page:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error al cargar el panel administrativo
            </h2>
            <p className="text-red-600">
              No se pudieron cargar los datos. Por favor, intenta de nuevo.
            </p>
          </div>
        </div>
      </div>
    );
  }
} 