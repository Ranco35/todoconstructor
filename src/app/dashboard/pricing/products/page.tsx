import React from 'react';
import ProductPricingManager from '@/components/pricing/ProductPricingManager';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
  }>;
}

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function ProductPricingPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const { page = '1', pageSize = '20', search } = searchParams || {};

  const currentPage = parseInt(Array.isArray(page) ? page[0] : page);
  const currentPageSize = parseInt(Array.isArray(pageSize) ? pageSize[0] : pageSize);
  const searchTerm = Array.isArray(search) ? search[0] : search;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Precios por Producto</h1>
        <p className="mt-2 text-gray-600">
          Configure precios individuales de productos y gestione su rentabilidad
        </p>
      </div>

      <ProductPricingManager 
        initialPage={currentPage}
        initialPageSize={currentPageSize}
        initialSearch={searchTerm}
      />
    </div>
  );
}
