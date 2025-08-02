'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, DollarSign, Package, TrendingUp, BarChart3 } from 'lucide-react';
import { 
  getProgramasAlojamiento, 
  getProgramasAlojamientoStats,
  deleteProgramaAlojamiento,
  type ProgramaAlojamiento,
  type ProgramaAlojamientoFilters,
  type ProgramaAlojamientoStats
} from '@/actions/configuration/programas-alojamiento';
import ProgramaAlojamientoForm from './ProgramaAlojamientoForm';

export default function ProgramasAlojamientoManager() {
  const [programas, setProgramas] = useState<ProgramaAlojamiento[]>([]);
  const [stats, setStats] = useState<ProgramaAlojamientoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [filters, setFilters] = useState<ProgramaAlojamientoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para modal/formulario
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramaAlojamiento | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramaAlojamiento | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Aplicar filtros con debounce
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, minPrice, maxPrice]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [programasResult, statsResult] = await Promise.all([
        getProgramasAlojamiento(),
        getProgramasAlojamientoStats()
      ]);

      if (programasResult.error) {
        setError(programasResult.error);
      } else {
        setProgramas(programasResult.data);
      }

      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    const newFilters: ProgramaAlojamientoFilters = {};
    
    if (searchTerm.trim()) {
      newFilters.search = searchTerm.trim();
    }
    
    if (minPrice && !isNaN(Number(minPrice))) {
      newFilters.minPrice = Number(minPrice);
    }
    
    if (maxPrice && !isNaN(Number(maxPrice))) {
      newFilters.maxPrice = Number(maxPrice);
    }

    setFilters(newFilters);
    
    try {
      const result = await getProgramasAlojamiento(newFilters);
      if (result.error) {
        setError(result.error);
      } else {
        setProgramas(result.data);
      }
    } catch (err) {
      setError('Error al aplicar filtros');
      console.error('Error applying filters:', err);
    }
  };

  const handleEdit = (programa: ProgramaAlojamiento) => {
    setEditingProgram(programa);
    setShowForm(true);
  };

  const handleDelete = (programa: ProgramaAlojamiento) => {
    setProgramToDelete(programa);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!programToDelete) return;

    try {
      const result = await deleteProgramaAlojamiento(programToDelete.id);
      if (result.success) {
        await loadData(); // Recargar datos
        setShowDeleteModal(false);
        setProgramToDelete(null);
      } else {
        setError(result.error || 'Error al eliminar programa');
      }
    } catch (err) {
      setError('Error al eliminar programa');
      console.error('Error deleting program:', err);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProgram(null);
    loadData(); // Recargar datos
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setFilters({});
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando programas de alojamiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Programas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programas Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${Math.round(stats.avgPrice).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rango de Precios</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${stats.minPrice.toLocaleString()} - ${stats.maxPrice.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Acciones */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar programas por nombre, descripción o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              Filtros
            </button>
            
            <button
              onClick={() => {
                setEditingProgram(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Nuevo Programa
            </button>
          </div>
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Mínimo
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Máximo
                </label>
                <input
                  type="number"
                  placeholder="999999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Programas */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Programas de Alojamiento ({programas.length})
          </h3>
        </div>
        
        {programas.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay programas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.keys(filters).length > 0 
                ? 'No se encontraron programas que coincidan con los filtros.'
                : 'Comienza creando tu primer programa de alojamiento.'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setEditingProgram(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Nuevo Programa
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {programas.map((programa) => (
                  <tr key={programa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {programa.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{programa.name}</div>
                          <div className="text-sm text-gray-500">{programa.brand || 'Sin marca'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {programa.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {programa.saleprice ? `$${programa.saleprice.toLocaleString()}` : 'Sin precio'}
                      </div>
                      {programa.costprice && (
                        <div className="text-sm text-gray-500">
                          Costo: ${programa.costprice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">
                        {programa.sku || 'Sin SKU'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(programa)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Editar programa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(programa)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Eliminar programa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <ProgramaAlojamientoForm
          programa={editingProgram}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingProgram(null);
          }}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && programToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el programa "{programToDelete.name}"? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProgramToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 