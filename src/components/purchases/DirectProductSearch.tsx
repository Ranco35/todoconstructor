'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X
} from 'lucide-react';
import { getProducts } from '@/lib/client-actions';
import { ProductFrontend } from '@/lib/product-mapper';

interface DirectProductSearchProps {
  onProductSelect: (product: ProductFrontend) => void;
  placeholder?: string;
  selectedProducts?: ProductFrontend[];
}

export default function DirectProductSearch({
  onProductSelect,
  placeholder = "Buscar productos por nombre, SKU, marca...",
  selectedProducts = []
}: DirectProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductFrontend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchProducts(searchTerm.trim());
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchProducts = async (term: string) => {
    setIsSearching(true);
    try {
      const result = await getProducts({
        search: term,
        page: 1,
        pageSize: 50, // Limitar resultados para búsqueda rápida
      });
      setSearchResults(result.products);
      setShowResults(true);
    } catch (error) {
      console.error('Error buscando productos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductSelect = (product: ProductFrontend) => {
    // Verificar que no esté ya seleccionado
    const isAlreadySelected = selectedProducts.some(p => p.id === product.id);
    
    if (!isAlreadySelected) {
      onProductSelect(product);
      setSearchTerm('');
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        
        {/* Botón para limpiar búsqueda */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Indicador de búsqueda */}
        {isSearching && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Mensaje de ayuda */}
      {!searchTerm && (
        <div className="text-sm text-gray-500">
          Escribe al menos 2 caracteres para buscar productos
        </div>
      )}

      {/* Resultados de búsqueda */}
      {showResults && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Buscando productos...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <Alert className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se encontraron productos que coincidan con "{searchTerm}"
              </AlertDescription>
            </Alert>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2 border-b bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {searchResults.length} producto{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-1 p-2">
                {searchResults.map((product) => {
                  const isAlreadySelected = selectedProducts.some(p => p.id === product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        isAlreadySelected
                          ? 'border-green-500 bg-green-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => !isAlreadySelected && handleProductSelect(product)}
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
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                SKU: {product.sku}
                              </span>
                            )}
                            {product.brand && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                {product.brand}
                              </span>
                            )}
                            {product.salePrice && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-medium">
                                ${product.salePrice.toLocaleString()}
                              </span>
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
                        {isAlreadySelected ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Agregado</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            Seleccionar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 