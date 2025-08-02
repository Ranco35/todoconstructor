'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PurchaseInvoiceFormWithTaxes from '@/components/purchases/PurchaseInvoiceFormWithTaxes';
import { useRouter } from 'next/navigation';
import { createPurchaseInvoice, createPurchaseInvoiceLines } from '@/actions/purchases/purchase-invoices';
import { toast } from 'sonner';

export default function CreatePurchaseInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.push('/dashboard/purchases/invoices');
  };

  const handleSuccess = () => {
    // Solo redirigir si realmente fue exitoso
    setTimeout(() => {
      router.push('/dashboard/purchases/invoices');
    }, 1000); // Dar tiempo para ver el mensaje de éxito
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
            <h1 className="text-3xl font-bold">Nueva Factura de Compra</h1>
            <p className="text-gray-600 mt-1">
              Registrar una nueva factura recibida de un proveedor con manejo de impuestos
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseInvoiceFormWithTaxes
            onSubmit={async (data) => {
              setLoading(true);
              try {
                console.log('📝 Creando factura con datos:', data);
                console.log('📝 warehouseId en formData:', data.warehouseId);
                
                // Mapear datos del formulario al formato esperado por la API
                const invoiceData = {
                  number: data.invoiceNumber,
                  supplier_invoice_number: data.supplierInvoiceNumber,
                  supplier_id: data.supplierId,
                  warehouse_id: data.warehouseId,
                  issue_date: data.issueDate,
                  due_date: data.dueDate || undefined,
                  subtotal: data.subtotalNet,
                  tax_amount: data.totalTaxes,
                  total: data.total,
                  status: 'draft',
                  notes: data.notes || undefined
                };
                
                console.log('📝 invoiceData preparado:', invoiceData);
                
                const result = await createPurchaseInvoice(invoiceData);
                
                if (result.success) {
                  console.log('✅ Factura creada:', result.data);
                  let allSuccess = true;
                  
                  // Si hay líneas de productos, crearlas también
                  if (data.lines && data.lines.length > 0) {
                    console.log('📝 Creando líneas de productos:', data.lines.length);
                    
                    const linesResult = await createPurchaseInvoiceLines(result.data.id, data.lines);
                    
                    if (linesResult.success) {
                      toast.success(`✅ Factura creada exitosamente con ${data.lines.length} productos`);
                      console.log('✅ Líneas de productos creadas:', linesResult.data);
                    } else {
                      toast.error(`❌ Error creando productos: ${linesResult.error}`);
                      console.error('❌ Error creando líneas:', linesResult.error);
                      allSuccess = false;
                      // No redirigir - mantener en la página para que puedan corregir
                      throw new Error(`Error creando productos: ${linesResult.error}`);
                    }
                  } else {
                    toast.success('✅ Factura creada exitosamente (sin productos)');
                  }
                  
                  // Solo redirigir si TODO fue exitoso
                  if (allSuccess) {
                    handleSuccess();
                  }
                } else {
                  console.error('❌ Error creando factura:', result.error);
                  // Lanzar error para que sea capturado por el catch y no redirija
                  throw new Error(result.error || 'Error al crear la factura');
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                console.error('❌ Error creando factura:', error);
                
                // NO redirigir automáticamente - mostrar error informativo
                toast.error(`❌ Error: ${errorMessage}`, {
                  description: 'Sus datos se han guardado automáticamente. Revise la información e intente nuevamente.',
                  duration: 8000,
                  action: {
                    label: 'Entendido',
                    onClick: () => {
                      // El usuario puede corregir los datos y volver a intentar
                      console.log('Usuario confirmó el error, manteniendo en la página');
                    }
                  }
                });
                
                // NO llamar handleSuccess() aquí - mantener al usuario en la página
                
              } finally {
                setLoading(false);
              }
            }}
            onCancel={handleBack}
          />
        </CardContent>
      </Card>
    </div>
  );
} 