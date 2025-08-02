'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calculator, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductComponent } from '@/types/product';
import { formatCurrency } from '@/utils/currency';

interface Product {
  id: number;
  name: string;
  sku: string;
  saleprice: number;
  image?: string;
  categoryname?: string;
}

interface ComboComponentsManagerProps {
  components: ProductComponent[];
  onComponentsChange: (components: ProductComponent[]) => void;
  onSuggestedPriceChange: (price: number) => void;
}

export default function ComboComponentsManager({
  components,
  onComponentsChange,
  onSuggestedPriceChange
}: ComboComponentsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Calcular precio sugerido basado en componentes
  const calculateSuggestedPrice = (currentComponents: ProductComponent[]) => {
    const total = currentComponents.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);
    const suggestedPrice = Math.round(total * 1.2); // 20% de margen
    onSuggestedPriceChange(suggestedPrice);
    return total;
  };

  // Actualizar precio sugerido cuando cambian los componentes
  useEffect(() => {
    calculateSuggestedPrice(components);
  }, [components, onSuggestedPriceChange]);

  // Buscar productos disponibles
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(term)}&limit=10`);
      if (response.ok) {
        const products = await response.json();
        // Filtrar productos que ya están en el combo
        const availableProducts = products.filter((product: Product) => 
          !components.some(comp => comp.id === product.id)
        );
        setSearchResults(availableProducts);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Agregar componente al combo
  const addComponent = (product: Product) => {
    const newComponent: ProductComponent = {
      id: product.id,
      quantity: 1,
      price: product.saleprice || 0
    };
    
    const newComponents = [...components, newComponent];
    onComponentsChange(newComponents);
    
    // Limpiar búsqueda
    setSearchTerm('');
    setSearchResults([]);
    setShowProductSearch(false);
  };

  // Quitar componente del combo
  const removeComponent = (componentId: number) => {
    const newComponents = components.filter(comp => comp.id !== componentId);
    onComponentsChange(newComponents);
  };

  // Actualizar cantidad de componente
  const updateQuantity = (componentId: number, quantity: number) => {
    if (quantity < 1) return;
    
    const newComponents = components.map(comp => 
      comp.id === componentId ? { ...comp, quantity } : comp
    );
    onComponentsChange(newComponents);
  };

  // Actualizar precio de componente
  const updatePrice = (componentId: number, price: number) => {
    if (price < 0) return;
    
    const newComponents = components.map(comp => 
      comp.id === componentId ? { ...comp, price } : comp
    );
    onComponentsChange(newComponents);
  };

  // Obtener información del producto por ID
  const getProductInfo = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const product = await response.json();
        return product;
      }
    } catch (error) {
      console.error('Error obteniendo información del producto:', error);
    }
    return null;
  };

  const totalComponentsPrice = components.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);
  const suggestedPrice = Math.round(totalComponentsPrice * 1.2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Componentes del Combo</h3>
        </div>
        <Button
          type="button"
          onClick={() => setShowProductSearch(!showProductSearch)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Búsqueda de productos */}
      {showProductSearch && (
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar productos por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchProducts(e.target.value);
              }}
              className="flex-1"
            />
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Buscando productos...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                  onClick={() => addComponent(product)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    {product.categoryname && (
                      <p className="text-xs text-gray-400">Categoría: {product.categoryname}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(product.saleprice)}
                    </p>
                    <Button size="sm" className="mt-1">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      )}

      {/* Lista de componentes */}
      {components.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Productos Incluidos</h4>
          {components.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
              onUpdateQuantity={updateQuantity}
              onUpdatePrice={updatePrice}
              onRemove={removeComponent}
            />
          ))}
        </div>
      )}

      {/* Mensaje de advertencia sobre precios netos */}
      <div className="my-2 p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
        Mostrando precios <b>netos (sin IVA)</b>. El IVA se sumará al final.
      </div>

      {/* Resumen de precios */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Resumen de Precios</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Total Componentes: {formatCurrency(totalComponentsPrice)}
            </p>
            <p className="text-lg font-bold text-purple-600">
              Precio Sugerido: {formatCurrency(suggestedPrice)}
            </p>
            <p className="text-xs text-gray-500">
              (Margen 20% incluido)
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje si no hay componentes */}
      {components.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No hay productos en el combo</p>
          <p className="text-sm">Haz clic en "Agregar Producto" para empezar</p>
        </div>
      )}
    </div>
  );
}

// Componente para cada fila de componente
function ComponentRow({
  component,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove
}: {
  component: ProductComponent;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onUpdatePrice: (id: number, price: number) => void;
  onRemove: (id: number) => void;
}) {
  const [productInfo, setProductInfo] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProductInfo = async () => {
      try {
        const response = await fetch(`/api/products/${component.id}`);
        if (response.ok) {
          const product = await response.json();
          setProductInfo(product);
        }
      } catch (error) {
        console.error('Error obteniendo información del producto:', error);
      }
    };

    fetchProductInfo();
  }, [component.id]);

  const subtotal = component.quantity * component.price;

  return (
    <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border hover:border-purple-200 transition-colors">
      {/* Información del producto */}
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {productInfo?.name || `Producto ID: ${component.id}`}
        </p>
        {productInfo && (
          <p className="text-sm text-gray-500">SKU: {productInfo.sku}</p>
        )}
      </div>

      {/* Cantidad */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Cant:</label>
        <Input
          type="number"
          min="1"
          value={component.quantity}
          onChange={(e) => onUpdateQuantity(component.id, parseInt(e.target.value) || 1)}
          className="w-20 text-center"
        />
      </div>

      {/* Precio unitario */}
      <div className="flex items-center space-x-2">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <Input
          type="number"
          min="0"
          step="1"
          value={component.price}
          onChange={(e) => onUpdatePrice(component.id, parseInt(e.target.value) || 0)}
          className="w-24 text-center"
        />
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <p className="font-medium text-green-600">
          {formatCurrency(subtotal)}
        </p>
      </div>

      {/* Botón eliminar */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(component.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
} 