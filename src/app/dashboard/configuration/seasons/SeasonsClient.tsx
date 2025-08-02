'use client';

import { useState } from 'react';
import { Plus, Search, Calendar, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { SeasonConfiguration, SEASON_TYPES } from '@/types/season';
import { getSeasonConfigurations, deleteSeasonConfiguration } from '@/actions/configuration/season-actions';
import PaginationControls from '@/components/shared/PaginationControls';

interface SeasonsClientProps {
  initialSeasons: SeasonConfiguration[];
  initialTotalPages: number;
  initialPage: number;
  initialSearch: string;
}

export default function SeasonsClient({
  initialSeasons,
  initialTotalPages,
  initialPage,
  initialSearch
}: SeasonsClientProps) {
  const [seasons, setSeasons] = useState<SeasonConfiguration[]>(initialSeasons);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<SeasonConfiguration | null>(null);

  // Buscar temporadas
  const handleSearch = async (searchTerm: string, page = 1) => {
    setIsLoading(true);
    try {
      const result = await getSeasonConfigurations(page, 20, searchTerm);
      if (result.success) {
        setSeasons(result.data);
        setTotalPages(result.totalPages);
        setCurrentPage(page);
        setSearch(searchTerm);
      }
    } catch (error) {
      console.error('Error searching seasons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar temporada
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta temporada?')) {
      return;
    }

    try {
      const result = await deleteSeasonConfiguration(id);
      if (result.success) {
        await handleSearch(search, currentPage);
      } else {
        alert('Error al eliminar la temporada');
      }
    } catch (error) {
      console.error('Error deleting season:', error);
      alert('Error al eliminar la temporada');
    }
  };

  // Obtener badge de tipo de temporada
  const getSeasonTypeBadge = (seasonType: 'low' | 'mid' | 'high') => {
    const config = SEASON_TYPES[seasonType];
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      mid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[seasonType]}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Obtener badge de estado
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        ✅ Activa
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        ⏸️ Inactiva
      </span>
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar temporadas..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  const searchTimer = setTimeout(() => handleSearch(e.target.value), 300);
                  return () => clearTimeout(searchTimer);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <Link
            href="/dashboard/configuration/seasons/create"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Nueva Temporada
          </Link>
        </div>
      </div>

      {/* Tabla de temporadas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temporada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo y Ajuste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aplica a
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2 mt-2"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="animate-pulse h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-24"></div>
                    </td>
                  </tr>
                ))
              ) : seasons.length > 0 ? (
                seasons.map((season) => (
                  <tr key={season.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {season.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Prioridad: {season.priority}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(season.start_date)} - {formatDate(season.end_date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.ceil((new Date(season.end_date).getTime() - new Date(season.start_date).getTime()) / (1000 * 3600 * 24) + 1)} días
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getSeasonTypeBadge(season.season_type)}
                        <div className={`text-sm font-medium ${
                          season.discount_percentage > 0 ? 'text-red-600' : 
                          season.discount_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {season.discount_percentage > 0 ? '+' : ''}{season.discount_percentage}%
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {season.applies_to_rooms && (
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            🏨 Habitaciones
                          </div>
                        )}
                        {season.applies_to_programs && (
                          <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            🎯 Programas
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {getStatusBadge(season.is_active)}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSeason(season)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/dashboard/configuration/seasons/edit/${season.id}`}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(season.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="font-medium text-gray-900 mb-2">No hay temporadas</h3>
                      <p className="text-sm">
                        {search ? 'No se encontraron temporadas con el término de búsqueda.' : 'Aún no has creado ninguna temporada.'}
                      </p>
                      {!search && (
                        <Link
                          href="/dashboard/configuration/seasons/create"
                          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus size={16} />
                          Crear primera temporada
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => handleSearch(search, page)}
              itemName="temporadas"
            />
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedSeason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                {selectedSeason.name}
              </h3>
              <button
                onClick={() => setSelectedSeason(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Período</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Inicio: {formatDate(selectedSeason.start_date)}</div>
                    <div>Fin: {formatDate(selectedSeason.end_date)}</div>
                    <div>Duración: {Math.ceil((new Date(selectedSeason.end_date).getTime() - new Date(selectedSeason.start_date).getTime()) / (1000 * 3600 * 24) + 1)} días</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Configuración</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Tipo: {getSeasonTypeBadge(selectedSeason.season_type)}</div>
                    <div>Ajuste: <span className={`font-medium ${
                      selectedSeason.discount_percentage > 0 ? 'text-red-600' : 
                      selectedSeason.discount_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {selectedSeason.discount_percentage > 0 ? '+' : ''}{selectedSeason.discount_percentage}%
                    </span></div>
                    <div>Prioridad: {selectedSeason.priority}</div>
                  </div>
                </div>
              </div>

              {/* Aplicación */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Aplica a</h4>
                <div className="flex gap-2">
                  {selectedSeason.applies_to_rooms && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      🏨 Habitaciones
                    </span>
                  )}
                  {selectedSeason.applies_to_programs && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      🎯 Programas de Alojamiento
                    </span>
                  )}
                </div>
              </div>

              {/* Estado */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estado</h4>
                {getStatusBadge(selectedSeason.is_active)}
              </div>

              {/* Ejemplo de precios */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ejemplo de Precios</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Precio base: $100.000</span>
                    <span className={`font-medium ${
                      selectedSeason.discount_percentage > 0 ? 'text-red-600' : 
                      selectedSeason.discount_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      ${Math.round(100000 * (1 + selectedSeason.discount_percentage / 100)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Precio base: $250.000</span>
                    <span className={`font-medium ${
                      selectedSeason.discount_percentage > 0 ? 'text-red-600' : 
                      selectedSeason.discount_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      ${Math.round(250000 * (1 + selectedSeason.discount_percentage / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 