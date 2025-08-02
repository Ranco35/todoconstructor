'use client';

import Link from 'next/link';

export default function SupplierActions() {
  const handleReportClick = () => {
    // TODO: Implementar la lógica para generar el reporte
    alert('Funcionalidad de reporte en desarrollo.');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Acciones Rápidas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/suppliers/create"
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <span className="text-blue-600 text-lg">➕</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Crear Proveedor</h4>
            <p className="text-sm text-gray-500">Agregar un nuevo proveedor al sistema</p>
          </div>
        </Link>
        
        <Link
          href="/dashboard/suppliers/import-export"
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <span className="text-green-600 text-lg">📥📤</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Import/Export</h4>
            <p className="text-sm text-gray-500">Importar y exportar proveedores</p>
          </div>
        </Link>
        
        <button
          onClick={handleReportClick}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
        >
          <div className="p-2 bg-purple-100 rounded-lg mr-3">
            <span className="text-purple-600 text-lg">📊</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Reporte</h4>
            <p className="text-sm text-gray-500">Generar reporte de proveedores</p>
          </div>
        </button>
      </div>
    </div>
  );
} 