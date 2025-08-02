'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DeleteConfirmButton } from '@/components/shared/DeleteConfirmButton';

interface ProductRowActionsCollapsibleProps {
  productId: number;
  deleteAction: (formData: FormData) => Promise<any>;
  compact?: boolean;
  onDeleteSuccess?: () => void; // Nuevo callback para éxito en eliminación
}

export default function ProductRowActionsCollapsible({ 
  productId, 
  deleteAction, 
  compact = false,
  onDeleteSuccess
}: ProductRowActionsCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async (formData: FormData) => {
    try {
      const result = await deleteAction(formData);
      return result;
    } catch (error) {
      console.error('Error en handleDelete:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al eliminar el producto'
      };
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 flex items-center gap-1"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        
        {isExpanded && (
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
            <div className="py-1">
              <Link href={`/dashboard/configuration/products/${productId}`}>
                <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4" />
                  Ver
                </div>
              </Link>
              <Link href={`/dashboard/configuration/products/edit/${productId}`}>
                <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                  <Edit className="w-4 h-4" />
                  Editar
                </div>
              </Link>
              <div className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <DeleteConfirmButton
                  id={productId.toString()}
                  deleteAction={handleDelete}
                  confirmMessage="¿Estás seguro de que deseas eliminar este producto?"
                  className="text-red-600 hover:text-red-800"
                  buttonText="Eliminar"
                  onSuccess={onDeleteSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={`/dashboard/configuration/products/${productId}`}>
        <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Ver
        </button>
      </Link>
      <Link href={`/dashboard/configuration/products/edit/${productId}`}>
        <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1">
          <Edit className="w-3 h-3" />
          Editar
        </button>
      </Link>
      <DeleteConfirmButton
        id={productId.toString()}
        deleteAction={handleDelete}
        confirmMessage="¿Estás seguro de que deseas eliminar este producto?"
        onSuccess={onDeleteSuccess}
      />
    </div>
  );
} 