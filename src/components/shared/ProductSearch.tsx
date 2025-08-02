'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductSearchProps {
  basePath: string;
  initialValue?: string;
}

export default function ProductSearch({ basePath, initialValue = '' }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Debounce para evitar demasiadas búsquedas
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      } else {
        params.delete('search');
      }
      
      // Resetear a página 1 cuando se busque
      params.set('page', '1');
      
      router.push(`${basePath}?${params.toString()}`);
    }, 500); // 500ms de debounce

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, basePath, router, searchParams]);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar productos por nombre, código o marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Icono de búsqueda */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Botón para limpiar */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Indicador de búsqueda activa */}
      {searchTerm && (
        <div className="mt-2 text-sm text-gray-600">
          Buscando: &quot;<span className="font-medium">{searchTerm}</span>&quot;
        </div>
      )}
    </div>
  );
} 