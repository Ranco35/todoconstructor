'use client';

import React, { useState, useEffect } from 'react';
import { listInvoices, type InvoiceListResponse, type InvoiceFilters } from '@/actions/sales/invoices/list';
import { convertBudgetToInvoice } from '@/actions/sales/invoices/create';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PaginationControls from '@/components/shared/PaginationControls';
import { 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Search, 
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Download,
  Send,
  CreditCard
} from 'lucide-react';

interface InvoiceTableProps {
  onEditInvoice?: (invoice: any) => void;
  onViewInvoice?: (invoice: any) => void;
  onRefresh?: () => void;
  onPaymentClick?: (invoiceId: number) => void;
}

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Pagada', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800' }
];

export default function InvoiceTable({ onEditInvoice, onViewInvoice, onRefresh, onPaymentClick }: InvoiceTableProps) {
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Estados de filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Cargar datos
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await listInvoices({
        page: currentPage,
        pageSize,
        filters: {
          ...filters,
          search: searchTerm || undefined
        }
      });

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentPage, pageSize, filters, searchTerm]);

  const handleFilterChange = (key: keyof InvoiceFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = INVOICE_STATUSES.find(s => s.value === status);
    if (!statusConfig) return <Badge>{status}</Badge>;
    
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const handleConvertBudget = async (budgetId: number) => {
    setActionLoading(budgetId);
    try {
      const result = await convertBudgetToInvoice(budgetId);
      if (result.success) {
        loadInvoices();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error al convertir presupuesto:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getDaysUntilDue = (dueDateString: string | null | undefined): number | null => {
    if (!dueDateString) return null;
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDueDateBadge = (dueDateString: string | null | undefined, status: string) => {
    if (!dueDateString || status === 'paid') return null;
    
    const daysUntilDue = getDaysUntilDue(dueDateString);
    if (daysUntilDue === null) return null;

    if (daysUntilDue < 0) {
      return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
    } else if (daysUntilDue <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800">Próximo a vencer</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturas ({data?.total || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por número de factura o notas..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {(Object.keys(filters).length > 0 || searchTerm) && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {INVOICE_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Desde</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hasta</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Número</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vencimiento</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data?.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.number}</p>
                        {invoice.budgetId && (
                          <p className="text-xs text-gray-500">
                            Desde presupuesto #{invoice.budgetId}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      {invoice.client ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.client.firstName} {invoice.client.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{invoice.client.email}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Cliente no encontrado</p>
                      )}
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invoice.status)}
                        {getDueDateBadge(invoice.dueDate, invoice.status)}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(invoice.createdAt)}
                    </td>
                    
                    <td className="py-3 px-4 text-gray-600">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </td>
                    
                    <td className="py-3 px-4 text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <p className="text-xs text-gray-500">{invoice.currency}</p>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {onViewInvoice && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewInvoice(invoice)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onEditInvoice && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditInvoice(invoice)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {invoice.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Enviar factura"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && onPaymentClick && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPaymentClick(invoice.id)}
                            title="Registrar pago"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!data?.invoices || data.invoices.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No hay facturas</p>
              <p className="text-sm">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'No se encontraron facturas con los filtros aplicados'
                  : 'Aún no se han creado facturas'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {data && data.totalPages > 1 && (
        <PaginationControls
          basePath="/dashboard/sales/invoices"
          itemName="facturas"
          currentPage={currentPage}
          totalPages={data.totalPages}
          pageSize={pageSize}
          totalCount={data.total}
          currentCount={data.invoices.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
} 