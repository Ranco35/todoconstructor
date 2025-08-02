'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ShoppingCart,
  Tag,
  X
} from 'lucide-react';
import { getProducts } from '@/actions/products/list';
import { getAllCategories } from '@/actions/configuration/category-actions';
import { ProductFrontend } from '@/lib/product-mapper';

interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  Parent?: {
    name: string;
  } | null;
  _count?: {
    Product: number;
  };
}

interface NormalProductSearchProps {
  multiSelect?: boolean;
  showSelectedCount?: boolean;
  placeholder?: string;
  categoryFirst?: boolean;
  onProductsSelect: (products: ProductFrontend[]) => void;
}

export default function NormalProductSearch({
  multiSelect = false,
  showSelectedCount = false,
  placeholder = "Buscar productos...",
  categoryFirst = false,
  onProductsSelect
}: NormalProductSearchProps) {
  // Estados para categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Estados para productos
  const [products, setProducts] = useState<ProductFrontend[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductFrontend[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar productos cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      loadProductsByCategory(selectedCategory);
    } else {
      setProducts([]);
      setFilteredProducts([]);
    }
  }, [selectedCategory]);

  // Filtrar productos cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const categories = await getAllCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProductsByCategory = async (categoryId: number) => {
    setLoadingProducts(true);
    try {
      const result = await getProducts({
        categoryId,
        page: 1,
        pageSize: 1000, // Cargar todos los productos de la categoría
        search: ''
      });
      setProducts(result.products);
      setFilteredProducts(result.products);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setSelectedProducts(new Set());
    setSearchTerm('');
    setShowResults(true);
  };

  const handleProductToggle = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);

    // Notificar al componente padre
    const selectedProductsList = products.filter(p => newSelected.has(p.id));
    onProductsSelect(selectedProductsList);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
      onProductsSelect([]);
    } else {
      const newSelected = new Set(filteredProducts.map(p => p.id));
      setSelectedProducts(newSelected);
      onProductsSelect(filteredProducts);
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
    onProductsSelect([]);
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const selectedProductsList = products.filter(p => selectedProducts.has(p.id));

  return (
    <div className="space-y-4">
      {/* Selector de Categoría */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {categoryFirst ? "1. Selecciona una categoría" : "Categoría"}
        </label>
        <select
          value={selectedCategory || ''}
          onChange={(e) => handleCategorySelect(parseInt(e.target.value))}
          disabled={loadingCategories}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">
            {loadingCategories ? 'Cargando categorías...' : 'Seleccionar categoría'}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category._count && category._count.Product > 0 && 
                ` (${category._count.Product} productos)`
              }
            </option>
          ))}
        </select>
      </div>

      {/* Búsqueda de Productos */}
      {selectedCategory && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {categoryFirst ? "2. Buscar productos" : "Buscar productos"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Contador de Productos Seleccionados */}
      {showSelectedCount && selectedProducts.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''} seleccionado{selectedProducts.size !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        </div>
      )}

      {/* Resultados de Productos */}
      {selectedCategory && showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos en {selectedCategoryData?.name}
                {loadingProducts && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {multiSelect && filteredProducts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  {selectedProducts.size === filteredProducts.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando productos...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda.' : 'No hay productos en esta categoría.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.has(product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleProductToggle(product.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {product.sku && (
                            <Badge variant="secondary" className="text-xs">
                              SKU: {product.sku}
                            </Badge>
                          )}
                          {product.brand && (
                            <Badge variant="outline" className="text-xs">
                              {product.brand}
                            </Badge>
                          )}
                          {product.salePrice && (
                            <Badge variant="default" className="text-xs">
                              ${product.salePrice}
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {selectedProducts.has(product.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Productos Seleccionados */}
      {multiSelect && selectedProductsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Productos Seleccionados ({selectedProductsList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedProductsList.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">{product.name}</span>
                    {product.sku && (
                      <Badge variant="secondary" className="text-xs">
                        {product.sku}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProductToggle(product.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 