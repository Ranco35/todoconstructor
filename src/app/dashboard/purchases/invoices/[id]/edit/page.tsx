'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PurchaseInvoiceFormWithTaxes from '@/components/purchases/PurchaseInvoiceFormWithTaxes';
import DebugInvoiceData from '@/components/purchases/DebugInvoiceData';
import { getPurchaseInvoiceById, updatePurchaseInvoice } from '@/actions/purchases/purchase-invoices';
import { toast } from 'sonner';

export default function EditPurchaseInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [rawInvoiceData, setRawInvoiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string>('draft');

  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceId) return;
      
      setLoading(true);
      try {
        const result = await getPurchaseInvoiceById(invoiceId);
        if (result.success && result.data) {
          const invoice = result.data;
          
          // Guardar datos raw para debug
          setRawInvoiceData(invoice);
          
          // Guardar estado de la factura
          console.log('🔍 Estado de factura recibido:', {
            status: invoice.status,
            statusType: typeof invoice.status,
            statusUndefined: invoice.status === undefined,
            statusNull: invoice.status === null,
            statusEmpty: invoice.status === '',
            allKeys: Object.keys(invoice)
          });
          
          // Establecer estado con fallback robusto
          const resolvedStatus = invoice.status && invoice.status.trim() !== '' ? invoice.status : 'draft';
          console.log('🔍 Estado final resuelto:', resolvedStatus);
          setInvoiceStatus(resolvedStatus);
          
          console.log('🔍 Datos de factura recibidos:', invoice);
          console.log('🔍 Líneas disponibles:', {
            lines: invoice.lines,
            purchase_invoice_lines: invoice.purchase_invoice_lines
          });
          
          // Map invoice lines to NEW form format with taxes
          const rawLines = invoice.purchase_invoice_lines || invoice.lines || [];
          console.log('🔍 Total líneas encontradas:', rawLines.length);
          
          const mappedLines = rawLines.map((line, index) => {
            console.log(`🔍 Mapeando línea ${index + 1}:`, {
              id: line.id,
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              line_total: line.line_total,
              allFields: line
            });
            
            // Calcular valores correctos
            const quantity = Number(line.quantity) || 0;
            const unitPrice = Number(line.unit_price) || 0;
            const lineTotal = Number(line.line_total) || 0;
            const discountPercent = Number(line.discount_percent) || 0;
            const discountAmount = (quantity * unitPrice * discountPercent) / 100;
            const subtotal = (quantity * unitPrice) - discountAmount;
            
            // Mapear impuestos si existen
            let taxes: any[] = [];
            if (line.taxes && Array.isArray(line.taxes) && line.taxes.length > 0) {
              taxes = line.taxes.map(tax => ({
                id: tax.id,
                taxType: tax.tax_type || 'IVA_19', // Valor por defecto
                taxName: tax.tax_name || 'IVA 19%',
                taxRate: Number(tax.tax_rate) || 0,
                taxAmount: Number(tax.tax_amount) || 0,
                isRetention: tax.is_retention || false,
                taxBase: Number(tax.tax_base) || subtotal
              }));
            } else if (line.tax_amount && line.tax_amount > 0) {
              // Si no hay array de impuestos pero sí hay un monto de impuesto
              taxes = [{
                taxType: 'IVA_19',
                taxName: 'IVA 19%',
                taxRate: 19, // Tasa por defecto
                taxAmount: Number(line.tax_amount) || 0,
                isRetention: false,
                taxBase: subtotal
              }];
            }
            
            // Mapear a nueva estructura con impuestos
            const mappedLine = {
              id: line.id,
              productId: line.product_id || undefined,
              description: line.description || '',
              productCode: line.product_code || '',
              quantity: quantity,
              unitPrice: unitPrice,
              discountPercent: discountPercent,
              discountAmount: discountAmount,
              subtotal: subtotal,
              taxes: taxes,
              lineTotal: lineTotal
            };
            
            console.log(`✅ Línea ${index + 1} mapeada:`, mappedLine);
            
            // Si hay tax_rate, agregar impuesto por defecto
            const taxRate = Number(line.tax_rate) || 0;
            if (taxRate > 0) {
              const taxAmount = (subtotal * taxRate) / 100;
              mappedLine.taxes = [{
                taxType: 'IVA_19',
                taxName: `IVA ${taxRate}%`,
                taxRate: taxRate,
                taxAmount: taxAmount,
                isRetention: false,
                taxBase: subtotal
              }];
            }
            
            console.log(`✅ Línea ${index + 1} mapeada con nueva estructura:`, mappedLine);
            return mappedLine;
          });
          
          // Mapear datos de la factura
          const initialFormData = {
            invoiceNumber: invoice.number || '',
            supplierInvoiceNumber: invoice.supplier_invoice_number || '',
            supplierId: invoice.supplier_id || null,
            orderId: null, // No viene en los datos
            warehouseId: invoice.warehouse_id || null,
            issueDate: invoice.issue_date ? new Date(invoice.issue_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().slice(0, 10) : '',
            paymentTerms: '30', // Valor por defecto
            currency: invoice.currency || 'CLP',
            subtotalNet: Number(invoice.subtotal) || 0,
            totalTaxes: Number(invoice.tax_amount) || 0,
            total: Number(invoice.total) || 0,
            notes: invoice.notes || '',
            lines: mappedLines
          };
          
          console.log('🔍 Initial form data preparado:', initialFormData);
          console.log('🔍 Campo supplier_invoice_number en invoice:', invoice.supplier_invoice_number);
          console.log('🔍 Campo supplier_invoice_number en initialFormData:', initialFormData.supplierInvoiceNumber);
          setInitialData(initialFormData);
          
          console.log('✅ Datos iniciales mapeados:', {
            invoiceNumber: invoice.number,
            linesCount: mappedLines.length,
            lines: mappedLines,
            supplierId: invoice.supplier_id,
            warehouseId: invoice.warehouse_id,
            issueDate: initialFormData.issueDate,
            dueDate: initialFormData.dueDate
          });
        } else {
          setError(result.error || 'Error cargando factura');
        }
      } catch (err) {
        setError('Error cargando factura');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  const handleBack = () => {
    router.push(`/dashboard/purchases/invoices/${invoiceId}`);
  };

  const handleSuccess = () => {
    router.push(`/dashboard/purchases/invoices/${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Cargando factura...</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">{error || 'Factura no encontrada'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">Editar Factura</h1>
            <p className="text-gray-600 mt-1">
              Modificar factura {initialData.invoiceNumber} con manejo de impuestos
            </p>
          </div>
        </div>
      </div>

      {/* Debug Data - TEMPORAL */}
      {/* {rawInvoiceData && (
        <DebugInvoiceData 
          data={rawInvoiceData} 
          title="Datos Raw de la Factura (Debug)" 
        />
      )} */}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseInvoiceFormWithTaxes
            initialData={initialData}
            isEditing={true}
            currentStatus={invoiceStatus as any}
            onSubmit={async (data) => {
              try {
                console.log('📝 Actualizando factura con datos:', data);
                console.log('📝 warehouseId en formData:', data.warehouseId);
                
                // Map form data to expected API format
                const updateData = {
                  id: invoiceId,
                  number: data.invoiceNumber,
                  supplier_invoice_number: data.supplierInvoiceNumber,
                  supplier_id: data.supplierId,
                  warehouse_id: data.warehouseId,
                  issue_date: data.issueDate,
                  due_date: data.dueDate || undefined,
                  subtotal: data.subtotalNet,
                  tax_amount: data.totalTaxes,
                  total: data.total,
                  notes: data.notes || undefined
                };
                
                console.log('📝 updateData preparado:', updateData);
                
                const result = await updatePurchaseInvoice(updateData);
                
                if (result.success) {
                  toast.success('✅ Factura actualizada exitosamente');
                  console.log('✅ Factura actualizada:', result.data);
                  handleSuccess();
                } else {
                  toast.error(`❌ Error: ${result.error}`);
                  console.error('❌ Error actualizando factura:', result.error);
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                toast.error(`❌ Error: ${errorMessage}`);
                console.error('❌ Error actualizando factura:', error);
              }
            }}
            onCancel={handleBack}
          />
        </CardContent>
      </Card>
    </div>
  );
} 