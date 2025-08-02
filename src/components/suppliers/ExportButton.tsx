'use client';

import React from 'react';

export default function ExportButton() {
  const handleExport = () => {
    // TODO: Implementar exportación
    console.log('Exportar proveedores');
  };

  return (
    <button
      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      onClick={handleExport}
    >
      <span className="mr-2">📤</span>
      Exportar
    </button>
  );
} 