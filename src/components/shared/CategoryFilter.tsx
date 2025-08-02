'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface CategoryFilterProps {
  basePath: string;
}

export function CategoryFilter({ basePath }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
      params.set('page', '1'); // Reset to first page when searching
    } else {
      params.delete('search');
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasActiveFilter = searchParams.get('search');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Buscar categorías
          </label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>
        
        <div className="flex items-end gap-2">
          <Button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          
          {hasActiveFilter && (
            <Button
              onClick={handleClearSearch}
              variant="outline"
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
      
      {hasActiveFilter && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span>Filtro activo:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
            "{searchParams.get('search')}"
          </span>
          <button
            onClick={handleClearSearch}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Quitar filtro
          </button>
        </div>
      )}
    </div>
  );
} 