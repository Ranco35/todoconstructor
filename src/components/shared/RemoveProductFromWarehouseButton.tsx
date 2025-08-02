'use client';

import React from 'react';

interface RemoveProductFromWarehouseButtonProps {
  removeAction: (formData: FormData) => Promise<any>;
  productId: number;
  warehouseId: number;
  confirmMessage?: string;
}

export function RemoveProductFromWarehouseButton({ 
  removeAction, 
  productId, 
  warehouseId, 
  confirmMessage 
}: RemoveProductFromWarehouseButtonProps) {
  return (
    <form action={removeAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <button
        type="submit"
        className="text-red-600 hover:text-red-900 flex items-center gap-1"
        onClick={(e) => {
          if (!window.confirm(confirmMessage || '¿Estás seguro de que quieres remover este producto de la bodega?')) {
            e.preventDefault();
          }
        }}
      >
        🗑️ Remover
      </button>
    </form>
  );
} 