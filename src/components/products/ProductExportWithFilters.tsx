'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductExportWithFiltersProps {
  className?: string;
}

export function ProductExportWithFilters({ className = '' }: ProductExportWithFiltersProps) {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Obtener filtros activos de la URL
      const categoryId = searchParams.get('categoryId');
      const search = searchParams.get('search');
      
      // Construir la URL de exportación con filtros
      let exportUrl = '/api/products/export';
      const params = new URLSearchParams();
      
      if (categoryId) {
        params.append('categoryId', categoryId);
      }
      
      if (search) {
        params.append('search', search);
      }
      
      if (params.toString()) {
        exportUrl += `?${params.toString()}`;
      }
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Error al exportar productos');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Nombre del archivo con información de los filtros
      let fileName = `productos_${new Date().toISOString().split('T')[0]}`;
      if (categoryId) {
        fileName += `_categoria_${categoryId}`;
      }
      if (search) {
        fileName += `_busqueda_${search.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      fileName += '.xlsx';
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Mensaje de éxito
      let message = 'Productos exportados exitosamente';
      if (categoryId || search) {
        message += ' (con filtros aplicados)';
      }
      alert(message);
      
    } catch (error) {
      console.error('Error exportando productos:', error);
      alert('Error al exportar productos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className={`flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 ${className}`}
    >
      <Download className="h-4 w-4" />
      {isExporting ? 'Exportando...' : 'Excel'}
    </Button>
  );
} 