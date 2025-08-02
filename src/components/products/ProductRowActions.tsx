'use client';

import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { DeleteConfirmButton } from '@/components/shared/DeleteConfirmButton';
// TODO: Reemplazar con la acción de eliminación de productos correcta
// import { deleteProductAction } from '@/actions/products/delete'; 

interface ProductRowActionsProps {
  productId: number;
  deleteAction: (formData: FormData) => Promise<any>;
  onDeleteSuccess?: () => void; // Nuevo callback para éxito en eliminación
}

export default function ProductRowActions({ 
  productId, 
  deleteAction,
  onDeleteSuccess 
}: ProductRowActionsProps) {
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

  return (
    <div className="flex items-center gap-1">
      <Link href={`/dashboard/configuration/products/${productId}`}>
        <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Ver
        </button>
      </Link>
      <Link href={`/dashboard/configuration/products/edit/${productId}`}>
        <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50">
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