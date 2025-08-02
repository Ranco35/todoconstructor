'use client';

import { useState } from 'react';
import { FileDown, FileUp, Download, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import SuppliersTableWithSelection from './SuppliersTableWithSelection';

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  city?: string;
  isActive: boolean;
  supplierRank?: string;
  etiquetas?: Array<{
    id: number;
    etiqueta: {
      nombre: string;
      color: string;
      icono: string;
    };
  }>;
}

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors: string[];
  summary: string;
}

interface CurrentFilters {
  rank?: string;
  isActive?: boolean;
  tags?: string[];
  pageSize: number;
  search?: string;
}

interface SuppliersImportExportClientProps {
  suppliers: Supplier[];
  canEdit: boolean;
  canDelete: boolean;
  canImportExport: boolean;
  currentFilters: CurrentFilters;
}

export default function SuppliersImportExportClient({
  suppliers,
  canEdit,
  canDelete,
  canImportExport,
  currentFilters,
}: SuppliersImportExportClientProps) {
  // Estados de selección
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  
  // Estados de importación
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportSection, setShowImportSection] = useState(false);
  
  // Estados de exportación
  const [exporting, setExporting] = useState(false);

  // Funciones de manejo de selección
  const handleSelectSupplier = (supplierId: number, checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(prev => [...prev, supplierId]);
    } else {
      setSelectedSuppliers(prev => prev.filter(id => id !== supplierId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(suppliers.map(s => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  // Funciones de exportación
  const handleExportFiltered = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        ...(currentFilters.rank && { rank: currentFilters.rank }),
        ...(currentFilters.isActive !== undefined && { isActive: currentFilters.isActive.toString() }),
        ...(currentFilters.tags && currentFilters.tags.length > 0 && { tags: currentFilters.tags.join(',') }),
        ...(currentFilters.search && { search: currentFilters.search }),
      });

      const response = await fetch(`/api/suppliers/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error en la exportación');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'proveedores.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Mostrar notificación de éxito
      showNotification('✅ Exportación completada exitosamente', 'success');
    } catch (error) {
      console.error('Error exportando:', error);
      showNotification('❌ Error al exportar proveedores', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedSuppliers.length === 0) {
      showNotification('⚠️ Selecciona al menos un proveedor para exportar', 'warning');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/suppliers/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedIds: selectedSuppliers
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la exportación');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'proveedores_seleccionados.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification(`✅ Exportación completada: ${selectedSuppliers.length} proveedores`, 'success');
      setSelectedSuppliers([]);
      setShowCheckboxes(false);
    } catch (error) {
      console.error('Error exportando:', error);
      showNotification('❌ Error al exportar proveedores seleccionados', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Funciones de importación
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleFileRemove = () => {
    setImportFile(null);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/suppliers/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        showNotification(`✅ Importación completada: ${result.created} creados, ${result.updated} actualizados`, 'success');
        // Recargar la página para mostrar los nuevos datos
        window.location.reload();
      } else {
        showNotification(result.error || '❌ Error durante la importación', 'error');
      }
    } catch (error) {
      console.error('Error importando:', error);
      const errorResult = {
        success: false,
        message: 'Error inesperado durante la importación',
        created: 0,
        updated: 0,
        errors: ['Error interno del servidor'],
        summary: 'Error crítico'
      };
      setImportResult(errorResult);
      showNotification('❌ Error inesperado durante la importación', 'error');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/suppliers/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_proveedores.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('📄 Plantilla descargada exitosamente', 'success');
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      showNotification('❌ Error al descargar plantilla', 'error');
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setShowImportSection(false);
  };

  // Función para mostrar notificaciones simples
  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    const colors = {
      success: 'bg-green-100 border-green-400 text-green-700',
      error: 'bg-red-100 border-red-400 text-red-700',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 border rounded-lg shadow-lg z-50 ${colors[type]}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Botones de acción principales */}
      {canImportExport && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-3">
            {/* Exportar filtrados */}
            <button
              onClick={handleExportFiltered}
              disabled={exporting}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar Filtrados ({suppliers.length})
                </>
              )}
            </button>

            {/* Seleccionar para exportar */}
            <button
              onClick={() => setShowCheckboxes(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Seleccionar Proveedores
            </button>

            {/* Exportar seleccionados */}
            {showCheckboxes && (
              <>
                <button
                  onClick={handleExportSelected}
                  disabled={selectedSuppliers.length === 0 || exporting}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Exportar Seleccionados ({selectedSuppliers.length})
                </button>

                <button
                  onClick={() => {
                    setSelectedSuppliers([]);
                    setShowCheckboxes(false);
                  }}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancelar Selección
                </button>
              </>
            )}

            {/* Importar */}
            <button
              onClick={() => setShowImportSection(!showImportSection)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FileUp className="h-4 w-4" />
              {showImportSection ? 'Ocultar Importar' : 'Mostrar Importar'}
            </button>
          </div>

          {/* Selecciones activas */}
          {showCheckboxes && selectedSuppliers.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-700 text-sm font-medium">
                📋 {selectedSuppliers.length} proveedores seleccionados
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sección de importación */}
      {canImportExport && showImportSection && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Importación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Importar Proveedores
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla Excel
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Archivo
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>

                {importFile && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <div className="text-sm text-blue-800">
                          <strong>Archivo seleccionado:</strong> {importFile.name} ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Iniciar Importación
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleFileRemove}
                      className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover Archivo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Resultados */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultados de Importación
              </h3>
              
              {importResult ? (
                <div className="space-y-4">
                  <div className={`border rounded-lg p-4 ${
                    importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}>
                    <div className="flex items-center gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className={`text-sm font-medium ${
                        importResult.success ? "text-green-800" : "text-red-800"
                      }`}>
                        {importResult.summary}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
                      <div className="text-sm text-green-700">Creados</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                      <div className="text-sm text-blue-700">Actualizados</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        Errores encontrados ({importResult.errors.length}):
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={resetImport}
                    className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Nueva Importación
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Los resultados de la importación aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de proveedores */}
      <SuppliersTableWithSelection
        suppliers={suppliers}
        selectedSuppliers={selectedSuppliers}
        onSelectSupplier={handleSelectSupplier}
        onSelectAll={handleSelectAll}
        showCheckboxes={showCheckboxes}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
} 