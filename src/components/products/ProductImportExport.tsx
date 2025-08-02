'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { importProducts, ImportResult } from '@/actions/products/import';
import { parseExcel, parseCSV, ProductImportData } from '@/lib/import-parsers';
import { FileUploader } from '@/components/shared/FileUploader';

interface ProductImportExportProps {
  onImportComplete?: (result: ImportResult) => void;
}

interface WarehouseAnalysis {
  warehouseId: number | undefined;
  warehouseName: string;
  action: 'add' | 'update' | 'remove' | 'no-change';
  currentQuantity?: number;
  newQuantity?: number;
  reason: string;
}

interface ProductAnalysis {
  name: string;
  sku: string;
  action: 'create' | 'update' | 'no-change';
  reason: string;
  warehouses: WarehouseAnalysis[];
  hasWarehouseChanges: boolean;
}

interface AnalysisResult {
  total: number;
  toCreate: number;
  toUpdate: number;
  noChange: number;
  details: ProductAnalysis[];
  warehouseStats: {
    totalToAdd: number;
    totalToUpdate: number;
    totalToRemove: number;
    totalNoChange: number;
  };
}

export default function ProductImportExport({ onImportComplete }: ProductImportExportProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ProductImportData[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Exportar productos a Excel
  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Obtener el filtro de categoría de la URL
      const categoryId = searchParams.get('categoryId');
      
      // Construir la URL de exportación con filtros
      let exportUrl = '/api/products/export';
      if (categoryId) {
        exportUrl += `?categoryId=${categoryId}`;
      }
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Error al exportar productos');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Nombre del archivo con información del filtro
      let fileName = `productos_${new Date().toISOString().split('T')[0]}`;
      if (categoryId) {
        fileName += `_categoria_${categoryId}`;
      }
      fileName += '.xlsx';
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const message = categoryId 
        ? `Productos de la categoría ${categoryId} exportados exitosamente`
        : 'Todos los productos exportados exitosamente';
      alert(message);
    } catch (error) {
      console.error('Error exportando productos:', error);
      alert('Error al exportar productos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar archivo
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
    setPreviewData(null);
    setAnalysis(null);
    setShowPreview(false);
  };

  const handleFileRemove = () => {
    setFile(null);
    setImportResult(null);
    setPreviewData(null);
    setAnalysis(null);
    setShowPreview(false);
  };

  // Función para analizar bodegas en detalle
  const analyzeWarehouses = (excelWarehouses: any[] = [], existingWarehouses: any[] = []): WarehouseAnalysis[] => {
    // Mapear por ID si existe, si no por nombre
    const excelMap = new Map((excelWarehouses || []).map(w => [w.warehouseId ? String(w.warehouseId) : w.warehouseName, { quantity: Number(w.quantity), name: w.warehouseName }]));
    const existingMap = new Map((existingWarehouses || []).map(w => [w.warehouseId ? String(w.warehouseId) : w.warehouseName, { quantity: Number(w.quantity), name: w.warehouseName }]));
    
    const analysis: WarehouseAnalysis[] = [];
    
    // Analizar bodegas del Excel
    for (const [warehouseKey, excelData] of excelMap) {
      const existing = existingMap.get(warehouseKey);
      if (!existing) {
        // Nueva bodega
        analysis.push({
          warehouseId: undefined,
          warehouseName: excelData.name,
          action: 'add',
          newQuantity: excelData.quantity,
          reason: 'Nueva asignación de bodega'
        });
      } else if (existing.quantity !== excelData.quantity) {
        // Cantidad actualizada
        analysis.push({
          warehouseId: undefined,
          warehouseName: excelData.name,
          action: 'update',
          currentQuantity: existing.quantity,
          newQuantity: excelData.quantity,
          reason: `Stock actualizado: ${existing.quantity} → ${excelData.quantity}`
        });
      } else {
        // Sin cambios
        analysis.push({
          warehouseId: undefined,
          warehouseName: excelData.name,
          action: 'no-change',
          currentQuantity: existing.quantity,
          reason: 'Sin cambios en stock'
        });
      }
    }
    
    // Analizar bodegas existentes que no están en el Excel (serán eliminadas)
    for (const [warehouseKey, existingData] of existingMap) {
      if (!excelMap.has(warehouseKey)) {
        analysis.push({
          warehouseId: undefined,
          warehouseName: existingData.name,
          action: 'remove',
          currentQuantity: existingData.quantity,
          reason: 'Bodega será eliminada del producto'
        });
      }
    }
    
    return analysis;
  };

  // Vista previa de datos del archivo
  const handlePreview = async () => {
    if (!file) {
      alert('Selecciona un archivo primero');
      return;
    }

    try {
      setPreviewLoading(true);
      
      // Convertir archivo a buffer
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      let products: ProductImportData[];
      
      // Determinar tipo de archivo
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCSV = fileName.endsWith('.csv');
      
      if (isExcel) {
        products = parseExcel(buffer);
      } else if (isCSV) {
        const csvText = new TextDecoder().decode(uint8Array);
        products = parseCSV(csvText);
      } else {
        throw new Error('Formato de archivo no soportado');
      }
      
      // Analizar qué productos se van a crear, actualizar o no hacer nada
      const analysis = await analyzeProducts(products);
      
      setPreviewData(products);
      setAnalysis(analysis);
      setShowPreview(true);
      
      // Mostrar análisis en consola para debug
      console.log('📊 Análisis de importación:', analysis);
      
    } catch (error) {
      console.error('Error en vista previa:', error);
      alert('Error al leer el archivo: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setPreviewLoading(false);
    }
  };

  // Función para analizar productos con análisis detallado de bodegas
  const analyzeProducts = async (products: ProductImportData[]): Promise<AnalysisResult> => {
    try {
      // Obtener productos existentes para comparar
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos existentes');
      }
      const existingProducts = await response.json();

      const analysis: AnalysisResult = {
        total: products.length,
        toCreate: 0,
        toUpdate: 0,
        noChange: 0,
        details: [],
        warehouseStats: {
          totalToAdd: 0,
          totalToUpdate: 0,
          totalToRemove: 0,
          totalNoChange: 0
        }
      };
      
      products.forEach(product => {
        const existingProduct = existingProducts.find((ep: any) => 
          ep.sku === product.sku || ep.name.toLowerCase() === product.name.toLowerCase()
        );
        
        if (!existingProduct) {
          // Producto nuevo
          analysis.toCreate++;
          const warehouseAnalysis = analyzeWarehouses(product.warehouses, []);
          
          analysis.details.push({
            name: product.name,
            sku: product.sku || 'Auto-generado',
            action: 'create',
            reason: 'Producto nuevo',
            warehouses: warehouseAnalysis,
            hasWarehouseChanges: warehouseAnalysis.some(w => w.action !== 'no-change')
          });
          
          // Actualizar estadísticas de bodegas
          warehouseAnalysis.forEach(w => {
            if (w.action === 'add') analysis.warehouseStats.totalToAdd++;
          });
          
        } else {
          // Verificar si hay cambios en campos principales
          const hasChanges = 
            existingProduct.name !== product.name ||
            existingProduct.type !== product.type ||
            existingProduct.categoryName !== product.categoryName ||
            existingProduct.supplierName !== product.supplierName ||
            existingProduct.salePrice !== product.salePrice;
          
          // Analizar cambios en bodegas
          const warehouseAnalysis = analyzeWarehouses(product.warehouses, existingProduct.warehouses);
          // Cambios en bodegas: cualquier add, update o remove
          const hasWarehouseChanges = warehouseAnalysis.some(w => w.action !== 'no-change');
          
          if (hasChanges || hasWarehouseChanges) {
            analysis.toUpdate++;
            analysis.details.push({
              name: product.name,
              sku: product.sku || existingProduct.sku,
              action: 'update',
              reason: hasWarehouseChanges ? 'Cambio en bodegas' : 'Datos modificados',
              warehouses: warehouseAnalysis,
              hasWarehouseChanges
            });
          } else {
            analysis.noChange++;
            analysis.details.push({
              name: product.name,
              sku: product.sku || existingProduct.sku,
              action: 'no-change',
              reason: 'Sin cambios',
              warehouses: warehouseAnalysis,
              hasWarehouseChanges: false
            });
          }
          
          // Actualizar estadísticas de bodegas
          warehouseAnalysis.forEach(w => {
            switch (w.action) {
              case 'add': analysis.warehouseStats.totalToAdd++; break;
              case 'update': analysis.warehouseStats.totalToUpdate++; break;
              case 'remove': analysis.warehouseStats.totalToRemove++; break;
              case 'no-change': analysis.warehouseStats.totalNoChange++; break;
            }
          });
        }
      });
      
      return analysis;
    } catch (error) {
      console.error('Error analizando productos:', error);
      return {
        total: products.length,
        toCreate: products.length,
        toUpdate: 0,
        noChange: 0,
        details: products.map(p => ({
          name: p.name,
          sku: p.sku || 'Auto-generado',
          action: 'create' as const,
          reason: 'Producto nuevo (análisis no disponible)',
          warehouses: [],
          hasWarehouseChanges: false
        })),
        warehouseStats: {
          totalToAdd: 0,
          totalToUpdate: 0,
          totalToRemove: 0,
          totalNoChange: 0
        }
      };
    }
  };

  // Importar productos
  const handleImport = async () => {
    if (!file) {
      alert('Selecciona un archivo primero');
      return;
    }

    try {
      setImporting(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar');
      }

      setImportResult(result);
      setShowPreview(false); // Ocultar vista previa después de importar
      setAnalysis(null); // Limpiar análisis
      
      // Auto-refresh para mostrar cambios inmediatamente
      if (result.success) {
        // Pequeño delay para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          router.refresh();
        }, 1000);
        
        if (onImportComplete) {
          onImportComplete(result);
        }
      }

    } catch (error) {
      console.error('Error importando productos:', error);
      alert('Error al importar productos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setImporting(false);
    }
  };

  // Descargar plantilla Excel con ejemplos
  const downloadTemplate = async () => {
    try {
      // Llamar a la API de plantilla
      const response = await fetch('/api/products/template');
      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_productos_completa.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      alert('Error al descargar plantilla');
    }
  };

  // Función para renderizar badge de acción de bodega
  const renderWarehouseActionBadge = (action: string) => {
    const config = {
      'add': { color: 'bg-green-100 text-green-800', icon: '➕' },
      'update': { color: 'bg-blue-100 text-blue-800', icon: '🔄' },
      'remove': { color: 'bg-red-100 text-red-800', icon: '❌' },
      'no-change': { color: 'bg-gray-100 text-gray-800', icon: '⏸️' }
    };
    
    const configItem = config[action as keyof typeof config] || config['no-change'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${configItem.color}`}>
        {configItem.icon} {action}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6"
      >
        <h3 className="text-lg font-medium text-gray-900">Importar / Exportar Productos</h3>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exportación */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700">📤 Exportar Productos</h4>
              <p className="text-sm text-gray-600">
                Descarga todos los productos en formato Excel (.xlsx)
              </p>
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    Exportar a Excel
                  </>
                )}
              </button>
            </div>

            {/* Importación */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700">📥 Importar Productos</h4>
              <p className="text-sm text-gray-600">
                Sube un archivo Excel (.xlsx) o CSV para crear o actualizar productos
              </p>
              
              <div className="space-y-3">
                <FileUploader
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  acceptedTypes={['.xlsx', '.xls', '.csv']}
                  maxSize={10 * 1024 * 1024} // 10MB
                  disabled={importing || previewLoading}
                  loading={importing || previewLoading}
                  currentFile={file}
                  placeholder="Seleccionar archivo Excel o CSV"
                  description="o arrastra y suelta aquí"
                />
                
                <div className="flex gap-2">
                  {/* Botón Vista Previa */}
                  <button
                    onClick={handlePreview}
                    disabled={!file || importing || previewLoading}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title="Ver vista previa de los datos antes de importar"
                  >
                    {previewLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Leyendo...
                      </>
                    ) : (
                      <>
                        <span>👁️</span>
                        Vista Previa
                      </>
                    )}
                  </button>
                  
                  {/* Botón Importar */}
                  <button
                    onClick={handleImport}
                    disabled={!file || importing || previewLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title="Importar archivo directamente sin vista previa"
                  >
                    {importing ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Importando...
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        Importar Archivo
                      </>
                    )}
                  </button>
                  
                  {/* Botón Plantilla */}
                  <button
                    onClick={downloadTemplate}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm flex items-center gap-1"
                    title="Descargar plantilla Excel"
                  >
                    <span>📋</span>
                    Plantilla
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Previa de Datos Mejorada */}
          {showPreview && previewData && analysis && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-yellow-500">👁️</span>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Vista Previa - Análisis Completo de Importación
                  </h4>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-sm text-yellow-700">
                Se encontraron {previewData.length} productos en el archivo. Revisa el análisis detallado antes de importar.
              </p>
              
              {/* Análisis de Acciones de Productos */}
              <div className="mt-4 bg-white rounded-lg border border-yellow-300 p-4">
                <h5 className="text-sm font-medium text-yellow-800 mb-3">📊 Análisis de Productos</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysis.toCreate}</div>
                    <div className="text-green-700 font-medium">Nuevos</div>
                    <div className="text-xs text-gray-500">Se crearán</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analysis.toUpdate}</div>
                    <div className="text-blue-700 font-medium">Actualizar</div>
                    <div className="text-xs text-gray-500">Se modificarán</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{analysis.noChange}</div>
                    <div className="text-gray-700 font-medium">Sin Cambios</div>
                    <div className="text-xs text-gray-500">No se tocarán</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{analysis.total}</div>
                    <div className="text-yellow-700 font-medium">Total</div>
                    <div className="text-xs text-gray-500">En el archivo</div>
                  </div>
                </div>
              </div>

              {/* Análisis de Acciones de Bodegas */}
              <div className="mt-4 bg-white rounded-lg border border-yellow-300 p-4">
                <h5 className="text-sm font-medium text-yellow-800 mb-3">🏢 Análisis de Bodegas</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysis.warehouseStats.totalToAdd}</div>
                    <div className="text-green-700 font-medium">Nuevas Asignaciones</div>
                    <div className="text-xs text-gray-500">Se agregarán</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analysis.warehouseStats.totalToUpdate}</div>
                    <div className="text-blue-700 font-medium">Stock Actualizado</div>
                    <div className="text-xs text-gray-500">Se modificarán</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analysis.warehouseStats.totalToRemove}</div>
                    <div className="text-red-700 font-medium">Asignaciones Eliminadas</div>
                    <div className="text-xs text-gray-500">Se quitarán</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{analysis.warehouseStats.totalNoChange}</div>
                    <div className="text-gray-700 font-medium">Sin Cambios</div>
                    <div className="text-xs text-gray-500">Se mantienen</div>
                  </div>
                </div>
                
                {/* Advertencia sobre eliminación de bodegas */}
                {analysis.warehouseStats.totalToRemove > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span className="text-sm font-medium text-red-800">Atención: Bodegas que serán eliminadas</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      {analysis.warehouseStats.totalToRemove} asignaciones de bodegas serán eliminadas de productos existentes. 
                      Esto significa que los productos ya no estarán asociados a esas bodegas específicas.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Detalles por Producto con Análisis de Bodegas */}
              <div className="mt-4 bg-white rounded-lg border border-yellow-300 p-4">
                <h5 className="text-sm font-medium text-yellow-800 mb-3">📋 Detalles por Producto</h5>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysis.details.map((product, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.action === 'create' ? 'bg-green-100 text-green-800' :
                            product.action === 'update' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {product.action === 'create' ? '🆕' : product.action === 'update' ? '🔄' : '⏸️'} {product.action}
                          </span>
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{product.sku}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{product.reason}</p>
                      
                      {/* Análisis de bodegas del producto */}
                      {product.warehouses.length > 0 && (
                        <div className="mt-2">
                          <h6 className="text-xs font-medium text-gray-700 mb-1">Bodegas:</h6>
                          <div className="space-y-1">
                            {product.warehouses.map((warehouse, wIndex) => (
                              <div key={wIndex} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                                <div className="flex items-center gap-2">
                                  {renderWarehouseActionBadge(warehouse.action)}
                                  <span className="font-medium">{warehouse.warehouseName}</span>
                                </div>
                                <div className="text-gray-600">
                                  {warehouse.action === 'add' && (
                                    <span>Stock: {warehouse.newQuantity}</span>
                                  )}
                                  {warehouse.action === 'update' && (
                                    <span>{warehouse.currentQuantity} → {warehouse.newQuantity}</span>
                                  )}
                                  {warehouse.action === 'remove' && (
                                    <span className="text-red-600">Eliminar (stock: {warehouse.currentQuantity})</span>
                                  )}
                                  {warehouse.action === 'no-change' && (
                                    <span>Stock: {warehouse.currentQuantity}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Importando...
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      Confirmar Importación
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Resultado de importación */}
          {importResult && (
            <div className={`mt-6 p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className={`text-2xl ${importResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    {importResult.success ? '✅' : '❌'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    Resultado de la importación
                  </h4>
                  <p className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {importResult.message}
                  </p>
                  
                  {/* Estadísticas */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total:</span> {importResult.stats.total}
                    </div>
                    <div className="text-green-700">
                      <span className="font-medium">Creados:</span> {importResult.stats.created}
                    </div>
                    <div className="text-blue-700">
                      <span className="font-medium">Actualizados:</span> {importResult.stats.updated}
                    </div>
                    <div className="text-purple-700">
                      <span className="font-medium">Bodegas Asignadas:</span> {importResult.stats.warehousesAssigned}
                    </div>
                    <div className="text-orange-700">
                      <span className="font-medium">Bodegas Eliminadas:</span> {importResult.stats.warehousesRemoved || 0}
                    </div>
                    <div className="text-red-700">
                      <span className="font-medium">Errores:</span> {importResult.stats.errors}
                    </div>
                  </div>

                  {/* Errores detallados */}
                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h5>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="text-xs text-red-700 space-y-1">
                          {importResult.errors.map((error, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advertencia sobre Stock */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">🔒 IMPORTANTE - Restricción de Stock:</h4>
            <div className="text-sm text-red-700 space-y-2">
              <p>• <strong>El stock NO se puede modificar durante la importación</strong></p>
              <p>• <strong>Los productos se asignan a bodegas con stock inicial = 0</strong></p>
              <p>• <strong>Para modificar cantidades, utiliza el sistema de "Ajuste de Inventario"</strong></p>
              <p>• <strong>Esta restricción garantiza el control adecuado del inventario</strong></p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Plantilla Excel Completa:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Una sola plantilla</strong> para todos los tipos de producto</li>
              <li>• <strong>3 hojas incluidas</strong>: Plantilla con ejemplos, Instrucciones detalladas, Tipos de producto</li>
              <li>• <strong>Ejemplos reales</strong> de CONSUMIBLE, ALMACENABLE, SERVICIO y productos sin SKU</li>
              <li>• <strong>Identificación por SKU</strong>: Si existe se actualiza, si no existe se crea nuevo</li>
              <li>• <strong>Relaciones automáticas</strong>: Usa nombres de categorías, proveedores y bodegas</li>
              <li>• <strong>Asignación múltiple de bodegas</strong>: Puede asignar productos a varias bodegas</li>
              <li>• <strong>Compatible con CSV</strong> si prefieres ese formato</li>
              <li>• <strong>Vista previa mejorada</strong>: Análisis detallado de productos y bodegas antes de importar</li>
              <li>• <strong>Transparencia total</strong>: Muestra exactamente qué bodegas se agregarán, actualizarán o eliminarán</li>
              <li>• <strong>Stock controlado</strong>: Los productos se asignan con stock inicial 0, usa Ajuste de Inventario para cantidades</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 