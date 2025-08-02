"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOdooProducts, syncProductsFromOdoo, testOdooConnection, getOdooStats } from '@/actions/configuration/odoo-sync';
import { OdooProduct } from '@/types/odoo';
import { RefreshCw, Download, AlertCircle, CheckCircle, Package, Eye, Image as ImageIcon, TrendingUp } from 'lucide-react';
import OdooCategoryProductSearch from '@/components/products/OdooCategoryProductSearch';

interface OdooProductsClientProps {
  connectionStatus: { success: boolean; message: string; productCount?: number };
  initialStats: any;
}

export default function OdooProductsClient({ connectionStatus, initialStats }: OdooProductsClientProps) {
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<OdooProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'category'>('general');

  // Cargar productos de Odoo
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getOdooProducts();
      if (response.success && response.data) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar productos con el sistema local
  const handleSync = async (includeImages: boolean = true) => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncProductsFromOdoo(includeImages);
      setSyncResult(result);
      
      // Actualizar estadísticas después de la sincronización
      const statsResponse = await getOdooStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      setSyncResult({
        success: false,
        message: 'Error durante la sincronización',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setSyncing(false);
    }
  };

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.default_code && product.default_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.barcode && product.barcode.includes(searchTerm))
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(product => product.type === selectedType);
    }

    // Filtro por stock
    if (showOnlyWithStock) {
      filtered = filtered.filter(product => product.qty_available > 0);
    }

    // Filtro por imágenes
    if (showOnlyWithImages) {
      filtered = filtered.filter(product => product.image_url);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedType, showOnlyWithStock, showOnlyWithImages]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🔗 Integración con Odoo</h1>
              <p className="text-blue-100">
                Conecta y sincroniza productos desde tu instancia de Odoo
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">📦</div>
              <div className="text-blue-200">Productos</div>
            </div>
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="mb-6">
          <Alert className={connectionStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {connectionStatus.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={connectionStatus.success ? "text-green-800" : "text-red-800"}>
              {connectionStatus.message}
              {connectionStatus.productCount && (
                <span className="ml-2">
                  ({connectionStatus.productCount} productos disponibles)
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Vista General
              </button>
              <button
                onClick={() => setActiveTab('category')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'category'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Búsqueda por Categorías
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' ? (
          <>
            {/* Estadísticas */}
            {connectionStatus.success && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Productos</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Con Stock</p>
                        <p className="text-2xl font-bold text-green-900">{stats.withStock}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Con Imágenes</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.withImages}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">Valor Total</p>
                        <p className="text-2xl font-bold text-orange-900">
                          ${stats.totalValue?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Acciones principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <Eye className="mr-2 h-5 w-5" />
                    Ver Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Visualiza todos los productos disponibles en Odoo sin importarlos
                  </p>
                  <Button 
                    onClick={loadProducts} 
                    disabled={loading || !connectionStatus.success}
                    className="w-full"
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Productos
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <Download className="mr-2 h-5 w-5" />
                    Sincronización Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Importa productos sin descargar imágenes (proceso más rápido)
                  </p>
                  <Button 
                    onClick={() => handleSync(false)} 
                    disabled={syncing || !connectionStatus.success}
                    className="w-full"
                    variant="outline"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Sincronizar Sin Imágenes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <Download className="mr-2 h-5 w-5" />
                    Sincronización Completa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Importa productos con imágenes (proceso más lento)
                  </p>
                  <Button 
                    onClick={() => handleSync(true)} 
                    disabled={syncing || !connectionStatus.success}
                    className="w-full"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Sincronizar Completa
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Resultado de sincronización */}
            {syncResult && (
              <Alert className={syncResult.success ? "border-green-200 bg-green-50 mb-6" : "border-red-200 bg-red-50 mb-6"}>
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={syncResult.success ? "text-green-800" : "text-red-800"}>
                  <div className="font-medium mb-2">{syncResult.message}</div>
                  {syncResult.success && syncResult.stats && (
                    <div className="text-sm space-y-1">
                      <div>• Productos creados: {syncResult.stats.productsCreated}</div>
                      <div>• Productos actualizados: {syncResult.stats.productsUpdated}</div>
                      <div>• Imágenes descargadas: {syncResult.stats.imagesDownloaded}</div>
                    </div>
                  )}
                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <div className="text-sm mt-2">
                      <div className="font-medium">Errores:</div>
                      <ul className="list-disc list-inside">
                        {syncResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Información de uso */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ℹ️ Información de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  • <strong>Ver Productos:</strong> Visualiza los productos disponibles en Odoo sin importarlos
                  <br />
                  • <strong>Sincronizar Sin Imágenes:</strong> Importa productos más rápidamente sin descargar imágenes
                  <br />
                  • <strong>Sincronizar Completa:</strong> Importa productos con sus imágenes (proceso más lento)
                </p>
              </CardContent>
            </Card>

            {/* Filtros */}
            {products.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>🔍 Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nombre, SKU o código de barras..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Producto
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todos los tipos</option>
                        <option value="product">Almacenable</option>
                        <option value="consu">Consumible</option>
                        <option value="service">Servicio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtros adicionales
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={showOnlyWithStock}
                            onChange={(e) => setShowOnlyWithStock(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">Solo con stock</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={showOnlyWithImages}
                            onChange={(e) => setShowOnlyWithImages(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">Solo con imágenes</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de productos */}
            {products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📦 Productos desde Odoo ({filteredProducts.length} de {products.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Imagen del producto */}
                        {product.image_url && (
                          <div className="mb-4">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                            {product.name}
                          </h3>
                          
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant={product.type === 'product' ? 'default' : 
                                      product.type === 'consu' ? 'secondary' : 'outline'}
                            >
                              {product.type === 'product' ? 'Almacenable' :
                               product.type === 'consu' ? 'Consumible' : 'Servicio'}
                            </Badge>
                            {product.active && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Activo
                              </Badge>
                            )}
                          </div>

                          {product.default_code && (
                            <p className="text-sm text-gray-600">
                              <strong>SKU:</strong> {product.default_code}
                            </p>
                          )}

                          {product.barcode && (
                            <p className="text-sm text-gray-600">
                              <strong>Código:</strong> {product.barcode}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Precio venta:</span>
                              <div className="font-semibold text-green-600">
                                ${product.lst_price?.toLocaleString() || '0'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock:</span>
                              <div className={`font-semibold ${
                                product.qty_available > 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {product.qty_available || 0}
                              </div>
                            </div>
                          </div>

                          {Array.isArray(product.categ_id) && product.categ_id.length > 1 && (
                            <p className="text-sm text-gray-600">
                              <strong>Categoría:</strong> {product.categ_id[1]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && products.length > 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron productos
                      </h3>
                      <p className="text-gray-500">
                        Intenta ajustar los filtros de búsqueda
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Estado inicial */}
            {!connectionStatus.success && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔗</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Conexión con Odoo no disponible
                  </h3>
                  <p className="text-gray-500">
                    Verifica la configuración de conexión con Odoo
                  </p>
                </CardContent>
              </Card>
            )}

            {connectionStatus.success && products.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Productos de Odoo
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Haz clic en "Ver Productos" para cargar los productos disponibles en Odoo
                  </p>
                  <Button onClick={loadProducts} disabled={loading}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Productos
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <OdooCategoryProductSearch />
        )}
      </div>
    </div>
  );
} 