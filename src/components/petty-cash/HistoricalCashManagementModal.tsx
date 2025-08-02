'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  generatePettyCashTemplate,
  importPettyCashTransactions,
  exportPettyCashTransactions
} from '@/actions/configuration/petty-cash-import-export';

interface HistoricalCashManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export default function HistoricalCashManagementModal({ 
  isOpen, 
  onClose,
  currentUser
}: HistoricalCashManagementModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'template' | 'import' | 'export'>('template');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await generatePettyCashTemplate();
      
      if (result.success && result.data) {
        // Crear y descargar el archivo
        const blob = new Blob([result.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'plantilla_transacciones_historicas.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setMessage({
          type: 'success',
          text: 'Plantilla descargada exitosamente. Complete los datos y súbala en la pestaña "Importar".'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al generar la plantilla'
        });
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      setMessage({
        type: 'error',
        text: 'Error al descargar la plantilla'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.endsWith('.csv'))) {
      setImportFile(file);
      setMessage(null);
    } else {
      setMessage({
        type: 'error',
        text: 'Por favor selecciona un archivo Excel válido (.xlsx, .xls) o CSV'
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({
        type: 'error',
        text: 'Por favor selecciona un archivo para importar'
      });
      return;
    }

    setIsLoading(true);
    setImportProgress(0);
    setMessage(null);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await importPettyCashTransactions(importFile);
      
      clearInterval(progressInterval);
      setImportProgress(100);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });
        setImportFile(null);
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      console.error('Error importing file:', error);
      setMessage({
        type: 'error',
        text: 'Error al importar el archivo'
      });
    } finally {
      setIsLoading(false);
      setImportProgress(0);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await exportPettyCashTransactions();
      
      if (result.success && result.data) {
        // Crear y descargar el archivo
        const blob = new Blob([result.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'transacciones_historicas.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setMessage({
          type: 'success',
          text: 'Transacciones exportadas exitosamente'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al exportar las transacciones'
        });
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
      setMessage({
        type: 'error',
        text: 'Error al exportar las transacciones'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                📊 Gestión de Transacciones Históricas
              </h2>
              <p className="text-gray-600">
                Importa y exporta transacciones históricas de caja chica usando Excel
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('template')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'template'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Descargar Plantilla
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📥 Importar Excel
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📤 Exportar Datos
              </button>
            </nav>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'template' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Descargar Plantilla Excel para Transacciones Históricas
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Descarga la plantilla Excel que incluye:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>Instrucciones detalladas de uso</li>
                        <li>Lista de categorías disponibles</li>
                        <li>Lista de centros de costo disponibles</li>
                        <li>Plantilla con ejemplos de datos</li>
                        <li>Formato específico para ingresos sin categorías</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      📥 Descargar Plantilla Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Importar Transacciones Históricas desde Excel
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Sube un archivo Excel con las transacciones históricas. Asegúrate de usar la plantilla descargada.</p>
                      <p className="mt-1 font-medium">Tipos soportados: gastos, ingresos directos a caja, compras</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    {importFile ? importFile.name : 'Selecciona un archivo Excel o CSV'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {importFile ? 'Archivo seleccionado' : 'o arrastra y suelta aquí'}
                  </div>
                </label>
              </div>

              {importProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso de importación</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Importando...' : 'Importar Transacciones'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">
                      Exportar Todas las Transacciones Históricas
                    </h3>
                    <div className="mt-2 text-sm text-purple-700">
                      <p>Descarga todas las transacciones de caja chica en formato Excel para análisis o respaldo.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Datos incluidos en la exportación:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ID de sesión</li>
                  <li>• Tipo de transacción (gasto/ingreso/compra)</li>
                  <li>• Descripción y monto</li>
                  <li>• Fecha de creación</li>
                  <li>• Categoría y centro de costo</li>
                  <li>• Método de pago</li>
                  <li>• Estado de la transacción</li>
                  <li>• Usuario que creó la transacción</li>
                </ul>
              </div>

              <div className="text-center">
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportando...
                    </>
                  ) : (
                    <>
                      📤 Exportar Transacciones
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 