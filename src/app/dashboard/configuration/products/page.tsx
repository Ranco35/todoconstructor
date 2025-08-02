import React from 'react';
import Link from 'next/link';
import { getProducts } from '@/actions/products/list';
import ProductTableWithSelection from '@/components/products/ProductTableWithSelection';
import { ProductFiltersInline } from '@/components/products/ProductFiltersInline';
import { ProductExportWithFilters } from '@/components/products/ProductExportWithFilters';
import ProductImportExport from '@/components/products/ProductImportExport';
import PaginationControls from '@/components/shared/PaginationControls';
import CollapsibleSection from '@/components/shared/CollapsibleSection';
import { Plus, FolderOpen, Building2, FileSpreadsheet } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    categoryId?: string;
    warehouseId?: string;
  }>;
}

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const { page = '1', pageSize = '10', search, categoryId, warehouseId } = searchParams || {};

  const currentPage = parseInt(Array.isArray(page) ? page[0] : page);
  const currentPageSize = parseInt(Array.isArray(pageSize) ? pageSize[0] : pageSize);

  const { products, totalCount } = await getProducts({ 
    page: Array.isArray(page) ? page[0] : page, 
    pageSize: Array.isArray(pageSize) ? pageSize[0] : pageSize,
    search: Array.isArray(search) ? search[0] : search,
    categoryId: Array.isArray(categoryId) ? categoryId[0] : categoryId,
    warehouseId: Array.isArray(warehouseId) ? warehouseId[0] : warehouseId
  });

  const totalPages = Math.ceil(totalCount / currentPageSize);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        
        {/* Header con título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestión de Productos</h1>
        </div>

        {/* Sección de Acciones Principales - Colapsable */}
        <div className="mb-6">
          <CollapsibleSection
            title="Acciones Principales"
            icon={<Plus className="w-5 h-5" />}
            defaultExpanded={true}
            className="mb-4"
          >
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/configuration/products/create">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear nuevo producto
                </button>
              </Link>
              
              <Link href="/dashboard/configuration/category">
                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Gestionar categorías
                </button>
              </Link>
              
              <Link href="/dashboard/configuration/inventory/warehouses">
                <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Gestionar bodegas
                </button>
              </Link>
            </div>
          </CollapsibleSection>
        </div>

        {/* Sección de Importación/Exportación - Colapsable */}
        <div className="mb-6">
          <CollapsibleSection
            title="Importación y Exportación"
            icon={<FileSpreadsheet className="w-5 h-5" />}
            defaultExpanded={false}
            className="mb-4"
          >
            <ProductImportExport />
          </CollapsibleSection>
        </div>

        {/* Filtros completos con búsqueda, categorías, bodegas y exportar */}
        <ProductFiltersInline 
          basePath="/dashboard/configuration/products" 
          showExportButton={true}
        />

        {/* Tabla de productos con selección múltiple y filtros integrados */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-5xl mb-4 text-yellow-400">⚠️</span>
            <p className="text-lg font-semibold text-yellow-700 mb-2">No se encontraron productos</p>
            <p className="text-gray-600 text-center max-w-md">
              {search || categoryId || warehouseId ? 
                'No hay productos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.' :
                'Aún no hay productos registrados en el sistema. Crea tu primer producto para comenzar.'
              }
            </p>
            {(search || categoryId || warehouseId) && (
              <Link 
                href="/dashboard/configuration/products"
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Ver todos los productos
              </Link>
            )}
          </div>
        ) : (
          <ProductTableWithSelection 
            products={products}
          />
        )}

        {/* Paginación */}
        {products.length > 0 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={Array.isArray(pageSize) ? pageSize[0] : pageSize}
              totalCount={totalCount}
              currentCount={products.length}
              basePath="/dashboard/configuration/products"
              itemName="productos"
            />
          </div>
        )}

        {/* Información adicional sobre filtros activos */}
        {(search || categoryId || warehouseId) && products.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Mostrando resultados filtrados:</span>
              {' '}{products.length} de {totalCount} productos
              {search && ` • Búsqueda: "${search}"`}
              {categoryId && ` • Categoría seleccionada`}
              {warehouseId && ` • Bodega seleccionada`}
            </p>
            <div className="mt-2 flex items-center gap-4">
              <ProductExportWithFilters className="text-xs" />
              <span className="text-xs text-blue-600">
                ← Exportar solo los productos filtrados
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}