'use client';

import React from 'react';
import Link from 'next/link';
import { DeleteConfirmButton } from '@/components/shared/DeleteConfirmButton';

interface SupplierRowActionsProps {
  supplierId: number;
  deleteAction: (formData: FormData) => Promise<any>;
  currentUserRole: string;
}

export default function SupplierRowActions({ supplierId, deleteAction, currentUserRole }: SupplierRowActionsProps) {
  const handleDelete = async (formData: FormData) => {
    await deleteAction(formData);
  };

  // Verificar permisos
  const canEdit = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUserRole);
  const canDelete = ['SUPER_USER', 'ADMINISTRADOR'].includes(currentUserRole);

  return (
    <div className="flex items-center gap-1">
      {canEdit && (
        <Link href={`/dashboard/suppliers/edit/${supplierId}`}>
          <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50">
            Editar
          </button>
        </Link>
      )}
      {canDelete && (
        <DeleteConfirmButton
          id={supplierId.toString()}
          deleteAction={handleDelete}
          confirmMessage="¿Estás seguro de que deseas eliminar este proveedor?"
        />
      )}
      {!canEdit && !canDelete && (
        <span className="text-gray-400 text-xs px-2 py-1">
          Sin permisos
        </span>
      )}
    </div>
  );
} 