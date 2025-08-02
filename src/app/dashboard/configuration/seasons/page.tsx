import { Suspense } from 'react';
import { getSeasonConfigurations } from '@/actions/configuration/season-actions';
import SeasonsClient from './SeasonsClient';
import { Calendar, Plus, TrendingUp } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function SeasonsPage() {
  // Cargar temporadas en el server
  const result = await getSeasonConfigurations(1, 20, '');
  const seasons = result.success ? result.data : [];
  const totalPages = result.success ? result.totalPages : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={32} className="text-purple-200" />
            <div>
              <h1 className="text-2xl font-bold">Gestión de Temporadas</h1>
              <p className="text-purple-100">
                Configura precios dinámicos por fechas para habitaciones y programas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-purple-200">Total Temporadas</div>
              <div className="text-2xl font-bold">{result.count || 0}</div>
            </div>
            <TrendingUp size={28} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-800">Temporadas Altas</span>
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {seasons.filter(s => s.season_type === 'high').length}
          </div>
          <p className="text-sm text-red-600">Incremento de precios</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-800">Temporadas Medias</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {seasons.filter(s => s.season_type === 'mid').length}
          </div>
          <p className="text-sm text-yellow-600">Precio base</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-800">Temporadas Bajas</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {seasons.filter(s => s.season_type === 'low').length}
          </div>
          <p className="text-sm text-green-600">Descuentos</p>
        </div>
      </div>

      {/* Cliente de temporadas */}
      <Suspense fallback={
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <SeasonsClient
          initialSeasons={seasons}
          initialTotalPages={totalPages}
          initialPage={1}
          initialSearch={''}
        />
      </Suspense>
    </div>
  );
} 