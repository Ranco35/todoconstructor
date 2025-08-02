'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Filter } from 'lucide-react';
import CategorySelector from './CategorySelector';
import WarehouseSelector from './WarehouseSelector';
import { Button } from '@/components/ui/button';
import { ProductExportWithFilters } from './ProductExportWithFilters';

interface ProductFiltersInlineProps {
  basePath: string;
  showExportButton?: boolean;
}

// Clave para localStorage de filtros de productos
const FILTERS_STORAGE_KEY = 'product-filters-state';

export function ProductFiltersInline({ 
  basePath, 
  showExportButton = true 
}: ProductFiltersInlineProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Cargar filtros guardados en localStorage (SOLO categoría y bodega)
const loadSavedFilters = () => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      const parsedFilters = JSON.parse(saved);
      return {
        search: '', // Nunca cargar búsquedas guardadas
        categoryId: parsedFilters.categoryId,
        warehouseId: parsedFilters.warehouseId
      };
    }
  } catch (error) {
    console.warn('Error al cargar filtros guardados:', error);
  }
  return {
    search: '',
    categoryId: null,
    warehouseId: null
  };
};

  // Guardar filtros en localStorage (SOLO categoría y bodega)
const saveFilters = (filters: { search: string; categoryId: number | null; warehouseId: number | null }) => {
  try {
    // Solo guardar categoría y bodega, NO la búsqueda
    const filtersToSave = {
      search: '', // Nunca guardar búsquedas
      categoryId: filters.categoryId,
      warehouseId: filters.warehouseId
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn('Error al guardar filtros:', error);
  }
};

  // Estado inicial: URL > localStorage > vacío
  const savedFilters = loadSavedFilters();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '' // NUNCA desde localStorage
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : savedFilters.categoryId
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    searchParams.get('warehouseId') ? parseInt(searchParams.get('warehouseId')!) : savedFilters.warehouseId
  );

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({ search: searchTerm });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const updateFilters = (newFilters: { search?: string; categoryId?: number | null; warehouseId?: number | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Actualizar parámetros
    if (newFilters.search !== undefined) {
      if (newFilters.search.trim()) {
        params.set('search', newFilters.search.trim());
      } else {
        params.delete('search');
      }
    }
    
    if (newFilters.categoryId !== undefined) {
      if (newFilters.categoryId) {
        params.set('categoryId', newFilters.categoryId.toString());
      } else {
        params.delete('categoryId');
      }
    }
    
    if (newFilters.warehouseId !== undefined) {
      if (newFilters.warehouseId) {
        params.set('warehouseId', newFilters.warehouseId.toString());
      } else {
        params.delete('warehouseId');
      }
    }
    
    // Resetear página cuando cambian los filtros
    params.set('page', '1');
    
    // Guardar filtros actualizados en localStorage (SOLO SI NO ES BÚSQUEDA)
    const currentFilters = {
      search: newFilters.search !== undefined ? newFilters.search : searchTerm,
      categoryId: newFilters.categoryId !== undefined ? newFilters.categoryId : selectedCategoryId,
      warehouseId: newFilters.warehouseId !== undefined ? newFilters.warehouseId : selectedWarehouseId
    };
    
    // NO guardar si solo hay término de búsqueda (para que funcione la búsqueda)
    if (!currentFilters.search) {
      saveFilters(currentFilters);
    }
    
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId || null);
    updateFilters({ categoryId: categoryId || null });
  };

  const handleWarehouseChange = (warehouseId: number | undefined) => {
    setSelectedWarehouseId(warehouseId || null);
    updateFilters({ warehouseId: warehouseId || null });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    updateFilters({ search: '' });
  };

  const handleClearCategory = () => {
    setSelectedCategoryId(null);
    updateFilters({ categoryId: null });
  };

  const handleClearWarehouse = () => {
    setSelectedWarehouseId(null);
    updateFilters({ warehouseId: null });
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId(null);
    setSelectedWarehouseId(null);
    // Limpiar localStorage también
    localStorage.removeItem(FILTERS_STORAGE_KEY);
    // Limpiar completamente la URL de todos los parámetros
    router.push(basePath);
  };

  // LIMPIEZA AUTOMÁTICA DESHABILITADA - PERMITIR FILTROS NORMALES

  const hasActiveFilters = searchTerm.trim() || selectedCategoryId || selectedWarehouseId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Alerta de filtros persistentes */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Hay filtros activos aplicados que pueden estar limitando los resultados
              </span>
            </div>
            <button
              onClick={handleClearAllFilters}
              className="text-xs bg-amber-600 text-white px-3 py-1 rounded-md hover:bg-amber-700 transition-colors"
            >
              Ver todos los productos
            </button>
          </div>
        </div>
      )}
      
      {/* Línea principal de filtros */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        
        {/* Buscador por nombre */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos por nombre, SKU, código o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            
            {/* Icono de búsqueda */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            {/* Botón para limpiar búsqueda */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Selector de categoría */}
        <div className="w-full lg:w-64">
          <CategorySelector
            value={selectedCategoryId || undefined}
            onChange={handleCategoryChange}
            placeholder="Filtrar por categoría..."
          />
        </div>

        {/* Selector de bodega */}
        <div className="w-full lg:w-64">
          <WarehouseSelector
            value={selectedWarehouseId || undefined}
            onChange={handleWarehouseChange}
            placeholder="Filtrar por bodega..."
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Botón de exportar */}
          {showExportButton && (
            <ProductExportWithFilters />
          )}

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearAllFilters}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-800 border-red-300 hover:border-red-400 relative"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                !
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Indicadores de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600">Filtros activos:</span>
          
          {searchTerm.trim() && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
              <span>Búsqueda: "{searchTerm.trim()}"</span>
              <button
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedCategoryId && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md">
              <span>Categoría seleccionada</span>
              <button
                onClick={handleClearCategory}
                className="text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedWarehouseId && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
              <span>Bodega seleccionada</span>
              <button
                onClick={handleClearWarehouse}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 