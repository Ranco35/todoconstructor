import React from 'react';
import { getProductsByWarehouse, getWarehouseById } from "@/actions/configuration/warehouse-actions";
import { PaginationParams } from "@/interface/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Package, Search } from 'lucide-react';
import WarehouseProductManager from '@/components/inventory/WarehouseProductManager';
import PaginationControls from '@/components/shared/PaginationControls';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<PaginationParams & { search?: string; stockFilter?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function WarehouseProductsPage(props: PageProps) {
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

  const { page = '1', pageSize = '10', search = '', stockFilter = 'all' } = searchParams || {};
  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));

  const { data: warehouseProducts, totalCount } = await getProductsByWarehouse(warehouseId, { 
    page: currentPage, 
    pageSize: currentPageSize,
    search: String(search),
    stockFilter: String(stockFilter) as 'all' | 'withStock' | 'withoutStock' | 'negative'
  });

  const { data: allProducts } = await getProductsByWarehouse(warehouseId, { page: 1, pageSize: 1000 });

  const totalPages = Math.ceil(totalCount / currentPageSize);

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity < 0) return { status: 'Stock Negativo', color: 'bg-red-200 text-red-900' };
    if (quantity === 0) return { status: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    if (quantity < minStock) return { status: 'Stock Bajo', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Stock OK', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            {warehouse.name}
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {warehouse.location}
          </p>
        </div>
        <Link 
          href="/dashboard/configuration/inventory/warehouses"
          className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          ← Volver a bodegas
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Información de la Bodega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allProducts.length}</div>
              <div className="text-sm text-gray-600">Productos asignados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allProducts.filter(wp => wp.quantity > 0).length}
              </div>
              <div className="text-sm text-gray-600">Con stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {allProducts.filter(wp => wp.quantity === 0).length}
              </div>
              <div className="text-sm text-gray-600">Sin stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {allProducts.filter(wp => wp.quantity < 0).length}
              </div>
              <div className="text-sm text-gray-600">Stock negativo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {allProducts.filter(wp => wp.quantity > 0 && wp.quantity < wp.minStock).length}
              </div>
              <div className="text-sm text-gray-600">Stock bajo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar productos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  id="search"
                  name="search"
                  defaultValue={search}
                  placeholder="Buscar por nombre, SKU, categoría..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="stockFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filtro de Stock
              </label>
              <select 
                name="stockFilter" 
                id="stockFilter"
                defaultValue={stockFilter}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value="withStock">Con Stock</option>
                <option value="withoutStock">Sin Stock</option>
                <option value="negative">Stock Negativo</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-2">
                Por página
              </label>
              <select 
                name="pageSize" 
                id="pageSize"
                defaultValue={currentPageSize}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Aplicar Filtros
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📦 Productos ({totalCount})
            <Link 
              href={`/dashboard/configuration/inventory/warehouses/${warehouseId}/products?manage=true`}
              className="ml-auto text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Gestionar productos
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warehouseProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay productos</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU/Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Actual
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mín/Máx
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proveedor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouseProducts.map((wp) => {
                      const stockStatus = getStockStatus(wp.quantity, wp.minStock);
                      
                      if (!wp.Product) {
                        return (
                          <tr key={wp.id} className="hover:bg-gray-50 bg-red-50">
                            <td className="px-6 py-4 whitespace-nowrap" colSpan={7}>
                              <div className="text-sm text-red-600">
                                ⚠️ Producto con ID {wp.productId} no encontrado
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={wp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {wp.Product.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {wp.Product.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {wp.Product.Category?.name || 'Sin categoría'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-semibold ${
                              wp.quantity < 0 ? 'text-red-600' : 
                              wp.quantity === 0 ? 'text-gray-500' : 
                              'text-gray-900'
                            }`}>
                              {wp.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {wp.minStock} / {wp.maxStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge className={stockStatus.color}>
                              {stockStatus.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {wp.Product.Supplier?.name || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={currentPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {searchParams.manage && (
        <WarehouseProductManager
          warehouseId={warehouseId}
          warehouseName={warehouse.name}
          assignedProducts={allProducts}
        />
      )}
    </div>
  );
} 