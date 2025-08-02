"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductSearchSimpleProps {
  basePath: string;
}

export function ProductSearchSimple({ basePath }: ProductSearchSimpleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado simple: solo búsqueda
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  
  // Debounce para evitar muchas consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Actualizar URL cuando cambia la búsqueda
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearchTerm.trim()) {
      params.set('search', debouncedSearchTerm);
    }
    
    // Siempre volver a página 1 en nueva búsqueda
    params.set('page', '1');
    
    const newUrl = `${basePath}?${params.toString()}`;
    router.push(newUrl);
  }, [debouncedSearchTerm, router, basePath]);
  
  // Limpiar búsqueda
  const handleClear = () => {
    setSearchTerm('');
    router.push(basePath);
  };
  
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Buscando: <span className="font-medium">&quot;{searchTerm}&quot;</span>
        </div>
      )}
    </div>
  );
} 