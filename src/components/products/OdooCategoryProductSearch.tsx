'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getOdooCategoriesWithRetry, 
  getOdooProductsByCategoryWithRetry, 
  transferOdooProductsToCategory 
} from '@/actions/configuration/odoo-sync';
import { getAllCategories } from '@/actions/configuration/category-actions';
import { OdooProduct, OdooCategory } from '@/types/odoo';
import { 
  Search, 
  Package, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Image as ImageIcon,
  ShoppingCart
} from 'lucide-react';

interface LocalCategory {
  id: number;
  name: string;
  description: string | null;
}

export default function OdooCategoryProductSearch() {
  // Estados para categorías de Odoo
  const [odooCategories, setOdooCategories] = useState<OdooCategory[]>([]);
  const [selectedOdooCategory, setSelectedOdooCategory] = useState<number | null>(null);
  const [loadingOdooCategories, setLoadingOdooCategories] = useState(false);

  // Estados para productos de Odoo
  const [odooProducts, setOdooProducts] = useState<OdooProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados para categorías locales (Supabase)
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [selectedLocalCategory, setSelectedLocalCategory] = useState<number | null>(null);
  const [loadingLocalCategories, setLoadingLocalCategories] = useState(false);

  // Estados para transferencia
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<any>(null);
  const [includeImages, setIncludeImages] = useState(true);

  // Cargar categorías de Odoo al montar el componente
  useEffect(() => {
    loadOdooCategories();
    loadLocalCategories();
  }, []);

  const loadOdooCategories = async () => {
    setLoadingOdooCategories(true);
    try {
      const response = await getOdooCategoriesWithRetry();
      if (response.success && response.data) {
        setOdooCategories(response.data);
      }
    } catch (error) {
      console.error('Error cargando categorías de Odoo:', error);
    } finally {
      setLoadingOdooCategories(false);
    }
  };

  const loadLocalCategories = async () => {
    setLoadingLocalCategories(true);
    try {
      const categories = await getAllCategories();
      setLocalCategories(categories);
    } catch (error) {
      console.error('Error cargando categorías locales:', error);
    } finally {
      setLoadingLocalCategories(false);
    }
  };

  const loadProductsByCategory = async (categoryId: number) => {
    setLoadingProducts(true);
    setOdooProducts([]);
    setSelectedProducts(new Set());
    try {
      const response = await getOdooProductsByCategoryWithRetry(categoryId);
      if (response.success && response.data) {
        setOdooProducts(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOdooCategorySelect = (categoryId: number) => {
    setSelectedOdooCategory(categoryId);
    loadProductsByCategory(categoryId);
  };

  const handleProductToggle = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === odooProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(odooProducts.map(p => p.id)));
    }
  };

  const handleTransfer = async () => {
    if (!selectedLocalCategory || selectedProducts.size === 0) return;

    setTransferring(true);
    setTransferResult(null);
    
    try {
      const productsToTransfer = odooProducts.filter(p => selectedProducts.has(p.id));
      const result = await transferOdooProductsToCategory(
        productsToTransfer,
        selectedLocalCategory,
        includeImages
      );
      setTransferResult(result);
      
      // Limpiar selección si fue exitoso
      if (result.success) {
        setSelectedProducts(new Set());
      }
    } catch (error) {
      console.error('Error durante la transferencia:', error);
      setTransferResult({
        success: false,
        message: 'Error durante la transferencia',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setTransferring(false);
    }
  };

  const selectedOdooCategoryData = odooCategories.find(c => c.id === selectedOdooCategory);
  const selectedLocalCategoryData = localCategories.find(c => c.id === selectedLocalCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🔍 Búsqueda por Categorías</h2>
            <p className="text-purple-100">
              Busca productos de Odoo por categoría y transfiérelos a tu sistema
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-purple-200">Productos</div>
          </div>
        </div>
      </div>

      {/* Selección de categorías de Odoo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            1. Selecciona Categoría de Odoo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOdooCategories ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando categorías de Odoo...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {odooCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleOdooCategorySelect(category.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedOdooCategory === category.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {category.product_count} productos
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de productos */}
      {selectedOdooCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                2. Selecciona Productos
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedProducts.size} de {odooProducts.length} seleccionados
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={odooProducts.length === 0}
                >
                  {selectedProducts.size === odooProducts.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando productos de {selectedOdooCategoryData?.name}...</span>
              </div>
            ) : odooProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {odooProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProducts.has(product.id)
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleProductToggle(product.id)}
                  >
                    {/* Checkbox visual */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedProducts.has(product.id)
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedProducts.has(product.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {product.image_url && (
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                      )}
                    </div>

                    {/* Imagen del producto */}
                    {product.image_url && (
                      <div className="mb-3">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="space-y-1 text-sm">
                      {product.default_code && (
                        <div className="text-gray-600">
                          <strong>SKU:</strong> {product.default_code}
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio:</span>
                        <span className="font-semibold text-green-600">
                          ${product.lst_price?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-semibold ${
                          product.qty_available > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {product.qty_available || 0}
                        </span>
                      </div>
                    </div>

                    <Badge 
                      variant={product.type === 'product' ? 'default' : 
                              product.type === 'consu' ? 'secondary' : 'outline'}
                      className="mt-2"
                    >
                      {product.type === 'product' ? 'Almacenable' :
                       product.type === 'consu' ? 'Consumible' : 'Servicio'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay productos disponibles
                </h3>
                <p className="text-gray-500">
                  Esta categoría no tiene productos disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selección de categoría destino */}
      {selectedProducts.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="mr-2 h-5 w-5" />
              3. Selecciona Categoría Destino
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLocalCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Cargando categorías...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {localCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedLocalCategory(category.id)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        selectedLocalCategory === category.id
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {category.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Opciones de transferencia */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Incluir imágenes</span>
                    </label>
                  </div>
                </div>

                {/* Botón de transferencia */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div>
                    <div className="font-medium">
                      Transferir {selectedProducts.size} productos
                    </div>
                    <div className="text-sm text-gray-600">
                      De "{selectedOdooCategoryData?.name}" a "{selectedLocalCategoryData?.name}"
                    </div>
                  </div>
                  <Button
                    onClick={handleTransfer}
                    disabled={!selectedLocalCategory || transferring}
                    className="min-w-[120px]"
                  >
                    {transferring ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transfiriendo...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Transferir
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado de la transferencia */}
      {transferResult && (
        <Alert className={transferResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {transferResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={transferResult.success ? "text-green-800" : "text-red-800"}>
            <div className="font-medium mb-2">{transferResult.message}</div>
            {transferResult.success && transferResult.stats && (
              <div className="text-sm space-y-1">
                <div>• Productos creados: {transferResult.stats.productsCreated}</div>
                <div>• Productos actualizados: {transferResult.stats.productsUpdated}</div>
                <div>• Imágenes descargadas: {transferResult.stats.imagesDownloaded}</div>
              </div>
            )}
            {transferResult.errors && transferResult.errors.length > 0 && (
              <div className="text-sm mt-2">
                <div className="font-medium">Errores:</div>
                <ul className="list-disc list-inside">
                  {transferResult.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 