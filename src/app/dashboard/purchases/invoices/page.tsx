'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PurchaseInvoiceTableWithSelection from '@/components/purchases/PurchaseInvoiceTableWithSelection';

interface PurchaseInvoice {
  id: number;
  number: string;
  supplier_invoice_number: string;
  supplier_name: string;
  total: number;
  status: string;
  created_at: string;
  due_date: string;
  supplier_id?: number;
  warehouse_id?: number;
  warehouse_name?: string;
  subtotal?: number;
  tax_amount?: number;
  notes?: string;
}

export default function PurchaseInvoicesPage() {
  const router = useRouter();
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

  const handleViewInvoice = (invoice: PurchaseInvoice) => {
    console.log('📄 Navegando a ver factura:', invoice.id);
    router.push(`/dashboard/purchases/invoices/${invoice.id}`);
  };

  const handleEditInvoice = (invoice: PurchaseInvoice) => {
    console.log('✏️ Navegando a editar factura:', invoice.id);
    router.push(`/dashboard/purchases/invoices/${invoice.id}/edit`);
  };

  const handleCreateInvoice = () => {
    console.log('➕ Navegando a crear factura');
    router.push('/dashboard/purchases/invoices/create');
  };

  return (
    <PurchaseInvoiceTableWithSelection
      onViewInvoice={handleViewInvoice}
      onEditInvoice={handleEditInvoice}
      onCreateInvoice={handleCreateInvoice}
    />
  );
} 