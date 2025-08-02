'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PurchaseOrderForm from '@/components/purchases/PurchaseOrderForm';
import { useRouter } from 'next/navigation';
import { createPurchaseOrder } from '@/actions/purchases/orders/create';
import { toast } from 'sonner';

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.push('/dashboard/purchases/orders');
  };

  const handleSuccess = () => {
    router.push('/dashboard/purchases/orders');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Orden de Compra</h1>
            <p className="text-gray-600 mt-1">
              Crear una nueva orden de compra para un proveedor
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            onSubmit={async (data) => {
              setLoading(true);
              try {
                const result = await createPurchaseOrder(data);
                if (result.success) {
                  toast.success('Orden de compra creada exitosamente');
                  handleSuccess();
                } else {
                  toast.error(result.error || 'Error al crear la orden de compra');
                }
              } catch (error) {
                console.error('Error creating order:', error);
                toast.error('Error inesperado al crear la orden de compra');
              } finally {
                setLoading(false);
              }
            }}
            onCancel={handleBack}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
} 