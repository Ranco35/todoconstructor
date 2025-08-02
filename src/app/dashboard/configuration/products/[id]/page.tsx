import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Tag, Building2, User, Calendar, DollarSign, BarChart3, Warehouse, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getProductById } from '@/actions/products/get';
import ProductImageDisplay from '@/components/products/ProductImageDisplay';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const productId = parseInt(id);
  
  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProductById(productId);
  
  if (!product) {
    notFound();
  }

  // Calcular estadísticas
  const totalStock = (product.Warehouse_Products || []).reduce((acc, wp) => acc + (wp.quantity || 0), 0);
  const stockStatus = totalStock === 0 ? 'agotado' : totalStock <= 10 ? 'stock-bajo' : 'activo';
  const margin = product.salePrice && product.costPrice 
    ? ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/configuration/products"
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Productos
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Detalle del Producto
                  </h1>
                  <p className="text-sm text-gray-500">
                    Información completa y estadísticas
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/configuration/products/edit/${productId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Editar Producto
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    <p className="text-gray-500">ID: {product.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    stockStatus === 'activo' ? 'bg-green-100 text-green-800' :
                    stockStatus === 'stock-bajo' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stockStatus === 'activo' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                     stockStatus === 'stock-bajo' ? <AlertTriangle className="w-4 h-4 mr-1" /> :
                     <XCircle className="w-4 h-4 mr-1" />}
                    {stockStatus === 'agotado' ? 'Sin Stock' : stockStatus === 'stock-bajo' ? 'Stock Bajo' : 'Activo'}
                  </div>
                </div>
              </div>

              {/* Imagen del Producto */}
              <ProductImageDisplay 
                imageUrl={product.image} 
                productName={product.name} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-blue-600" />
                    Información Básica
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">SKU</label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                        {product.sku || 'Sin SKU'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Código de Barras</label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                        {product.barcode || 'Sin código'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Marca</label>
                      <p className="text-sm text-gray-900">
                        {product.brand || 'Sin marca'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Producto</label>
                      <p className="text-sm text-gray-900">
                        {product.type || 'ALMACENABLE'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-green-600" />
                    Categorización
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Categoría</label>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {product.Category?.name || 'Sin categoría'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Proveedor</label>
                      <p className="text-sm text-gray-900">
                        {product.Supplier?.name || 'Sin proveedor'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Política de Facturación</label>
                      <p className="text-sm text-gray-900">
                        {product.invoicePolicy || 'Sin política'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Financiera */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Información Financiera
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ${product.costPrice?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500">Precio de Costo</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${product.salePrice?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500">Precio de Venta</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {margin}%
                  </div>
                  <div className="text-sm text-gray-500">Margen de Ganancia</div>
                </div>
              </div>
            </div>

            {/* Stock por Bodegas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Warehouse className="w-5 h-5 mr-2 text-purple-600" />
                Stock por Bodegas
              </h3>
              
              {product.Warehouse_Products && product.Warehouse_Products.length > 0 ? (
                <div className="space-y-4">
                  {product.Warehouse_Products.map((wp, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Warehouse className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{wp.Warehouse?.name}</p>
                          <p className="text-sm text-gray-500">Stock mínimo: {wp.minStock || 0}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          (wp.quantity || 0) > 10 ? 'text-green-600' :
                          (wp.quantity || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {wp.quantity || 0}
                        </div>
                        <div className="text-sm text-gray-500">unidades</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay stock registrado en bodegas</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Estadísticas
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{totalStock}</div>
                  <div className="text-sm text-gray-500">Stock Total</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {product.Warehouse_Products?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Bodegas Asignadas</div>
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                Información del Sistema
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Creado</label>
                  <p className="text-sm text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                  <p className="text-sm text-gray-900">
                    {new Date(product.updatedAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                
                {product.CreatedByUser && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Creado por</label>
                    <p className="text-sm text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {product.CreatedByUser.firstName} {product.CreatedByUser.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/dashboard/configuration/products/edit/${productId}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Editar Producto
                </Link>
                
                <Link
                  href="/dashboard/configuration/products"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Volver a Lista
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 