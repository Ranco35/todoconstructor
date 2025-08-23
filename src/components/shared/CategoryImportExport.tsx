'use client';

import React, { useState } from 'react';
import { importCategories, ImportResult } from '@/actions/configuration/category-actions';
import { parseCategoriesExcel } from '@/lib/import-parsers';
import { FileUploader } from '@/components/shared/FileUploader';

interface CategoryImportExportProps {
  onImportComplete?: (result: ImportResult) => void;
}

export default function CategoryImportExport({ onImportComplete }: CategoryImportExportProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Exportar categorías a Excel
  const handleExport = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/categories/export');
      if (!response.ok) {
        throw new Error('Error al exportar categorías');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `categorias_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando categorías:', error);
      alert('Error al exportar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
  };

  const handleFileRemove = () => {
    setFile(null);
    setImportResult(null);
  };

  // Importar categorías desde Excel
  const handleImport = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo Excel');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const arrayBuffer = await file.arrayBuffer();
      const categories = await parseCategoriesExcel(arrayBuffer);

      if (categories.length === 0) {
        alert('No se encontraron categorías válidas en el archivo o el archivo está vacío. Revise la plantilla de ejemplo.');
        return;
      }

      const confirmed = confirm(
        `Se procesarán ${categories.length} filas.\n\n` +
        `• Las categorías con ID serán ACTUALIZADAS.\n` +
        `• Las categorías sin ID serán CREADAS.\n` +
        `• Se buscará la categoría padre por ID o por Nombre.\n\n` +
        `¿Estás seguro de continuar?`
      );

      if (!confirmed) return;

      const result = await importCategories(categories);
      setImportResult(result);
      
      if (onImportComplete) {
        onImportComplete(result);
      }

      setFile(null);

    } catch (error) {
      console.error('Error importando categorías:', error);
      alert('Error al importar categorías: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setImportResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        created: 0,
        updated: 0,
        skipped: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  // Descargar plantilla Excel
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/categories/template');
      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_categorias.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      alert('Error al descargar plantilla');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Importar / Exportar Categorías</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">📤 Exportar Categorías</h4>
          <p className="text-sm text-gray-600">
            Descarga todas las categorías en formato Excel (.xlsx)
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Exportando...' : 'Exportar a Excel'}
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">📥 Importar Categorías</h4>
          <p className="text-sm text-gray-600">
            Sube un archivo Excel (.xlsx) para crear o actualizar categorías
          </p>
          
          <div className="space-y-3">
            <FileUploader
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              acceptedTypes={['.xlsx', '.xls']}
              maxSize={10 * 1024 * 1024} // 10MB
              disabled={importing}
              loading={importing}
              currentFile={file}
              placeholder="Seleccionar archivo Excel"
              description="o arrastra y suelta aquí"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar Archivo'}
              </button>
              
              <button
                onClick={downloadTemplate}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                title="Descargar plantilla Excel"
              >
                Plantilla
              </button>
            </div>
          </div>
        </div>
      </div>

      {importResult && (
        <div className={`mt-6 p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h4 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
            Resultado de la importación
          </h4>
          <p className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {importResult.message}
          </p>
          <ul className="mt-2 text-sm list-disc list-inside">
            <li className="text-green-700">Creadas: {importResult.created}</li>
            <li className="text-blue-700">Actualizadas: {importResult.updated}</li>
            <li className="text-yellow-700">Ignoradas (ya existían o con errores): {importResult.skipped}</li>
          </ul>
        </div>
      )}
    </div>
  );
} 