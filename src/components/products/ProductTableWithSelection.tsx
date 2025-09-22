'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernTable, ModernColumnDef } from '@/components/shared/ModernTable';
import { Package, Tag, Eye, Trash2, EyeOff, Menu, Download, Settings, X } from 'lucide-react';
import { deleteProduct } from '@/actions/products/list';
import { bulkDeleteProducts } from '@/actions/products/bulk-delete';
import { bulkDuplicateProducts } from '@/actions/products/bulk-duplicate';
import ProductRowActions from './ProductRowActions';
import { ProductFrontend } from '@/lib/product-mapper';
import ProductDetailModal from './ProductDetailModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CollapsibleSection from '@/components/shared/CollapsibleSection';
import ColumnSelectorModal from '@/components/shared/ColumnSelectorModal';
import { usePersistentState } from '@/hooks/usePersistentState';

interface ProductTableWithSelectionProps {
  products: ProductFrontend[];
  onBulkDelete?: (deletedCount: number) => void;
}

const COLUMN_OPTIONS = [
  { key: 'sku', label: 'SKU' },
  { key: 'type', label: 'Tipo' },
  { key: 'brand', label: 'Marca' },
  { key: 'salePrice', label: 'Precio de venta' },
  { key: 'finalPrice', label: 'Precio Final (IVA incl.)' },
  { key: 'costPrice', label: 'Coste' },
  { key: 'stock', label: 'Stock' },
  { key: 'warehouse', label: 'Bodega' },
  { key: 'category', label: 'Categoría' },
  { key: 'supplier', label: 'Proveedor' },
  { key: 'posEnabled', label: 'Punto de Venta' },
];

export default function ProductTableWithSelection({ 
  products, 
  onBulkDelete
}: ProductTableWithSelectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    products: ProductFrontend[];
  }>({ show: false, products: [] });
  const [duplicateConfirmation, setDuplicateConfirmation] = useState<{
    show: boolean;
    products: ProductFrontend[];
  }>({ show: false, products: [] });
  const [showActions, setShowActions] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
  
  // Usar hook personalizado para estado persistente de columnas
  const [visibleColumns, setVisibleColumns] = usePersistentState<string[]>(
    'productTableColumns',
    COLUMN_OPTIONS.map(c => c.key)
  );
  
  // Usar hook personalizado para estado persistente del buscador
  const [searchTerm, setSearchTerm] = usePersistentState<string>(
    'productTableSearch',
    ''
  );
  
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handleColumnsChange = (newColumns: string[]) => {
    setVisibleColumns(newColumns);
  };

  // Función para manejar doble clic en el nombre del producto
  const handleProductDoubleClick = (productId: number) => {
    setSelectedProductId(productId);
    setModalOpen(true);
  };

  // Callback para manejar eliminación individual exitosa
  const handleIndividualDeleteSuccess = () => {
    console.log('✅ ProductTableWithSelection: Producto eliminado exitosamente, actualizando UI');
    router.refresh();
  };

  // Función para confirmar duplicación múltiple
  const handleConfirmBulkDuplicate = async () => {
    setIsDuplicating(true);
    
    try {
      const productIds = duplicateConfirmation.products.map(p => p.id);
      const result = await bulkDuplicateProducts(productIds);
      
      // Mostrar resultado
      if (result.success) {
        alert(result.message);
        if (result.errors.length > 0) {
          console.warn('Errores durante duplicación:', result.errors);
        }
      } else {
        alert(`Error: ${result.message}`);
        if (result.errors.length > 0) {
          console.error('Errores:', result.errors);
        }
      }

      // Limpiar selección
      setSelectedProducts(new Set());
      setDuplicateConfirmation({ show: false, products: [] });
      
      // Recargar página para mostrar cambios
      router.refresh();
      
    } catch (error) {
      console.error('Error en duplicación múltiple:', error);
      alert('Error interno al duplicar productos');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Función para confirmar eliminación múltiple
  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    
    try {
      const productIds = deleteConfirmation.products.map(p => p.id);
      const result = await bulkDeleteProducts(productIds);
      
      // Mostrar resultado
      if (result.success) {
        alert(result.message);
        if (result.errors.length > 0) {
          console.warn('Errores durante eliminación:', result.errors);
        }
      } else {
        alert(`Error: ${result.message}`);
        if (result.errors.length > 0) {
          console.error('Errores:', result.errors);
        }
      }

      // Limpiar selección
      setSelectedProducts(new Set());
      setDeleteConfirmation({ show: false, products: [] });
      
      // Notificar al componente padre
      if (onBulkDelete) {
        onBulkDelete(result.deletedCount);
      }
      
      // Recargar página para mostrar cambios
      router.refresh();
      
    } catch (error) {
      console.error('Error en eliminación múltiple:', error);
      alert('Error interno al eliminar productos');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler para exportar productos seleccionados
  const handleBulkExportExcel = async (selectedIds: number[]) => {
    if (!selectedIds.length) return;
    try {
      setIsExporting(true);
      const response = await fetch('/api/products/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (!response.ok) throw new Error('Error al exportar productos seleccionados');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `productos_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Productos seleccionados exportados exitosamente');
    } catch (error) {
      alert('Error al exportar productos seleccionados: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsExporting(false);
    }
  };

  const formatPriceWithVat = (salePrice: number | undefined, vat: number | undefined) => {
    if (!salePrice) return '-';
    const vatRate = vat ?? 19;
    const final = Math.round(salePrice * (1 + vatRate / 100));
    return final.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Definición de columnas para la tabla moderna
  const productColumns: ModernColumnDef<ProductFrontend>[] = [
    showActions ? {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex justify-center items-center" style={{ minWidth: '80px' }}>
          <ProductRowActions 
            productId={row.id} 
            deleteAction={deleteProduct}
            onDeleteSuccess={handleIndividualDeleteSuccess}
          />
        </div>
      ),
    } : null,
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
    visibleColumns.includes('sku') && {
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
    visibleColumns.includes('type') && {
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
    visibleColumns.includes('brand') && {
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
    visibleColumns.includes('salePrice') && {
      header: 'Precio de venta',
      cell: (row) => (
        <span className="text-blue-700 font-bold">${row.salePrice?.toLocaleString('es-CL') || '-'}</span>
      )
    },
    visibleColumns.includes('finalPrice') && {
      header: 'Precio Final (IVA incl.)',
      cell: (row) => (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
          <span className="text-green-700 font-bold text-lg">
            ${formatPriceWithVat(row.salePrice, row.vat)}
          </span>
          <div className="text-xs text-green-700 font-medium mt-1">IVA incluido</div>
        </div>
      ),
    },
    visibleColumns.includes('costPrice') && {
      header: 'Coste',
      cell: (row) => (
        <span className="text-gray-700 font-bold">${row.costPrice?.toLocaleString('es-CL') || '-'}</span>
      )
    },
    visibleColumns.includes('stock') && {
      header: 'Stock',
      cell: (row) => (
        <span className="text-purple-700 font-bold">{row.Warehouse_Products?.reduce((acc, wp) => acc + (wp.quantity || 0), 0) ?? '-'}</span>
      )
    },
    visibleColumns.includes('warehouse') && {
      header: 'Bodega',
      cell: (row) => {
        const warehouses = row.Warehouse_Products || [];
        const warehouseNames = warehouses.map(wp => wp.Warehouse?.name).filter(Boolean);
        
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
    visibleColumns.includes('category') && {
      header: 'Categoría',
      cell: (row) => (
        <span className="text-xs text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200">{row.Category?.name || '-'}</span>
      )
    },
    visibleColumns.includes('supplier') && {
      header: 'Proveedor',
      cell: (row) => (
        <span className="text-xs text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">{row.Supplier?.name || '-'}</span>
      )
    },
    visibleColumns.includes('posEnabled') && {
      header: 'Punto de Venta',
      cell: (row) => (
        <div className="min-w-0 flex justify-center" style={{ minWidth: '120px' }}>
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
  ].filter(Boolean) as ModernColumnDef<ProductFrontend>[];

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length && products.length > 0) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Solo la tabla - todas las acciones están en ProductFiltersInline arriba */}





      {/* Tabla de productos */}
      <ModernTable
        data={products}
        columns={productColumns.filter(Boolean) as ModernColumnDef<ProductFrontend>[]}
        rowKey="id"
        showBulkActions={true}
        selectedRowIds={Array.from(selectedProducts)}
        onRowSelectChange={(ids) => setSelectedProducts(new Set(ids as number[]))}
        onBulkDelete={handleConfirmBulkDelete}
        onBulkDuplicate={handleConfirmBulkDuplicate}
        showHeader={false}
        showFiltersButton={true}
        showColumnsButton={true}
        onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
        onColumnsToggle={() => setColumnSelectorOpen(!columnSelectorOpen)}
        // Agregar búsqueda persistente
        searchPlaceholder="Buscar productos..."
        showSearchControls={true}
        persistentSearchKey="productTableSearch"
        onSearchChange={setSearchTerm}
      />

      {/* Modal de detalles */}
      {modalOpen && selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProductId(null);
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar eliminación múltiple
            </h3>
            
            <Alert className="mb-4">
              <AlertDescription>
                ¿Estás seguro de que deseas eliminar {deleteConfirmation.products.length} producto{deleteConfirmation.products.length !== 1 ? 's' : ''}?
                Esta acción no se puede deshacer.
              </AlertDescription>
            </Alert>

            <div className="max-h-32 overflow-y-auto mb-4">
              <ul className="text-sm text-gray-600">
                {deleteConfirmation.products.map(product => (
                  <li key={product.id} className="flex items-center gap-2 py-1">
                    <Package className="h-3 w-3" />
                    {product.name} {product.sku && `(${product.sku})`}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setDeleteConfirmation({ show: false, products: [] })}
                variant="outline"
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmBulkDelete}
                variant="destructive"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de duplicación */}
      {duplicateConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar duplicación múltiple
            </h3>
            
            <Alert className="mb-4">
              <AlertDescription>
                ¿Estás seguro de que deseas duplicar {duplicateConfirmation.products.length} producto{duplicateConfirmation.products.length !== 1 ? 's' : ''}?
                Se crearán copias con el sufijo "-COPIA".
              </AlertDescription>
            </Alert>

            <div className="max-h-32 overflow-y-auto mb-4">
              <ul className="text-sm text-gray-600">
                {duplicateConfirmation.products.map(product => (
                  <li key={product.id} className="flex items-center gap-2 py-1">
                    <Package className="h-3 w-3" />
                    {product.name} {product.sku && `(${product.sku})`}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setDuplicateConfirmation({ show: false, products: [] })}
                variant="outline"
                disabled={isDuplicating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmBulkDuplicate}
                variant="default"
                disabled={isDuplicating}
              >
                {isDuplicating ? 'Duplicando...' : 'Duplicar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selector de columnas */}
      <ColumnSelectorModal
        isOpen={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        columns={COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onColumnsChange={handleColumnsChange}
        storageKey="productTableColumns"
      />
    </div>
  );
} 