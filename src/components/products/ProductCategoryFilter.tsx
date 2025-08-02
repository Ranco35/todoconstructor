'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import CategorySelector from './CategorySelector';

interface ProductCategoryFilterProps {
  basePath: string;
}

export function ProductCategoryFilter({ basePath }: ProductCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      const id = parseInt(categoryId);
      if (!isNaN(id)) {
        setSelectedCategoryId(id);
      }
    } else {
      setSelectedCategoryId(undefined);
    }
  }, [searchParams]);

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
    
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('categoryId', categoryId.toString());
      params.set('page', '1'); // Reset to first page when filtering
    } else {
      params.delete('categoryId');
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleClearFilter = () => {
    setSelectedCategoryId(undefined);
    const params = new URLSearchParams(searchParams);
    params.delete('categoryId');
    router.push(`${basePath}?${params.toString()}`);
  };

  const hasActiveFilter = searchParams.get('categoryId');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por categoría
          </label>
          <CategorySelector
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            placeholder="Seleccionar categoría..."
          />
        </div>
        
        {hasActiveFilter && (
          <div className="flex items-end">
            <Button
              onClick={handleClearFilter}
              variant="outline"
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtro
            </Button>
          </div>
        )}
      </div>
      
      {hasActiveFilter && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filtro activo:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
            Categoría seleccionada
          </span>
          <button
            onClick={handleClearFilter}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Quitar filtro
          </button>
        </div>
      )}
    </div>
  );
} 