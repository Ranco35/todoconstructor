'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Eye, 
  Edit, 
  FileText,
  Search,
  Filter,
  Trash2,
  EyeOff,
  Settings,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useRouter } from 'next/navigation';
import { listPurchaseInvoices } from '@/actions/purchases/invoices/list';
import { deletePurchaseInvoice } from '@/actions/purchases/purchase-invoices';
import PurchasePaymentForm from '@/components/purchases/PurchasePaymentForm';
import { toast } from 'sonner';

interface PurchaseInvoice {
  id: number;
  number: string;
  supplier_invoice_number: string;
  supplier_name: string;
  total: number;
  status: string;
  payment_status?: string;
  created_at: string;
  due_date: string;
  supplier_id?: number;
  warehouse_id?: number;
  warehouse_name?: string;
  subtotal?: number;
  tax_amount?: number;
  notes?: string;
}

interface PurchaseInvoiceTableWithSelectionProps {
  onViewInvoice?: (invoice: PurchaseInvoice) => void;
  onEditInvoice?: (invoice: PurchaseInvoice) => void;
  onDeleteInvoice?: (invoiceId: number) => void;
  onCreateInvoice?: () => void;
}

const COLUMN_OPTIONS = [
  { key: 'number', label: 'Número Interno' },
  { key: 'supplier_invoice_number', label: 'Numero Factura Proveedor' },
  { key: 'supplier_name', label: 'Proveedor' },
  { key: 'total', label: 'Total' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'tax_amount', label: 'IVA' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Fecha Creación' },
  { key: 'due_date', label: 'Fecha Vencimiento' },
  { key: 'warehouse_name', label: 'Bodega' },
  { key: 'notes', label: 'Notas' },
];

export default function PurchaseInvoiceTableWithSelection({ 
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onCreateInvoice
}: PurchaseInvoiceTableWithSelectionProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showActions, setShowActions] = useState(true);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('purchaseInvoiceTableColumns');
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          const allColumnKeys = COLUMN_OPTIONS.map(c => c.key);
          
          // Verificar si hay nuevas columnas que no están en la configuración guardada
          const missingColumns = allColumnKeys.filter(key => !savedColumns.includes(key));
          
          if (missingColumns.length > 0) {
            // Agregar las nuevas columnas a la configuración existente
            const updatedColumns = [...savedColumns, ...missingColumns];
            localStorage.setItem('purchaseInvoiceTableColumns', JSON.stringify(updatedColumns));
            return updatedColumns;
          }
          
          return savedColumns;
        } catch (error) {
          console.error('Error parsing saved columns:', error);
        }
      }
    }
    // Por defecto mostrar las columnas más importantes
    return ['number', 'supplier_invoice_number', 'supplier_name', 'total', 'status', 'created_at'];
  });

  // Cargar facturas
  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const filters = {
          search: search || undefined,
          status: status || undefined,
        };
        
        const result = await listPurchaseInvoices(filters);
        if (result.success && result.data) {
          setInvoices(result.data);
        } else {
          console.error('Error al cargar facturas:', result.error);
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error al cargar facturas:', error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [search, status, refreshKey]);

  // Cerrar el selector de columnas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setColumnSelectorOpen(false);
      }
    };

    if (columnSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [columnSelectorOpen]);

  const handleCreateInvoice = () => {
    if (onCreateInvoice) {
      onCreateInvoice();
    } else {
      router.push('/dashboard/purchases/invoices/create');
    }
  };

  const handleViewInvoice = (invoice: PurchaseInvoice) => {
    if (onViewInvoice) {
      onViewInvoice(invoice);
    } else {
      router.push(`/dashboard/purchases/invoices/${invoice.id}`);
    }
  };

  const handleEditInvoice = (invoice: PurchaseInvoice) => {
    if (onEditInvoice) {
      onEditInvoice(invoice);
    } else {
      router.push(`/dashboard/purchases/invoices/${invoice.id}/edit`);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number, invoiceNumber: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la factura ${invoiceNumber}?`)) {
      try {
        const result = await deletePurchaseInvoice(invoiceId);
        if (result.success) {
          toast.success('Factura eliminada exitosamente');
          setRefreshKey(prev => prev + 1); // Refrescar la tabla
        } else {
          toast.error(result.error || 'Error al eliminar la factura');
        }
      } catch (error) {
        console.error('Error al eliminar factura:', error);
        toast.error('Error al eliminar la factura');
      }
    }
  };

  const handlePaymentClick = (invoiceId: number) => {
    setSelectedInvoiceForPayment(invoiceId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setRefreshKey(prev => prev + 1); // Refrescar la tabla
    toast.success('Pago registrado exitosamente');
  };

  // Determinar si se puede pagar la factura
  const canPayInvoice = (invoice: PurchaseInvoice) => {
    // Se puede pagar si el payment_status es pending o partial
    return ['pending', 'partial'].includes(invoice.payment_status || 'pending');
  };

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter(key => key !== columnKey)
      : [...visibleColumns, columnKey];
    
    setVisibleColumns(newVisibleColumns);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('purchaseInvoiceTableColumns', JSON.stringify(newVisibleColumns));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'sent':
        return 'Enviada';
      case 'received':
        return 'Recibida';
      case 'approved':
        return 'Aprobada';
      case 'paid':
        return 'Pagada';
      case 'partial':
        return 'Pago Parcial';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Cargando facturas...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas de Compras</h1>
          <p className="text-gray-600">
            Gestiona las facturas de tus proveedores
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative" ref={columnSelectorRef}>
            <Button
              variant="outline"
              onClick={() => setColumnSelectorOpen(!columnSelectorOpen)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Columnas
            </Button>
            
            {columnSelectorOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Columnas visibles</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setColumnSelectorOpen(false)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {COLUMN_OPTIONS.map((column) => (
                      <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número o proveedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg rounded-lg">
                <SelectItem value="all" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Todos los estados</SelectItem>
                <SelectItem value="draft" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Borrador</SelectItem>
                <SelectItem value="sent" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Enviada</SelectItem>
                <SelectItem value="received" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Recibida</SelectItem>
                <SelectItem value="paid" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Pagada</SelectItem>
                <SelectItem value="overdue" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Vencida</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {showActions && (
                  <TableHead className="w-12">Acciones</TableHead>
                )}
                {visibleColumns.includes('number') && (
                  <TableHead>Número Interno</TableHead>
                )}
                {visibleColumns.includes('supplier_invoice_number') && (
                  <TableHead>Numero Factura Proveedor</TableHead>
                )}
                {visibleColumns.includes('supplier_name') && (
                  <TableHead>Proveedor</TableHead>
                )}
                {visibleColumns.includes('total') && (
                  <TableHead>Total</TableHead>
                )}
                {visibleColumns.includes('subtotal') && (
                  <TableHead>Subtotal</TableHead>
                )}
                {visibleColumns.includes('tax_amount') && (
                  <TableHead>IVA</TableHead>
                )}
                {visibleColumns.includes('status') && (
                  <TableHead>Estado</TableHead>
                )}
                {visibleColumns.includes('created_at') && (
                  <TableHead>Fecha Creación</TableHead>
                )}
                {visibleColumns.includes('due_date') && (
                  <TableHead>Fecha Vencimiento</TableHead>
                )}
                {visibleColumns.includes('warehouse_name') && (
                  <TableHead>Bodega</TableHead>
                )}
                {visibleColumns.includes('notes') && (
                  <TableHead>Notas</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={visibleColumns.length + (showActions ? 1 : 0)} 
                    className="text-center py-8"
                  >
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron facturas</p>
                      <p className="text-sm">
                        {search || status ? 'Intente ajustar los filtros de búsqueda' : 'Aún no se han creado facturas'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="Ver factura"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInvoice(invoice)}
                            title="Editar factura"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {canPayInvoice(invoice) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePaymentClick(invoice.id)}
                              title="Registrar pago"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id, invoice.number)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar factura"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes('number') && (
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                    )}
                    {visibleColumns.includes('supplier_invoice_number') && (
                      <TableCell className="font-medium text-blue-600">
                        {invoice.supplier_invoice_number || '-'}
                      </TableCell>
                    )}
                    {visibleColumns.includes('supplier_name') && (
                      <TableCell>
                        {invoice.supplier_name}
                      </TableCell>
                    )}
                    {visibleColumns.includes('total') && (
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                    )}
                    {visibleColumns.includes('subtotal') && (
                      <TableCell>
                        {invoice.subtotal ? formatCurrency(invoice.subtotal) : '-'}
                      </TableCell>
                    )}
                    {visibleColumns.includes('tax_amount') && (
                      <TableCell>
                        {invoice.tax_amount ? formatCurrency(invoice.tax_amount) : '-'}
                      </TableCell>
                    )}
                    {visibleColumns.includes('status') && (
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusText(invoice.status)}
                        </Badge>
                        {invoice.payment_status && invoice.payment_status !== invoice.status && (
                          <div className="text-xs text-gray-500 mt-1">
                            Pago: {getStatusText(invoice.payment_status)}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes('created_at') && (
                      <TableCell>
                        {formatDate(invoice.created_at)}
                      </TableCell>
                    )}
                    {visibleColumns.includes('due_date') && (
                      <TableCell>
                        {formatDate(invoice.due_date)}
                      </TableCell>
                    )}
                    {visibleColumns.includes('warehouse_name') && (
                      <TableCell>
                        {invoice.warehouse_name || '-'}
                      </TableCell>
                    )}
                    {visibleColumns.includes('notes') && (
                      <TableCell>
                        {invoice.notes || '-'}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Pago */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar Pago de Factura</DialogTitle>
          </DialogHeader>
          {selectedInvoiceForPayment && (
            <PurchasePaymentForm
              selectedInvoiceId={selectedInvoiceForPayment}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 