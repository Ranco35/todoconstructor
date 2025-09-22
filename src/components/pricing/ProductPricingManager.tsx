'use client';

import React, { useState, useEffect } from 'react';
import { formatPrice, formatPercentage } from '@/utils/price-utils';
import { 
  getSimpleProducts,
  getSimpleProduct,
  updateProductPrices,
  SimpleProduct
} from '@/actions/pricing/simple-products';
import { testProductConnection } from '@/actions/pricing/test-connection';
import { PaginationControls } from '@/components/shared/PaginationControls';

interface ProductPricingManagerProps {
  onProductSelect?: (product: SimpleProduct) => void;
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
}

export default function ProductPricingManager({ 
  onProductSelect,
  initialPage = 1,
  initialPageSize = 20,
  initialSearch = ''
}: ProductPricingManagerProps) {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [selectedProduct, setSelectedProduct] = useState<SimpleProduct | null>(null);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showPriceForm, setShowPriceForm] = useState(false);
  
  // Estados del formulario de precios
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [changeReason, setChangeReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [priceType, setPriceType] = useState<'net' | 'gross'>('net');
  const [stockFilter, setStockFilter] = useState<'all' | 'with_stock' | 'no_stock'>('all');

  // Cargar productos
  useEffect(() => {
    loadProducts();
    testConnection();
  }, [search, currentPage, pageSize, stockFilter]);

  const testConnection = async () => {
    const result = await testProductConnection();
    setConnectionTest(result);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getSimpleProducts({
        search: search || undefined,
        page: currentPage,
        pageSize: pageSize,
        stockFilter: stockFilter
      });

      if (result.success && result.data) {
        setProducts(result.data);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        setError(result.error || 'Error al cargar productos');
      }
    } catch (err) {
      setError('Error inesperado al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: SimpleProduct) => {
    try {
      // Obtener datos completos del producto
      const result = await getSimpleProduct(product.id);
      
      if (result.success && result.data) {
        setSelectedProduct(result.data);
        setCostPrice(result.data.costPrice || 0);
        setSalePrice(result.data.salePrice || 0);
        setFinalPrice(result.data.salePrice || 0); // Inicializar con salePrice
        setPriceType('net'); // Por defecto valores netos
        setChangeReason('');
        setShowPriceForm(true);
        
        if (onProductSelect) {
          onProductSelect(result.data);
        }
      } else {
        setError(result.error || 'Error al cargar producto');
      }
    } catch (err) {
      setError('Error al cargar producto');
    }
  };

  const handlePriceUpdate = async () => {
    if (!selectedProduct || !changeReason.trim()) {
      setError('Debe proporcionar una razón para el cambio');
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      // Actualizar precios en la base de datos
      const result = await updateProductPrices({
        productId: selectedProduct.id,
        costPrice: costPrice,
        salePrice: salePrice,
        finalPrice: finalPrice,
        reason: changeReason.trim(),
        priceType: priceType
      });

      if (result.success) {
        // Mostrar mensaje de éxito con información detallada
        alert(result.message);
        
        // Recargar productos para mostrar los cambios
        await loadProducts();
        
        // Cerrar el formulario
        setShowPriceForm(false);
        setSelectedProduct(null);
        setChangeReason('');
        
        // Limpiar estados de precios
        setCostPrice(0);
        setSalePrice(0);
        setFinalPrice(0);
      } else {
        setError(result.error || 'Error al actualizar precios');
      }
      
    } catch (err) {
      setError('Error inesperado al actualizar precios');
    } finally {
      setUpdating(false);
    }
  };

  const calculateMargin = () => {
    if (costPrice && salePrice && costPrice > 0) {
      return ((salePrice - costPrice) / costPrice) * 100;
    }
    return 0;
  };

  // Calcular precio con IVA para un producto
  const calculateSalePriceWithVAT = (product: SimpleProduct) => {
    if (!product.salePrice || !product.vat) return product.salePrice || 0;
    return Math.round(product.salePrice * (1 + product.vat / 100));
  };

  // Calcular precio con IVA (sin decimales)
  const calculatePriceWithVAT = (price: number) => {
    if (!selectedProduct?.vat || priceType === 'gross') return Math.round(price);
    return Math.round(price * (1 + selectedProduct.vat / 100));
  };

  // Calcular precio sin IVA (sin decimales)
  const calculatePriceWithoutVAT = (price: number) => {
    if (!selectedProduct?.vat || priceType === 'net') return Math.round(price);
    return Math.round(price / (1 + selectedProduct.vat / 100));
  };

  // Manejar cambio de precio de costo (convierte automáticamente según el tipo)
  const handleCostPriceChange = (newCostPrice: number) => {
    setCostPrice(Math.round(newCostPrice));
    
    // Si estamos en modo bruto, también actualizar el precio de venta proporcionalmente
    if (priceType === 'gross' && selectedProduct?.vat) {
      const netCostPrice = calculatePriceWithoutVAT(newCostPrice);
      const netSalePrice = calculatePriceWithoutVAT(salePrice);
      
      // Mantener la misma proporción de margen
      if (netCostPrice > 0 && costPrice > 0) {
        const marginRatio = (netSalePrice - calculatePriceWithoutVAT(costPrice)) / calculatePriceWithoutVAT(costPrice);
        const newNetSalePrice = netCostPrice * (1 + marginRatio);
        const newGrossSalePrice = calculatePriceWithVAT(newNetSalePrice);
        setSalePrice(newGrossSalePrice);
        setFinalPrice(newGrossSalePrice);
      }
    }
  };

  // Manejar cambio de precio de venta (convierte automáticamente según el tipo)
  const handleSalePriceChange = (newSalePrice: number) => {
    setSalePrice(Math.round(newSalePrice));
    setFinalPrice(Math.round(newSalePrice));
    
    // El precio de costo se mantiene fijo, solo cambia el margen de utilidad
    // No se modifica el costPrice
  };

  // Manejar cambio de precio final (convierte automáticamente según el tipo)
  const handleFinalPriceChange = (newFinalPrice: number) => {
    setFinalPrice(Math.round(newFinalPrice));
    setSalePrice(Math.round(newFinalPrice)); // Precio final y de venta son iguales
    
    // El precio de costo se mantiene fijo, solo cambia el margen de utilidad
    // No se modifica el costPrice
  };

  // Manejar cambio de tipo de precio
  const handlePriceTypeChange = (type: 'net' | 'gross') => {
    setPriceType(type);
    
    // Convertir precios actuales
    if (type === 'gross') {
      // Convertir de neto a bruto
      setCostPrice(calculatePriceWithVAT(costPrice));
      setSalePrice(calculatePriceWithVAT(salePrice));
      setFinalPrice(calculatePriceWithVAT(finalPrice));
    } else {
      // Convertir de bruto a neto
      setCostPrice(calculatePriceWithoutVAT(costPrice));
      setSalePrice(calculatePriceWithoutVAT(salePrice));
      setFinalPrice(calculatePriceWithoutVAT(finalPrice));
    }
  };

  // Actualizar precio final automáticamente cuando cambie el precio de venta
  useEffect(() => {
    if (salePrice > 0) {
      setFinalPrice(salePrice);
    }
  }, [salePrice]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1); // Reset a página 1 cuando se busca
  };

  const handleStockFilterChange = (filter: 'all' | 'with_stock' | 'no_stock') => {
    setStockFilter(filter);
    setCurrentPage(1); // Reset a página 1 cuando se cambia el filtro
  };

  if (showPriceForm && selectedProduct) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Configurar Precios - {selectedProduct.name}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedProduct.sku && `SKU: ${selectedProduct.sku}`}
              {selectedProduct.categoryName && ` • Categoría: ${selectedProduct.categoryName}`}
              {selectedProduct.stock !== null && ` • Stock: ${selectedProduct.stock} unidades`}
            </p>
          </div>
          <button
            onClick={() => setShowPriceForm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Selector de tipo de precio */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Precios
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="net"
                checked={priceType === 'net'}
                onChange={(e) => handlePriceTypeChange(e.target.value as 'net' | 'gross')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Neto {selectedProduct.vat && `(sin IVA ${selectedProduct.vat}%)`}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="gross"
                checked={priceType === 'gross'}
                onChange={(e) => handlePriceTypeChange(e.target.value as 'net' | 'gross')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Bruto {selectedProduct.vat && `(con IVA ${selectedProduct.vat}%)`}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Precio de Costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Costo ({priceType === 'net' ? 'Neto' : 'Bruto'})
            </label>
            <input
              type="number"
              step="1"
              value={costPrice || ''}
              onChange={(e) => handleCostPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Precio de Venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Venta ({priceType === 'net' ? 'Neto' : 'Bruto'})
            </label>
            <input
              type="number"
              step="1"
              value={salePrice || ''}
              onChange={(e) => handleSalePriceChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Precio Final */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Final ({priceType === 'net' ? 'Neto' : 'Bruto'})
            </label>
            <input
              type="number"
              step="1"
              value={finalPrice || ''}
              onChange={(e) => handleFinalPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Modifica el precio final y se actualizará automáticamente el precio de venta
            </p>
          </div>
        </div>

        {/* Información de Margen */}
        {costPrice && salePrice && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Margen de Utilidad:</span>
              <span className={`text-lg font-semibold ${calculateMargin() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(calculateMargin())}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Utilidad:</span>
              <span className={`text-sm font-medium ${calculateMargin() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(salePrice - costPrice)}
              </span>
            </div>
            {selectedProduct.vat && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>IVA ({selectedProduct.vat}%):</span>
                    <span>{formatPrice(calculatePriceWithVAT(salePrice) - salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio {priceType === 'net' ? 'con IVA' : 'sin IVA'}:</span>
                    <span>{formatPrice(priceType === 'net' ? calculatePriceWithVAT(salePrice) : calculatePriceWithoutVAT(salePrice))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversión de Precios en Tiempo Real */}
        {selectedProduct.vat && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Conversión de Precios ({selectedProduct.vat}% IVA)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Precios Netos */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-blue-600 mb-2">Precios Netos (sin IVA)</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo:</span>
                    <span className="font-medium">{formatPrice(priceType === 'gross' ? calculatePriceWithoutVAT(costPrice) : costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venta:</span>
                    <span className="font-medium">{formatPrice(priceType === 'gross' ? calculatePriceWithoutVAT(salePrice) : salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final:</span>
                    <span className="font-medium">{formatPrice(priceType === 'gross' ? calculatePriceWithoutVAT(finalPrice) : finalPrice)}</span>
                  </div>
                </div>
              </div>
              
              {/* Precios Brutos */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-purple-600 mb-2">Precios Brutos (con IVA)</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo:</span>
                    <span className="font-medium">{formatPrice(priceType === 'net' ? calculatePriceWithVAT(costPrice) : costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venta:</span>
                    <span className="font-medium">{formatPrice(priceType === 'net' ? calculatePriceWithVAT(salePrice) : salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final:</span>
                    <span className="font-medium">{formatPrice(priceType === 'net' ? calculatePriceWithVAT(finalPrice) : finalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              💡 <strong>Tip:</strong> Modifica los precios {priceType === 'net' ? 'netos' : 'brutos'} y ve cómo se calculan automáticamente los precios {priceType === 'net' ? 'brutos' : 'netos'}.
            </div>
          </div>
        )}

        {/* Razón del Cambio */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razón del Cambio *
          </label>
          <textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Explique por qué está cambiando los precios..."
            required
          />
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => setShowPriceForm(false)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={updating}
          >
            Cancelar
          </button>
          <button
            onClick={handlePriceUpdate}
            disabled={updating || !changeReason.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Actualizando...' : 'Actualizar Precios'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Seleccionar Producto</h2>
            <p className="text-gray-600">Elija un producto para configurar sus precios</p>
          </div>
          <div className="flex space-x-4">
            {/* Filtro de stock */}
            <div className="w-48">
              <select
                value={stockFilter}
                onChange={(e) => handleStockFilterChange(e.target.value as 'all' | 'with_stock' | 'no_stock')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los productos</option>
                <option value="with_stock">Con stock</option>
                <option value="no_stock">Sin stock</option>
              </select>
            </div>
            {/* Buscador */}
            <div className="w-64">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Información de conexión */}
        {connectionTest && (
          <div className={`px-4 py-3 rounded mb-4 ${
            connectionTest.success 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <strong>Estado de conexión:</strong> {connectionTest.success ? connectionTest.message : connectionTest.error}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error al cargar productos:</strong> {error}
            <button 
              onClick={testConnection}
              className="ml-4 text-blue-600 hover:text-blue-800 underline"
            >
              Probar conexión nuevamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📦</span>
            <p className="text-gray-600">No se encontraron productos</p>
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        {product.categoryName && <span>Categoría: {product.categoryName}</span>}
                        {product.brand && <span>Marca: {product.brand}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  {/* Stock */}
                  <div className="text-right">
                    <div className={`font-medium ${
                      (product.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.stock || 0} unidades
                    </div>
                    <div className="text-gray-500">Stock</div>
                  </div>
                  
                  {/* Precio de Costo */}
                  <div className="text-right">
                    <div className="text-gray-900 font-medium">
                      {formatPrice(product.costPrice)}
                    </div>
                    <div className="text-gray-500">
                      Precio de Costo
                    </div>
                  </div>
                  
                  {/* Precio de Venta Neto */}
                  <div className="text-right">
                    <div className="text-blue-600 font-medium">
                      {formatPrice(product.salePrice)}
                    </div>
                    <div className="text-gray-500">
                      Precio de Venta Neto
                    </div>
                  </div>
                  
                  {/* Precio Final con IVA */}
                  {product.vat && product.vat > 0 && (
                    <div className="text-right">
                      <div className="text-purple-600 font-medium">
                        {formatPrice(calculateSalePriceWithVAT(product))}
                      </div>
                      <div className="text-xs text-gray-500">
                        Precio Final
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        IVA {product.vat}% incluido
                      </div>
                    </div>
                  )}
                  
                  {/* Margen de Utilidad */}
                  {product.costPrice && product.salePrice && product.costPrice > 0 && (
                    <div className="text-right">
                      <div className={`font-medium ${
                        ((product.salePrice - product.costPrice) / product.costPrice * 100) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatPercentage(((product.salePrice - product.costPrice) / product.costPrice) * 100)}
                      </div>
                      <div className="text-gray-500">Margen de Utilidad</div>
                    </div>
                  )}
                  
                  <div className="text-gray-400">
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controles de paginación */}
        {products.length > 0 && totalPages > 1 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize.toString()}
              totalCount={totalCount}
              currentCount={products.length}
              basePath="/dashboard/pricing/products"
              itemName="productos"
            />
          </div>
        )}

        {/* Información adicional sobre filtros activos */}
        {search && products.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Mostrando resultados de búsqueda:</span>
              {' '}{products.length} de {totalCount} productos
              {search && ` • Búsqueda: "${search}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
