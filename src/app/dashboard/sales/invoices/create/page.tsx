'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import InvoiceForm from '@/components/sales/InvoiceForm';
import type { Invoice } from '@/actions/sales/invoices/create';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gray-50">
      {/* Navegación superior */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="border-l border-gray-300 h-6"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Factura de Venta</h1>
              <p className="text-sm text-gray-600">Crea una nueva factura para un cliente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto">
        <InvoiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 