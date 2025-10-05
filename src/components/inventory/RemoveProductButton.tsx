'use client';

import { Trash2 } from 'lucide-react';
import { removeProductFromWarehouseAction } from '@/actions/configuration/warehouse-assignment-actions';

interface RemoveProductButtonProps {
  productId: number;
  warehouseId: number;
  productName: string;
}

export default function RemoveProductButton({ 
  productId, 
  warehouseId, 
  productName 
}: RemoveProductButtonProps) {
  const handleRemove = async () => {
    const confirmed = confirm(`¿Eliminar "${productName}" de esta bodega?`);
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('productId', productId.toString());
    formData.append('warehouseId', warehouseId.toString());
    
    await removeProductFromWarehouseAction(formData);
  };

  return (
    <button
      onClick={handleRemove}
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
      title="Eliminar producto de la bodega"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
