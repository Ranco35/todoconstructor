import React from 'react';
import { getProductsByWarehouse, getWarehouseById } from "@/actions/configuration/warehouse-actions";
import { PaginationParams } from "@/interface/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building, Package, Search, Filter } from 'lucide-react';
import WarehouseProductManager from '@/components/inventory/WarehouseProductManager';
import PaginationControls from '@/components/shared/PaginationControls';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<PaginationParams & { search?: string; stockFilter?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ManageWarehouseProductsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const warehouseId = parseInt(params.id);
  
  if (isNaN(warehouseId)) {
    notFound();
  }

  const warehouse = await getWarehouseById(warehouseId);
  
  if (!warehouse) {
    notFound();
  }

  const { page = '1', pageSize = '20', search = '', stockFilter = 'all' } = searchParams || {};
  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));

  const { data: warehouseProducts, totalCount } = await getProductsByWarehouse(warehouseId, { 
    page: currentPage, 
    pageSize: currentPageSize,
    search: String(search),
    stockFilter: String(stockFilter) as 'all' | 'withStock' | 'withoutStock' | 'negative'
  });

  const totalPages = Math.ceil(totalCount / currentPageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky con navegación */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/configuration/inventory/warehouses/${warehouseId}/products`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div className="border-l border-gray-300 h-6"></div>
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestionar Productos</h1>
                <p className="text-sm text-gray-600">{warehouse.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
                <div className="text-sm text-gray-600">Total Productos</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {warehouseProducts.filter(wp => wp.quantity > 0).length}
                </div>
                <div className="text-sm text-gray-600">Con Stock</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {warehouseProducts.filter(wp => wp.quantity === 0).length}
                </div>
                <div className="text-sm text-gray-600">Sin Stock</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {warehouseProducts.filter(wp => wp.quantity > 0 && wp.quantity < wp.minStock).length}
                </div>
                <div className="text-sm text-gray-600">Stock Bajo</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda por texto */}
              <div className="md:col-span-2">
                <Label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar productos
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    id="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Buscar por nombre, SKU, categoría..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filtro de stock */}
              <div>
                <Label htmlFor="stockFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de Stock
                </Label>
                <select 
                  name="stockFilter" 
                  id="stockFilter"
                  defaultValue={stockFilter}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="withStock">Con Stock</option>
                  <option value="withoutStock">Sin Stock</option>
                  <option value="negative">Stock Negativo</option>
                </select>
              </div>
              
              {/* Productos por página */}
              <div>
                <Label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Por página
                </Label>
                <select 
                  name="pageSize" 
                  id="pageSize"
                  defaultValue={currentPageSize}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              
              {/* Botones de acción */}
              <div className="md:col-span-4 flex gap-3">
                <Button type="submit" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Aplicar Filtros
                </Button>
                
                {(search || stockFilter !== 'all') && (
                  <Link href={`/dashboard/configuration/inventory/warehouses/${warehouseId}/products/manage`}>
                    <Button variant="outline" type="button">
                      Limpiar Filtros
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Componente de gestión de productos */}
        <WarehouseProductManager
          warehouseId={warehouseId}
          warehouseName={warehouse.name}
          assignedProducts={warehouseProducts}
          totalProducts={totalCount}
        />

        {/* Paginación */}
        {totalCount > 0 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={String(currentPageSize)}
              totalCount={totalCount}
              currentCount={warehouseProducts.length}
              basePath={`/dashboard/configuration/inventory/warehouses/${warehouseId}/products/manage`}
              itemName="productos"
            />
          </div>
        )}
      </div>
    </div>
  );
}

