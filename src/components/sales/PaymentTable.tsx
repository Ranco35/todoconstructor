'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Filter, Receipt, Calendar, CreditCard, User, FileText } from 'lucide-react';
import { PaginationControls } from '@/components/shared/PaginationControls';

interface PaymentWithDetails {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  status: string;
  createdAt: string;
  invoice: {
    id: number;
    number: string;
    total: number;
    client: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
}

interface PaymentFilters {
  search?: string;
  paymentMethod?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface PaymentTableProps {
  onPaymentClick?: (payment: PaymentWithDetails) => void;
  onNewPayment?: () => void;
  showActions?: boolean;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'cash': 'Efectivo',
  'bank_transfer': 'Transferencia Bancaria',
  'credit_card': 'Tarjeta de Crédito',
  'debit_card': 'Tarjeta de Débito',
  'check': 'Cheque',
  'online_payment': 'Pago Online',
  'crypto': 'Criptomoneda',
  'other': 'Otro'
};

const STATUS_LABELS: Record<string, string> = {
  'completed': 'Completado',
  'pending': 'Pendiente',
  'cancelled': 'Cancelado'
};

const STATUS_COLORS: Record<string, string> = {
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
};

export default function PaymentTable({ onPaymentClick, onNewPayment, showActions = true }: PaymentTableProps) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [filters, setFilters] = useState<PaymentFilters>({
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

      const response = await fetch(`/api/sales/payments/list?${params}`);
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

  const handleFilterChange = (field: keyof PaymentFilters, value: string) => {
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
    const label = STATUS_LABELS[status] || status;
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    
    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const label = PAYMENT_METHOD_LABELS[method] || method;
    return (
      <Badge variant="secondary" className="text-xs">
        {label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Pagos Registrados
            </CardTitle>
            <CardDescription>
              Gestione los pagos recibidos de las facturas
            </CardDescription>
          </div>
          {showActions && onNewPayment && (
            <Button onClick={onNewPayment}>
              <Receipt className="h-4 w-4 mr-2" />
              Nuevo Pago
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Referencia, notas..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="method">Método</Label>
            <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => handleFilterChange('paymentMethod', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateFrom">Desde</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dateTo">Hasta</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        {/* Botón limpiar filtros */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando pagos...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron pagos</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                  {showActions && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow 
                    key={payment.id}
                    className={onPaymentClick ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => onPaymentClick?.(payment)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(payment.paymentDate)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{payment.invoice?.number || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            Total: {payment.invoice ? formatCurrency(payment.invoice.total) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {payment.invoice?.client 
                              ? `${payment.invoice.client.firstName} ${payment.invoice.client.lastName}`
                              : 'Cliente desconocido'
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.invoice?.client?.email || 'Sin email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getPaymentMethodBadge(payment.paymentMethod)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {payment.referenceNumber || 'Sin referencia'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>

                    {showActions && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPaymentClick?.(payment);
                          }}
                        >
                          Ver Detalles
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationControls
              basePath="/dashboard/sales/payments"
              itemName="pagos"
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              currentCount={payments.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 