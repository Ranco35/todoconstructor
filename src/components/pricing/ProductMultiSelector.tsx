'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getProductsForPricing } from '@/actions/pricing/price-management-actions';
import { getAllCategories } from '@/actions/configuration/category-actions';
import { calculatePromotionPrice, ActivePromotion } from '@/lib/promotions-utils';
import { formatPrice } from '@/utils/price-utils';

interface ProductMultiSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  promotionType?: ActivePromotion['promotionType'];
  promotionValue?: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  costprice: number;
  saleprice: number;
  finalPrice: number;
  vat: number;
  stock: number;
  categoryName?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductMultiSelector({ selectedIds, onChange, promotionType, promotionValue }: ProductMultiSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [mounted, setMounted] = useState(false);
  const pageSize = 50;

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      setMounted(true);
      loadCategories();
    }
  }, []);

  useEffect(() => {
    // Solo ejecutar en el cliente y después de montar
    if (typeof window !== 'undefined' && mounted) {
      loadProducts();
    }
  }, [mounted, search, categoryFilter, page]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getAllCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Asegurar que haya un array vacío en caso de error
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (categoryFilter) {
        params.categoryId = categoryFilter;
      }

      const result = await getProductsForPricing(params);
      
      if (result.success && result.data) {
        // Mapear los datos asegurando que vat esté presente
        const mappedProducts = result.data.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          costprice: p.costPrice || 0,
          saleprice: p.salePrice || 0,
          finalPrice: p.finalPrice || 0,
          vat: p.vat || 19, // Default 19% si no viene
          stock: p.stock || 0,
          categoryName: p.categoryName || undefined
        }));
        setProducts(mappedProducts);
        setTotal(result.total || 0);
      } else {
        console.error('Error from server:', result.error);
        setProducts([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, page]);

  const handleToggle = (productId: number) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter(id => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  // Calcular precio con promoción aplicada
  const calculatePromotionPrice = (originalPrice: number): number => {
    if (!promotionType || !promotionValue || promotionValue <= 0) {
      return originalPrice;
    }

    let finalPrice = originalPrice;

    switch (promotionType) {
      case 'discount_percentage':
        finalPrice = originalPrice * (1 - promotionValue / 100);
        break;
      case 'discount_fixed':
        finalPrice = originalPrice - promotionValue;
        break;
      case 'markup_percentage':
        finalPrice = originalPrice * (1 + promotionValue / 100);
        break;
      case 'markup_fixed':
        finalPrice = originalPrice + promotionValue;
        break;
      case 'special_price':
        finalPrice = promotionValue;
        break;
    }

    return Math.max(finalPrice, 0); // No permitir precios negativos
  };

  const handleSelectAll = () => {
    const allIds = products.map(p => p.id);
    const newSelected = [...new Set([...selectedIds, ...allIds])];
    onChange(newSelected);
  };

  const handleDeselectAll = () => {
    const currentPageIds = products.map(p => p.id);
    onChange(selectedIds.filter(id => !currentPageIds.includes(id)));
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Seleccionar Productos
          {selectedIds.length > 0 && (
            <span className="ml-2 text-blue-600">({selectedIds.length} seleccionados)</span>
          )}
        </h4>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Búsqueda */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o SKU..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filtro por categoría */}
          <div>
            <select
              value={categoryFilter || ''}
              onChange={(e) => {
                setCategoryFilter(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de selección */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Seleccionar todos (página)
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Deseleccionar todos (página)
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Cargando productos...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && products.every(p => selectedIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleSelectAll();
                        } else {
                          handleDeselectAll();
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Precio Venta</th>
                  {promotionType && typeof promotionValue === 'number' && promotionValue > 0 && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase bg-green-50">
                      Precio con Descuento
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Costo + IVA</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={promotionType && typeof promotionValue === 'number' && promotionValue > 0 ? 7 : 6} className="px-3 py-4 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr 
                      key={product.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedIds.includes(product.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => handleToggle(product.id)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => handleToggle(product.id)}
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900">{product.name}</td>
                      <td className="px-3 py-2 text-gray-600">{product.sku || '-'}</td>
                      <td className="px-3 py-2 text-gray-900 font-medium">
                        {formatPrice(product.finalPrice || product.saleprice || 0)}
                      </td>
                      {promotionType && typeof promotionValue === 'number' && promotionValue > 0 && (
                        <td className="px-3 py-2 bg-green-50">
                          {(() => {
                            const originalPrice = product.finalPrice || product.saleprice || 0;
                            const promotionPrice = calculatePromotionPrice(originalPrice);
                            const savings = originalPrice - promotionPrice;
                            const savingsPercent = originalPrice > 0 ? (savings / originalPrice * 100) : 0;
                            
                            return (
                              <div>
                                <div className="text-green-700 font-bold">
                                  {formatPrice(promotionPrice)}
                                </div>
                                {savings > 0 && (
                                  <div className="text-xs text-green-600">
                                    Ahorro: {formatPrice(savings)} ({savingsPercent.toFixed(0)}%)
                                  </div>
                                )}
                                {savings < 0 && (
                                  <div className="text-xs text-red-600">
                                    Aumento: {formatPrice(Math.abs(savings))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      )}
                      <td className="px-3 py-2 text-gray-600">
                        {(() => {
                          const costPrice = product.costprice || 0;
                          const vatRate = product.vat || 0;
                          const costWithVat = costPrice * (1 + vatRate / 100);
                          return formatPrice(costWithVat);
                        })()}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {product.stock !== undefined ? product.stock : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Página {page} de {totalPages} ({total} productos totales)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

