'use client';

import React from 'react';
import Link from 'next/link';
import { DeleteConfirmButton } from '@/components/shared/DeleteConfirmButton';

interface InventoryRowActionsProps {
  inventoryId: number;
  deleteAction: (id: number) => Promise<void>;
}

export default function InventoryRowActions({ inventoryId, deleteAction }: InventoryRowActionsProps) {
  const handleDelete = async () => {
    await deleteAction(inventoryId);
  };

  return (
    <div className="flex items-center gap-1">
      <Link href={`/dashboard/inventories/edit/${inventoryId}`}>
        <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50">
          Editar
        </button>
      </Link>
      <DeleteConfirmButton
        id={inventoryId.toString()}
        deleteAction={handleDelete}
        confirmMessage="¿Estás seguro de que deseas eliminar este inventario?"
      />
    </div>
  );
} 