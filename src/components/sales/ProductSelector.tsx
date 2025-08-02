'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { getProductsForSales, type ProductForSales } from '@/actions/sales/products';
import { Input } from '@/components/ui/input';
import { ModernTable, ModernColumnDef } from '@/components/shared/ModernTable';

interface ProductSelectorProps {
  onSelect: (product: ProductForSales) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedProductId?: string;
  initialValue?: string;
  className?: string;
}

export default function ProductSelector({ 
  onSelect, 
  placeholder = "Buscar producto...", 
  disabled = false,
  selectedProductId,
  initialValue,
  className = ""
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue || '');
  const [products, setProducts] = useState<ProductForSales[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductForSales | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);

  // Buscar productos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.length < 2) {
      setProducts([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    getProductsForSales({ search: searchTerm, active: true, limit: 20 })
      .then(result => {
        if (result.success && result.data) {
          setProducts(result.data);
          setShowDropdown(true);
        } else {
          setProducts([]);
          setShowDropdown(false);
        }
      })
      .catch(() => {
        setProducts([]);
        setShowDropdown(false);
      })
      .finally(() => setLoading(false));
  }, [searchTerm]);

  // Actualizar searchTerm cuando cambie initialValue (para modo edición)
  useEffect(() => {
    if (initialValue && initialValue !== searchTerm) {
      setSearchTerm(initialValue);
      // Si tenemos un valor inicial, crear un producto mock para mostrar
      if (initialValue && !selectedProduct) {
        setSelectedProduct({
          id: selectedProductId || '',
          name: initialValue,
          defaultCode: '',
          description: '',
          salePrice: 0,
          costPrice: 0,
          vat: 19,
          type: '',
          active: true,
          hasStock: true
        });
      }
    }
  }, [initialValue]);

  // Cargar producto seleccionado si se proporciona ID
  useEffect(() => {
    if (selectedProductId && !selectedProduct && !initialValue) {
      getProductsForSales({ search: selectedProductId, limit: 1 })
        .then(result => {
          if (result.success && result.data && result.data.length > 0) {
            const product = result.data[0];
            setSelectedProduct(product);
            setSearchTerm(product.name);
          }
        });
    }
  }, [selectedProductId, selectedProduct]);

  // Manejar clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular posición del dropdown al mostrarlo
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showDropdown, products.length]);

  // Columnas para la tabla tipo ProductTable
  const columns: ModernColumnDef<ProductForSales>[] = [
    {
      header: 'Nombre',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="font-semibold text-gray-900 whitespace-normal break-words text-left" style={{wordBreak: 'break-word', whiteSpace: 'normal', minWidth: 180, maxWidth: 320, display: 'block'}}>{row.name}</span>
    },
    {
      header: 'SKU',
      accessorKey: 'defaultCode',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs text-blue-700">{row.defaultCode}</span>
    },
    {
      header: 'Tipo',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => <span className="text-xs text-indigo-700">{row.type}</span>
    },
    {
      header: 'Categoría',
      cell: (row) => <span className="text-xs text-blue-800">{row.category?.name || 'Sin categoría'}</span>
    },
    {
      header: 'Stock',
      cell: (row) => <span className={`text-sm font-semibold ${row.availableStock > 10 ? 'text-green-600' : row.availableStock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>{row.availableStock ?? '-'}</span>
    },
    {
      header: 'Precio',
      accessorKey: 'salePrice',
      sortable: true,
      cell: (row) => <span className="text-sm font-semibold text-green-600">${row.salePrice?.toLocaleString('es-CL') || '0'}</span>
    },
  ];

  const handleProductSelect = (product: ProductForSales) => {
    console.log('🔄 handleProductSelect llamado con:', product.name);
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowDropdown(false);
    if (onSelect) {
      console.log('✅ Llamando onSelect con producto:', product.name);
      onSelect(product);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (selectedProduct && value !== selectedProduct.name) {
      setSelectedProduct(null);
    }
  };

  // Renderizado del dropdown usando portal (ahora tipo lista amigable)
  const dropdownContent = showDropdown && (
    <div
      className="z-50 mt-2"
      style={{
        position: 'absolute',
        top: dropdownPosition?.top ?? 0,
        left: dropdownPosition?.left ?? 0,
        width: dropdownPosition?.width ?? 400,
        minWidth: 240,
        maxWidth: 600,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        boxShadow: '0 8px 32px 0 rgba(60,60,120,0.10)',
        padding: 8,
        maxHeight: 384,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {products.length > 0 ? (
        <ul className="space-y-1">
          {products.map((product) => (
            <li
              key={product.id}
              className="cursor-pointer px-4 py-2 hover:bg-blue-50 rounded-lg transition flex flex-col gap-1"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click en producto:', product.name);
                handleProductSelect(product);
              }}
            >
              <span className="font-semibold text-gray-900 whitespace-normal break-words text-left" style={{wordBreak: 'break-word', whiteSpace: 'normal'}}>
                {product.name}
              </span>
              <span className="text-xs text-blue-700 font-mono">{product.defaultCode}</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-green-700 font-bold">
                  Precio: ${Math.round(product.salePrice || 0).toLocaleString('es-CL')}
                </span>
                <span className="text-xs text-purple-700 font-semibold">
                  Con IVA: ${Math.round((product.salePrice || 0) * 1.19).toLocaleString('es-CL')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No se encontraron productos. Intenta con otro término de búsqueda.</p>
        </div>
      )}
    </div>
  );

  return (
    <div ref={searchRef} className={`relative ${className}`} data-component="product-selector"> 
      {/* Input de búsqueda */}
      <div style={{textAlign: 'left'}}>
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 !text-left product-selector-input"
          style={{textAlign: 'left'}}
          onFocus={() => {
            if (products.length > 0) setShowDropdown(true);
          }}
        />
      </div>
      {dropdownContent && dropdownPosition && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
} 