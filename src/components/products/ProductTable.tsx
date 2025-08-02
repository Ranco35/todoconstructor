'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ModernTable, ModernColumnDef } from '@/components/shared/ModernTable';
import { Package, Tag, Eye } from 'lucide-react';
import { deleteProduct } from '@/actions/products/list';
import ProductRowActions from './ProductRowActions';
import { ProductFrontend } from '@/lib/product-mapper';
import ProductDetailModal from './ProductDetailModal';

interface ProductTableProps {
  products: ProductFrontend[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);
  const router = useRouter();
  
  // Log global para ver qué datos llegan a la tabla
  console.log('🟦 [ProductTable] products:', products);

  // Función para manejar doble clic en el nombre del producto
  const handleProductDoubleClick = (productId: number) => {
    setSelectedProductId(productId);
    setModalOpen(true);
  };

  // Callback para manejar eliminación individual exitosa
  const handleIndividualDeleteSuccess = () => {
    console.log('✅ ProductTable: Producto eliminado exitosamente, actualizando UI');
    router.refresh();
  };

  // Definición de columnas para la tabla moderna
  const productColumns: ModernColumnDef<ProductFrontend>[] = [
    { 
      header: 'Producto', 
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div 
          className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200" 
          style={{ minWidth: '180px' }}
          onDoubleClick={() => handleProductDoubleClick(row.id)}
          title="Doble clic para ver detalles"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600" title={row.name}>
              {row.name}
            </div>
            <div className="text-gray-600 text-xs mt-1">ID: {row.id}</div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      )
    },
    { 
      header: 'SKU', 
      accessorKey: 'sku',
      sortable: true,
      cell: (row) => (
        <div className="min-w-0" style={{ minWidth: '100px' }}>
          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 inline-block truncate max-w-24" title={row.sku || 'Sin SKU'}>
            {row.sku || 'Sin SKU'}
          </span>
        </div>
      )
    },
    { 
      header: 'Tipo', 
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <div className="min-w-0" style={{ minWidth: '100px' }}>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 inline-block truncate max-w-24" title={row.type || 'N/A'}>
            {row.type || 'N/A'}
          </span>
        </div>
      )
    },
    { 
      header: 'Marca', 
      accessorKey: 'brand',
      sortable: true,
      cell: (row) => (
        <div className="min-w-0" style={{ minWidth: '80px' }}>
          <span className="text-sm text-gray-900 font-medium truncate block" title={row.brand || 'Sin marca'}>
            {row.brand || 'Sin marca'}
          </span>
        </div>
      )
    },
    { 
      header: 'Categoría',
      cell: (row) => (
        <div className="min-w-0" style={{ minWidth: '120px' }}>
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 max-w-28" title={row.Category?.name || 'Sin categoría'}>
            <Tag className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{row.Category?.name || 'Sin categoría'}</span>
          </span>
        </div>
      )
    },
    { 
      header: 'Bodegas',
      cell: (row) => {
        // Log por fila para ver qué llega en Warehouse_Products
        console.log('🟩 [ProductTable] row.Warehouse_Products:', row.Warehouse_Products, 'row:', row);
        const warehouses = row.Warehouse_Products || [];
        const warehouseNames = warehouses.map(wp => {
          console.log('🟨 [ProductTable] wp:', wp);
          return wp.Warehouse?.name;
        }).filter(Boolean);
        if (warehouseNames.length === 0) {
          return (
            <div className="min-w-0" style={{ minWidth: '120px' }}>
              <span className="text-xs text-gray-500 italic">Sin bodegas</span>
            </div>
          );
        }
        if (warehouseNames.length === 1) {
          return (
            <div className="min-w-0" style={{ minWidth: '120px' }}>
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 max-w-28" title={warehouseNames[0]}>
                <span className="truncate">🏭 {warehouseNames[0]}</span>
              </span>
            </div>
          );
        }
        return (
          <div className="min-w-0" style={{ minWidth: '120px' }}>
            <div className="flex flex-wrap gap-1">
              {warehouseNames.slice(0, 2).map((name, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                  title={name}
                >
                  <span className="truncate max-w-16">🏭 {name}</span>
                </span>
              ))}
              {warehouseNames.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  +{warehouseNames.length - 2}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Estado',
      cell: (row) => {
        // Buscar el stock total sumando todas las bodegas
        const stock = (row.Warehouse_Products || []).reduce((acc, wp) => acc + (wp.quantity || 0), 0);
        const estado = stock === 0 ? 'agotado' : stock <= 10 ? 'stock-bajo' : 'activo';
        return (
          <div style={{ minWidth: '90px' }}>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
              estado === 'activo' ? 'bg-green-100 text-green-800' :
              estado === 'agotado' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {estado === 'agotado' ? 'Sin Stock' : estado === 'stock-bajo' ? 'Stock Bajo' : 'Activo'}
            </span>
          </div>
        );
      }
    },
    { 
      header: 'P. Costo', 
      accessorKey: 'costPrice',
      sortable: true,
      cell: (row) => (
        <div className="text-right" style={{ minWidth: '80px' }}>
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            ${row.costPrice?.toLocaleString() || '0'}
          </span>
        </div>
      )
    },
    { 
      header: 'P. Venta', 
      accessorKey: 'salePrice',
      sortable: true,
      cell: (row) => {
        // Mostrar precio final congelado si está disponible, sino precio calculado
        const calculatedPrice = row.salePrice && row.vat ? Math.round(row.salePrice * (1 + row.vat / 100)) : 0;
        const displayPrice = row.finalPrice && row.finalPrice > 0 ? row.finalPrice : calculatedPrice;
        const isFrozen = row.finalPrice !== null && row.finalPrice !== undefined && row.finalPrice > 0;
        
        // Debug: Log para verificar qué precio se está mostrando
        if (row.id === 1176) {
          console.log('🔍 DEBUG - Producto 1176 en tabla:', {
            id: row.id,
            name: row.name,
            salePrice: row.salePrice,
            vat: row.vat,
            calculatedPrice: calculatedPrice,
            finalPrice: row.finalPrice,
            displayPrice: displayPrice,
            isFrozen: isFrozen,
            rowData: row, // Mostrar todos los datos del row
            finalPriceType: typeof row.finalPrice,
            finalPriceValue: row.finalPrice,
            finalPriceGreaterThanZero: row.finalPrice > 0
          });
        }
        
        return (
          <div className="text-right" style={{ minWidth: '80px' }}>
            <div className="flex flex-col items-end">
              <span className={`text-sm font-semibold whitespace-nowrap ${
                isFrozen ? 'text-green-700' : 'text-green-600'
              }`}>
                ${displayPrice?.toLocaleString() || '0'}
              </span>
              {isFrozen && (
                <span className="text-xs text-green-600 font-medium">
                  🔒 Final
                </span>
              )}
              {/* Debug: Mostrar información adicional para producto 1176 */}
              {row.id === 1176 && (
                <span className="text-xs text-red-600 font-medium">
                  DEBUG: {displayPrice} (frozen: {isFrozen ? 'true' : 'false'})
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Margen',
      cell: (row) => {
        const margen = row.salePrice && row.costPrice 
          ? ((row.salePrice - row.costPrice) / row.costPrice * 100).toFixed(1)
          : '0';
        return (
          <div className="text-center" style={{ minWidth: '60px' }}>
            <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
              {margen}%
            </span>
          </div>
        );
      }
    },
    {
      header: 'Stock',
      cell: (row) => {
        // Sumar el stock de todas las bodegas asociadas
        const stock = (row.Warehouse_Products || []).reduce((acc, wp) => acc + (wp.quantity || 0), 0);
        return (
          <div className="flex items-center justify-center gap-1" style={{ minWidth: '70px' }}>
            <span className={`text-sm font-semibold ${
              stock > 10 ? 'text-green-600' :
              stock > 0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {stock}
            </span>
            <span className="text-xs text-gray-500">uds</span>
          </div>
        );
      }
    },
    {
      header: 'Punto de Venta',
      cell: (row) => (
        <div className="flex justify-center" style={{ minWidth: '120px' }}>
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
            row.isPOSEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {row.isPOSEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}
          </span>
        </div>
      )
    },
    {
      header: 'Acciones',
      cell: (row) => (
        <ProductRowActions 
          productId={row.id} 
          deleteAction={deleteProduct}
          onDeleteSuccess={handleIndividualDeleteSuccess}
        />
      ),
    },
  ];

  return (
    <>
      <ModernTable
        columns={productColumns}
        data={products}
        rowKey="id"
      />
      <ProductDetailModal
        productId={selectedProductId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
} 