'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: string;
  totalCount: number;
  currentCount: number;
  basePath: string;
  itemName?: string; // Nombre del item (ej: "productos", "categorías", "clientes")
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  currentCount,
  basePath,
  itemName = "elementos"
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createURL = (page: number, newPageSize?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (newPageSize) {
      params.set('pageSize', newPageSize);
    }
    return `${basePath}?${params.toString()}`;
  };

  const handlePageSizeChange = (newPageSize: string) => {
    router.push(createURL(1, newPageSize));
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
      <div className="text-sm text-gray-700">
        Mostrando {currentCount} de {totalCount} {itemName}.
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Selector de elementos por página */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            {itemName.charAt(0).toUpperCase() + itemName.slice(1)} por página:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center gap-2">
          <Link href={createURL(Math.max(1, currentPage - 1))}>
            <button
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={currentPage <= 1}
            >
              Anterior
            </button>
          </Link>
          
          <span className="text-sm text-gray-700 px-2">
            Página {currentPage} de {totalPages}
          </span>
          
          <Link href={createURL(Math.min(totalPages, currentPage + 1))}>
            <button
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={currentPage >= totalPages}
            >
              Siguiente
            </button>
          </Link>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500">
          {totalPages > 1 && (
            <span>Total: {totalPages} páginas</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaginationControls; 