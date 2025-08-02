'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, FileText, Calendar, Building, DollarSign, Package, Warehouse, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { getPurchaseInvoiceById, getPurchaseInvoiceDetails, approvePurchaseInvoice } from '@/actions/purchases/purchase-invoices';
import { toast } from 'sonner';
import WarehouseValidationInfo from '@/components/purchases/WarehouseValidationInfo';

interface InvoiceData {
  id: number;
  number: string;
  supplier_invoice_number?: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  lines?: InvoiceLine[];
  purchase_invoice_lines?: InvoiceLine[];
  warehouse_id?: number;
  Supplier?: {
    id: number;
    name: string;
    vat?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  Warehouse?: {
    id: number;
    name: string;
    location?: string;
  };
}

interface InvoiceLine {
  id: number;
  product_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  line_total: number;
}

export default function ViewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = parseInt(params.id as string);
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [warehouseValidation, setWarehouseValidation] = useState<any>(null);
  const [canBeApproved, setCanBeApproved] = useState(false);
  const [approvalRequirements, setApprovalRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceId) return;
      
      setLoading(true);
      try {
        const result = await getPurchaseInvoiceDetails(invoiceId);
        if (result.success && result.data) {
          setInvoice(result.data.invoice);
          setWarehouseValidation(result.data.warehouseValidation);
          setCanBeApproved(result.data.canBeApproved);
          setApprovalRequirements(result.data.approvalRequirements);
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
    router.push('/dashboard/purchases/invoices');
  };

  const handleEdit = () => {
    router.push(`/dashboard/purchases/invoices/${invoiceId}/edit`);
  };

  const handleApprove = async () => {
    if (!confirm(`¿Estás seguro de que quieres aprobar esta factura? Esta acción agregará los productos al inventario de la bodega.`)) {
      return;
    }

    try {
      console.log('🔄 Aprobando factura...');
      const result = await approvePurchaseInvoice(invoiceId);
      
      if (result.success) {
        toast.success('✅ Factura aprobada exitosamente. Los productos han sido agregados al inventario.');
        // Recargar los datos de la factura
        window.location.reload();
      } else {
        toast.error(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`❌ Error: ${errorMessage}`);
      console.error('❌ Error aprobando factura:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'approved':
        return 'Aprobada';
      case 'paid':
        return 'Pagada';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL');
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

  if (error || !invoice) {
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
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
            <h1 className="text-3xl font-bold">
              Factura {invoice.number}
              {invoice.Supplier?.vat && (
                <span className="text-lg font-normal text-gray-600 ml-3">
                  - RUT: {invoice.Supplier.vat}
                </span>
              )}
            </h1>
            <p className="text-gray-600">Detalles de la factura de compra</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {invoice.status !== 'approved' && canBeApproved && (
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Número Interno</label>
                <p className="font-medium">{invoice.number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Numero Factura Proveedor</label>
                <p className="font-medium text-blue-600">{invoice.supplier_invoice_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(invoice.status)}>
                    {getStatusText(invoice.status)}
                  </Badge>
                  {invoice.status === 'approved' && (
                    <div className="mt-1 text-xs text-green-600">
                      ✅ Productos agregados al inventario
                      {invoice.approved_at && (
                        <div className="mt-1">
                          Aprobada: {new Date(invoice.approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha Emisión</label>
                <p>{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha Vencimiento</label>
                <p>{formatDate(invoice.due_date)}</p>
              </div>
            </div>
            {invoice.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notas</label>
                <p className="text-sm mt-1">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA:</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.Supplier ? (
              <div className="space-y-2">
                <p className="font-medium text-lg">{invoice.Supplier.name}</p>
                {invoice.Supplier.vat && (
                  <p className="text-sm text-gray-600">RUT: {invoice.Supplier.vat}</p>
                )}
                {invoice.Supplier.email && (
                  <p className="text-sm text-gray-600">Email: {invoice.Supplier.email}</p>
                )}
                {invoice.Supplier.phone && (
                  <p className="text-sm text-gray-600">Teléfono: {invoice.Supplier.phone}</p>
                )}
                {invoice.Supplier.address && (
                  <p className="text-sm text-gray-600">Dirección: {invoice.Supplier.address}</p>
                )}
              </div>
            ) : (
              <p className="font-medium text-gray-500">Sin proveedor</p>
            )}
          </CardContent>
        </Card>

        {/* Warehouse Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Warehouse className="h-5 w-5 mr-2" />
              Bodega de Destino
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.Warehouse ? (
              <div className="space-y-2">
                <p className="font-medium text-lg">{invoice.Warehouse.name}</p>
                {invoice.Warehouse.location && (
                  <p className="text-sm text-gray-600">Ubicación: {invoice.Warehouse.location}</p>
                )}
              </div>
            ) : (
              <p className="font-medium text-gray-500">Sin bodega asignada</p>
            )}
          </CardContent>
        </Card>

        {/* Creation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Información de Creación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
              <p>{formatDate(invoice.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Lines */}
      {((invoice.lines && invoice.lines.length > 0) || (invoice.purchase_invoice_lines && invoice.purchase_invoice_lines.length > 0)) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Productos de la Factura ({(invoice.lines || invoice.purchase_invoice_lines || []).length} productos)
              </span>
              {invoice.Warehouse && (
                <span className="text-sm text-gray-600 flex items-center">
                  <Warehouse className="h-4 w-4 mr-1" />
                  Destino: {invoice.Warehouse.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Descuento</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoice.lines || invoice.purchase_invoice_lines || []).map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">
                      {line.product_code || '-'}
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.unit_price)}</TableCell>
                    <TableCell className="text-right">{line.discount_percent}%</TableCell>
                    <TableCell className="text-right">{line.tax_rate}%</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Líneas de Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Esta factura no tiene productos asociados</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Info */}
      {invoice.status === 'draft' && invoice.warehouse_id && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Proceso de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700">
              <p>📋 <strong>Esta factura está lista para ser aprobada.</strong></p>
              <p>✅ Al aprobar esta factura:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Se crearán movimientos de inventario de tipo "ENTRADA"</li>
                <li>Los productos se agregarán al stock de la bodega: <strong>{invoice.Warehouse?.name}</strong></li>
                <li>Se registrará la fecha y usuario de aprobación</li>
                <li>Los productos estarán disponibles en el inventario</li>
              </ul>
              <p className="mt-2 text-sm">
                📍 <strong>Destino:</strong> Los productos se agregarán a la bodega "{invoice.Warehouse?.name || 'Sin bodega'}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validación Inteligente de Bodega */}
      {warehouseValidation && (
        <WarehouseValidationInfo
          needsWarehouse={warehouseValidation.needsWarehouse}
          hasPhysicalProducts={warehouseValidation.hasPhysicalProducts}
          hasServices={warehouseValidation.hasServices}
          productTypes={warehouseValidation.productTypes}
          warehouseId={invoice.warehouse_id}
          warehouseName={invoice.Warehouse?.name}
          canBeApproved={canBeApproved}
          approvalRequirements={approvalRequirements}
        />
      )}

      {/* Debug info - remove this later */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-yellow-700">
              <div><strong>Warehouse ID:</strong> {invoice.warehouse_id || 'null'}</div>
              <div><strong>Warehouse Object:</strong> {JSON.stringify(invoice.Warehouse, null, 2)}</div>
              <div><strong>Lines Count:</strong> {(invoice.lines || []).length}</div>
              <div><strong>Purchase Lines Count:</strong> {(invoice.purchase_invoice_lines || []).length}</div>
              <div><strong>Supplier:</strong> {JSON.stringify(invoice.Supplier, null, 2)}</div>
              {(invoice.purchase_invoice_lines || []).length > 0 && (
                <details>
                  <summary>Purchase Lines Data</summary>
                  <pre>{JSON.stringify(invoice.purchase_invoice_lines, null, 2)}</pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 