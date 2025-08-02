'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import InvoiceForm from '@/components/sales/InvoiceForm';
import type { Invoice } from '@/actions/sales/invoices/create';

export default function CreateInvoicePage() {
  const router = useRouter();

  const handleSuccess = (invoice: Invoice) => {
    // Redirigir a la lista de facturas con mensaje de éxito
    router.push('/dashboard/sales/invoices?created=' + invoice.id);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <InvoiceForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
} 