import { Suspense } from 'react';
import OdooProductsClient from './OdooProductsClient';
import { getOdooProducts, getOdooStats, testOdooConnection } from '@/actions/configuration/odoo-sync';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Componente servidor para obtener datos iniciales
async function OdooProductsServer() {
  // Verificar conexión con Odoo
  const connectionTest = await testOdooConnection();
  
  // Obtener estadísticas si la conexión es exitosa
  let stats = null;
  if (connectionTest.success) {
    const statsResponse = await getOdooStats();
    if (statsResponse.success) {
      stats = statsResponse.stats;
    }
  }

  return (
    <OdooProductsClient 
      connectionStatus={connectionTest}
      initialStats={stats}
    />
  );
}

// Loading component
function OdooProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded mb-2 w-64"></div>
            <div className="h-4 bg-white/10 rounded w-96"></div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function OdooProductsPage() {
  return (
    <Suspense fallback={<OdooProductsLoading />}>
      <OdooProductsServer />
    </Suspense>
  );
} 