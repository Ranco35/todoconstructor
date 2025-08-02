'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierRank, COUNTRIES, SUPPLIER_CATEGORIES, RANK_BADGES } from '@/constants/supplier';

interface SupplierFilterProps {
  currentFilters: {
    search?: string;
    countryCode?: string;
    supplierRank?: SupplierRank;
    active?: boolean;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export default function SupplierFilter({ currentFilters }: SupplierFilterProps) {
  const router = useRouter();
  
  const [filters, setFilters] = useState({
    search: currentFilters.search || '',
    countryCode: currentFilters.countryCode || '',
    supplierRank: currentFilters.supplierRank || '',
    active: currentFilters.active !== undefined ? currentFilters.active.toString() : '',
    category: currentFilters.category || '',
    sortBy: currentFilters.sortBy || 'name',
    sortOrder: currentFilters.sortOrder || 'asc',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Actualizar filtros cuando cambien los searchParams
  useEffect(() => {
    setFilters({
      search: currentFilters.search || '',
      countryCode: currentFilters.countryCode || '',
      supplierRank: currentFilters.supplierRank || '',
      active: currentFilters.active !== undefined ? currentFilters.active.toString() : '',
      category: currentFilters.category || '',
      sortBy: currentFilters.sortBy || 'name',
      sortOrder: currentFilters.sortOrder || 'asc',
    });
  }, [currentFilters]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // Agregar filtros no vacíos
    if (filters.search) params.set('search', filters.search);
    if (filters.countryCode) params.set('countryCode', filters.countryCode);
    if (filters.supplierRank) params.set('supplierRank', filters.supplierRank);
    if (filters.active) params.set('active', filters.active);
    if (filters.category) params.set('category', filters.category);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    
    // Resetear a página 1 cuando se aplican filtros
    params.set('page', '1');
    
    router.push(`/dashboard/suppliers?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      countryCode: '',
      supplierRank: '',
      active: '',
      category: '',
      sortBy: 'name',
      sortOrder: 'asc',
    });
    router.push('/dashboard/suppliers');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'name' && value !== 'asc'
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'} filtros avanzados
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Búsqueda */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Nombre, RUT, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* País */}
          <div>
            <label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <select
              id="countryCode"
              value={filters.countryCode}
              onChange={(e) => setFilters({ ...filters, countryCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los países</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="active"
              value={filters.active}
              onChange={(e) => setFilters({ ...filters, active: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Filtros avanzados */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
            {/* Ranking */}
            <div>
              <label htmlFor="supplierRank" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de proveedor
              </label>
              <select
                id="supplierRank"
                value={filters.supplierRank}
                onChange={(e) => setFilters({ ...filters, supplierRank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(RANK_BADGES).filter(([rank]) => rank !== 'PART_TIME').map(([rank, config]) => (
                  <option key={rank} value={rank}>
                    {config.label} ({config.points})
                  </option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {SUPPLIER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenamiento */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <div className="flex space-x-2">
                <select
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Nombre</option>
                  <option value="rankPoints">Puntos</option>
                  <option value="createdAt">Fecha de creación</option>
                                      <option value="supplierRank">Tipo de proveedor</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Aplicar Filtros
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Indicador de filtros activos */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              <div className="flex flex-wrap gap-1">
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Búsqueda: {filters.search}
                  </span>
                )}
                {filters.countryCode && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    País: {COUNTRIES.find(c => c.code === filters.countryCode)?.name}
                  </span>
                )}
                {filters.supplierRank && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Tipo: {RANK_BADGES[filters.supplierRank as keyof typeof RANK_BADGES]?.label.split(' ')[1]}
                  </span>
                )}
                {filters.active && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Estado: {filters.active === 'true' ? 'Activos' : 'Inactivos'}
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Categoría: {filters.category}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 