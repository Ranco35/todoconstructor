'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CreditCard,
  Search,
  Filter,
  Eye,
  DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/currency';
import { getPurchaseInvoicesForPayment } from '@/actions/purchases/payments/list';
import PurchasePaymentForm from '@/components/purchases/PurchasePaymentForm';
import BulkPurchasePaymentForm from '@/components/purchases/BulkPurchasePaymentForm';

interface InvoiceForPayment {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  totalAmount: number;
  remainingBalance: number;
  payment_status?: string;
}

export default function PurchasePaymentsPage() {
  const [invoices, setInvoices] = useState<InvoiceForPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceForPayment | null>(null);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  useEffect(() => {
    loadInvoices();
  }, [paymentStatus]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando facturas para gestión de pagos con filtro:', paymentStatus);
      const filterValue = paymentStatus === 'all' ? 'all' : paymentStatus;
      const result = await getPurchaseInvoicesForPayment(filterValue);
      if (result.success && result.data) {
        console.log('📊 Facturas cargadas:', result.data.length);
        setInvoices(result.data);
      } else {
        console.error('❌ Error cargando facturas:', result.error);
        setInvoices([]);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = (invoice: InvoiceForPayment) => {
    console.log('💳 Iniciando pago para factura:', invoice);
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    loadInvoices(); // Recargar facturas
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handleInvoiceSelection = (invoiceId: number, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const payableInvoiceIds = filteredInvoices
        .filter(invoice => invoice.remainingBalance > 0)
        .map(invoice => invoice.id);
      setSelectedInvoices(payableInvoiceIds);
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleBulkPaymentClick = () => {
    if (selectedInvoices.length === 0) {
      alert('Debe seleccionar al menos una factura para pagar');
      return;
    }
    setShowBulkPaymentModal(true);
  };

  const handleBulkPaymentSuccess = () => {
    setShowBulkPaymentModal(false);
    setSelectedInvoices([]);
    loadInvoices(); // Recargar la lista
    alert('Pagos múltiples registrados exitosamente');
  };

  const getSelectedInvoicesData = () => {
    return filteredInvoices
      .filter(invoice => selectedInvoices.includes(invoice.id))
      .map(invoice => ({
        id: invoice.id,
        number: invoice.invoiceNumber,
        supplier_name: invoice.supplierName,
        total: invoice.remainingBalance, // Usar el saldo pendiente
        payment_status: invoice.payment_status
      }));
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'partial':
        return 'Parcial';
      case 'paid':
        return 'Pagado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  // Filtrar facturas
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !search || 
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !paymentStatus || paymentStatus === 'all' || 
      invoice.payment_status === paymentStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pagos de Compra</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pagos de Compra</h1>
          <p className="text-gray-600 mt-1">
            Gestión de pagos a proveedores - {filteredInvoices.length} facturas
          </p>
        </div>
        
        {selectedInvoices.length > 0 && (
          <Button
            onClick={handleBulkPaymentClick}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar {selectedInvoices.length} Facturas
          </Button>
        )}
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
            
            <Select value={paymentStatus || 'all'} onValueChange={(value) => setPaymentStatus(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg rounded-lg">
                <SelectItem value="all" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Todas las facturas</SelectItem>
                <SelectItem value="pending" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Pendientes</SelectItem>
                <SelectItem value="partial" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Parciales</SelectItem>
                <SelectItem value="paid" className="bg-white hover:bg-orange-50 text-gray-900 cursor-pointer">Pagadas</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={loadInvoices}>
              <Filter className="h-4 w-4 mr-2" />
              Actualizar
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
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length > 0 && selectedInvoices.length === filteredInvoices.filter(inv => inv.remainingBalance > 0).length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title="Seleccionar todas las facturas pagables"
                  />
                </TableHead>
                <TableHead>Número Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {invoices.length === 0 ? 'No hay facturas disponibles' : 'No se encontraron facturas con los filtros aplicados'}
                    </p>
                    {invoices.length === 0 && (
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={loadInvoices}
                      >
                        Recargar facturas
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {invoice.remainingBalance > 0 ? (
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => handleInvoiceSelection(invoice.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          title="Seleccionar para pago múltiple"
                        />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <span className="text-gray-300 text-xs">—</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {invoice.supplierName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className={`font-medium ${invoice.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(invoice.remainingBalance)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(invoice.payment_status || 'pending')}>
                        {getPaymentStatusText(invoice.payment_status || 'pending')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {invoice.remainingBalance > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handlePayInvoice(invoice)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Ver detalles:', invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Pago */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  Pagar Factura {selectedInvoice.invoiceNumber}
                </h2>
                <Button
                  variant="ghost"
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Información de la Factura</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Proveedor:</span>
                    <p className="font-medium">{selectedInvoice.supplierName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Monto Total:</span>
                    <p className="font-medium">{formatCurrency(selectedInvoice.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Saldo Pendiente:</span>
                    <p className="font-medium text-red-600">{formatCurrency(selectedInvoice.remainingBalance)}</p>
                  </div>
                </div>
              </div>

              <PurchasePaymentForm
                selectedInvoiceId={selectedInvoice.id}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago Múltiple */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  Pago Múltiple de Facturas
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <BulkPurchasePaymentForm
                selectedInvoices={getSelectedInvoicesData()}
                onSuccess={handleBulkPaymentSuccess}
                onCancel={() => setShowBulkPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 