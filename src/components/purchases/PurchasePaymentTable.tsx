'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Plus,
  Calendar,
  X
} from 'lucide-react';
import type { PurchasePaymentWithDetails, PurchasePaymentFilters } from '@/actions/purchases/payments/list';

interface PurchasePaymentTableProps {
  onPaymentClick?: (paymentId: number) => void;
  onNewPayment?: () => void;
  showActions?: boolean;
}

export default function PurchasePaymentTable({ onPaymentClick, onNewPayment, showActions = true }: PurchasePaymentTableProps) {
  const [payments, setPayments] = useState<PurchasePaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<PurchasePaymentFilters>({
    search: '',
    paymentMethod: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Cargar pagos
  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/purchases/payments/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data.payments || []);
        setTotalPages(data.data.totalPages || 0);
        setTotalCount(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cuando cambien filtros/paginación
  useEffect(() => {
    loadPayments();
  }, [currentPage, pageSize, filters]);

  const handleFilterChange = (field: keyof PurchasePaymentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset a primera página
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      paymentMethod: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completado', variant: 'success' as const },
      pending: { label: 'Pendiente', variant: 'warning' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      failed: { label: 'Fallido', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, variant: 'secondary' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Efectivo',
      bank_transfer: 'Transferencia',
      credit_card: 'Tarjeta Crédito',
      debit_card: 'Tarjeta Débito',
      check: 'Cheque',
      online_payment: 'Pago Online',
      crypto: 'Criptomoneda',
      other: 'Otro'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      bank_transfer: '🏦',
      credit_card: '💳',
      debit_card: '💳',
      check: '📝',
      online_payment: '💻',
      crypto: '₿',
      other: '📄'
    };
    return icons[method as keyof typeof icons] || '💰';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos de Facturas de Compras
          </CardTitle>
          {showActions && onNewPayment && (
            <Button onClick={onNewPayment} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Pago
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por referencia o notas..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Método de pago */}
            <Select
              value={filters.paymentMethod || 'all'}
              onValueChange={(value) => handleFilterChange('paymentMethod', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank_transfer">Transferencia</SelectItem>
                <SelectItem value="credit_card">Tarjeta Crédito</SelectItem>
                <SelectItem value="debit_card">Tarjeta Débito</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="online_payment">Pago Online</SelectItem>
                <SelectItem value="crypto">Criptomoneda</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>

            {/* Estado */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          </div>

          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Fecha desde"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Fecha hasta"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Información de resultados */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {payments.length} de {totalCount} pagos
          </span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Referencia</TableHead>
                {showActions && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Cargando pagos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
                    <div className="text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron pagos</p>
                      <p className="text-sm">Intente ajustar los filtros de búsqueda</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {payment.purchaseInvoice?.invoiceNumber || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {payment.purchaseInvoice?.supplier?.name || 'Sin proveedor'}
                        </span>
                        {payment.purchaseInvoice?.supplier?.vat && (
                          <span className="text-xs text-gray-500">
                            RUT: {payment.purchaseInvoice.supplier.vat}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                        <span className="text-sm">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(payment.paymentDate)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.reference && (
                          <div className="font-mono text-xs text-gray-600">
                            {payment.reference}
                          </div>
                        )}
                        {payment.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onPaymentClick && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPaymentClick(payment.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Plus,
  Calendar,
  X
} from 'lucide-react';
import type { PurchasePaymentWithDetails, PurchasePaymentFilters } from '@/actions/purchases/payments/list';

interface PurchasePaymentTableProps {
  onPaymentClick?: (paymentId: number) => void;
  onNewPayment?: () => void;
  showActions?: boolean;
}

export default function PurchasePaymentTable({ onPaymentClick, onNewPayment, showActions = true }: PurchasePaymentTableProps) {
  const [payments, setPayments] = useState<PurchasePaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<PurchasePaymentFilters>({
    search: '',
    paymentMethod: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Cargar pagos
  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/purchases/payments/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data.payments || []);
        setTotalPages(data.data.totalPages || 0);
        setTotalCount(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cuando cambien filtros/paginación
  useEffect(() => {
    loadPayments();
  }, [currentPage, pageSize, filters]);

  const handleFilterChange = (field: keyof PurchasePaymentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset a primera página
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      paymentMethod: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completado', variant: 'success' as const },
      pending: { label: 'Pendiente', variant: 'warning' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      failed: { label: 'Fallido', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, variant: 'secondary' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Efectivo',
      bank_transfer: 'Transferencia',
      credit_card: 'Tarjeta Crédito',
      debit_card: 'Tarjeta Débito',
      check: 'Cheque',
      online_payment: 'Pago Online',
      crypto: 'Criptomoneda',
      other: 'Otro'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      bank_transfer: '🏦',
      credit_card: '💳',
      debit_card: '💳',
      check: '📝',
      online_payment: '💻',
      crypto: '₿',
      other: '📄'
    };
    return icons[method as keyof typeof icons] || '💰';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos de Facturas de Compras
          </CardTitle>
          {showActions && onNewPayment && (
            <Button onClick={onNewPayment} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Pago
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por referencia o notas..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Método de pago */}
            <Select
              value={filters.paymentMethod || 'all'}
              onValueChange={(value) => handleFilterChange('paymentMethod', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank_transfer">Transferencia</SelectItem>
                <SelectItem value="credit_card">Tarjeta Crédito</SelectItem>
                <SelectItem value="debit_card">Tarjeta Débito</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="online_payment">Pago Online</SelectItem>
                <SelectItem value="crypto">Criptomoneda</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>

            {/* Estado */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          </div>

          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Fecha desde"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Fecha hasta"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Información de resultados */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {payments.length} de {totalCount} pagos
          </span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Referencia</TableHead>
                {showActions && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Cargando pagos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
                    <div className="text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron pagos</p>
                      <p className="text-sm">Intente ajustar los filtros de búsqueda</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {payment.purchaseInvoice?.invoiceNumber || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {payment.purchaseInvoice?.supplier?.name || 'Sin proveedor'}
                        </span>
                        {payment.purchaseInvoice?.supplier?.vat && (
                          <span className="text-xs text-gray-500">
                            RUT: {payment.purchaseInvoice.supplier.vat}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                        <span className="text-sm">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(payment.paymentDate)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.reference && (
                          <div className="font-mono text-xs text-gray-600">
                            {payment.reference}
                          </div>
                        )}
                        {payment.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onPaymentClick && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPaymentClick(payment.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
 
 