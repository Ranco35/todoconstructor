'use client';

import React, { useState, useEffect } from 'react';
import { getProducts } from '@/actions/products/list';

interface Product {
  id: number;
  name: string;
  sku?: string | null;
  costprice?: number | null;
  saleprice?: number | null;
  Category?: {
    id: number;
    name: string;
  } | null;
  Supplier?: {
    name: string;
  } | null;
}

interface ProductSelectorProps {
  value?: number;
  onChange: (product: Product | null) => void;
  placeholder?: string;
  categoryFilter?: number;
}

export default function ProductSelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar producto del sistema", 
  categoryFilter 
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts({ page: 1, pageSize: 100 }); // Cargar hasta 100 productos
        
        let filteredProducts = response.products;
        
        // Filtrar por categoría si está especificada
        if (categoryFilter) {
          filteredProducts = response.products.filter(
            product => product.categoryid === categoryFilter
          );
        }
        
        setProducts(filteredProducts);
        setError(null);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setError('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryFilter]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === '') {
      onChange(null);
    } else {
      const selectedProduct = products.find(p => p.id === parseInt(selectedValue));
      onChange(selectedProduct || null);
    }
  };

  if (error) {
    return (
      <div className="mt-1">
        <select 
          disabled 
          className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
        >
          <option>Error al cargar productos</option>
        </select>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={loading}
        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          loading ? 'bg-gray-100 text-gray-500' : 'bg-white'
        }`}
      >
        <option value="">
          {loading ? 'Cargando productos...' : placeholder}
        </option>
        <option value="" disabled>── Productos Existentes ──</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
            {product.sku && ` (${product.sku})`}
            {product.Category && ` • ${product.Category.name}`}
            {product.costprice && ` • $${product.costprice.toLocaleString()}`}
          </option>
        ))}
        {!loading && products.length === 0 && (
          <option value="" disabled>No hay productos disponibles</option>
        )}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando productos del sistema...</p>
      )}
      
      {!loading && products.length === 0 && (
        <div className="mt-1">
          <p className="text-sm text-gray-500">
            {categoryFilter ? 'No hay productos en esta categoría.' : 'No hay productos disponibles.'}
          </p>
          <p className="text-sm text-blue-600">
                            <a href="/dashboard/configuration/products/create" className="underline">
              Crear nuevo producto →
            </a>
          </p>
        </div>
      )}
      
      {categoryFilter && (
        <p className="mt-1 text-xs text-blue-600">
          Mostrando solo productos de la categoría seleccionada
        </p>
      )}
    </div>
  );
} 