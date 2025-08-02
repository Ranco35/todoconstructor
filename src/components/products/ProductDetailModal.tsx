import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { getProductById } from '@/actions/products/get';
import { Package, Tag, Building2, DollarSign, Warehouse, AlertTriangle, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductDetailModalProps {
  productId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ productId, open, onClose }: ProductDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open && productId) {
      setLoading(true);
      getProductById(productId)
        .then((data) => {
          setProduct(data);
          setError(null);
        })
        .catch(() => setError('Error al cargar el producto'))
        .finally(() => setLoading(false));
    } else {
      setProduct(null);
      setError(null);
    }
  }, [open, productId]);

  // Calcular estadísticas
  const isNoStockType = product?.type === 'SERVICIO' || product?.type === 'CONSUMIBLE';
  const totalStock = (product?.Warehouse_Products || []).reduce((acc: number, wp: any) => acc + (wp.quantity || 0), 0);
  const stockStatus = isNoStockType ? 'no-usa' : totalStock === 0 ? 'agotado' : totalStock <= 10 ? 'stock-bajo' : 'activo';
  const margin = product?.salePrice && product?.costPrice 
    ? ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(1)
    : '0';

  // Calcular precio final con IVA
  const getPriceWithVat = (salePrice: number | undefined, vat: number | undefined) => {
    if (!salePrice) return 0;
    const vatRate = vat ?? 19;
    return Math.round(salePrice * (1 + vatRate / 100));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <div className="flex flex-col h-[80vh]">
          <DialogHeader className="p-6 border-b relative">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Package className="w-6 h-6 text-blue-600" />
              Detalle del Producto
            </DialogTitle>
            {/* Botón Editar */}
            {product && (
              <button
                className="absolute right-16 top-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                onClick={() => router.push(`/dashboard/configuration/products/edit/${product.id}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
                Editar
              </button>
            )}
            <DialogClose className="absolute right-4 top-4" />
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando producto...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : product ? (
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
                          stockStatus === 'agotado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {stockStatus === 'activo' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                            stockStatus === 'stock-bajo' ? <AlertTriangle className="w-4 h-4 mr-1" /> :
                            stockStatus === 'agotado' ? <XCircle className="w-4 h-4 mr-1" /> :
                            <XCircle className="w-4 h-4 mr-1" />}
                          {stockStatus === 'no-usa' ? 'No usa' : stockStatus === 'agotado' ? 'Sin Stock' : stockStatus === 'stock-bajo' ? 'Stock Bajo' : 'Activo'}
                        </div>
                      </div>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          ${getPriceWithVat(product.salePrice, product.vat).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-green-700 font-medium mt-1">Precio Final con IVA Incluido</div>
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
                  {!isNoStockType && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <Warehouse className="w-5 h-5 mr-2 text-purple-600" />
                        Stock por Bodegas
                      </h3>
                      {product.Warehouse_Products && product.Warehouse_Products.length > 0 ? (
                        <div className="space-y-4">
                          {product.Warehouse_Products.map((wp: any, index: number) => (
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
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8 text-lg font-semibold">Sin información de stock</div>
                      )}
                    </div>
                  )}
                </div>
                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Estadísticas Rápidas */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Información del Sistema
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Creado</label>
                        <p className="text-sm text-gray-900">
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString('es-CL') : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                        <p className="text-sm text-gray-900">
                          {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('es-CL') : '-'}
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
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 