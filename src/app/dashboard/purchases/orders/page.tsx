'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit } from 'lucide-react';
import PurchaseOrderTable from '@/components/purchases/PurchaseOrderTable';
import { PurchaseOrderWithDetails } from '@/types/purchases';
import { useRouter } from 'next/navigation';

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleViewOrder = (order: PurchaseOrderWithDetails) => {
    router.push(`/dashboard/purchases/orders/${order.id}`);
  };

  const handleEditOrder = (order: PurchaseOrderWithDetails) => {
    router.push(`/dashboard/purchases/orders/${order.id}/edit`);
  };

  const handleCreateOrder = () => {
    router.push('/dashboard/purchases/orders/create');
  };

  return (
    <div className="space-y-6">
      <PurchaseOrderTable
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onCreateOrder={handleCreateOrder}
      />
    </div>
  );
} 