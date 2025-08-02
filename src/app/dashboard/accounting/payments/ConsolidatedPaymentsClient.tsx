'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Download, Eye, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/currency';
import { getConsolidatedPayments, getConsolidatedPaymentsStats, type ConsolidatedPayment, type ConsolidatedPaymentsStats, type ConsolidatedPaymentsFilters } from '@/actions/accounting/consolidated-payments';

interface ConsolidatedPaymentsClientProps {
  currentUser: any;
}

export default function ConsolidatedPaymentsClient({ currentUser }: ConsolidatedPaymentsClientProps) {
  const [payments, setPayments] = useState<ConsolidatedPayment[]>([]);
  const [stats, setStats] = useState<ConsolidatedPaymentsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ConsolidatedPaymentsFilters>({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Primer día del mes actual
    dateTo: new Date().toISOString().split('T')[0] // Hoy
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const [paymentsResult, statsResult] = await Promise.all([
        getConsolidatedPayments(filters),
        getConsolidatedPaymentsStats(filters)
      ]);

      if (paymentsResult.success && paymentsResult.data) {
        setPayments(paymentsResult.data);
      } else {
        console.error('Error cargando pagos:', paymentsResult.error);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        console.error('Error cargando estadísticas:', statsResult.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ConsolidatedPaymentsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const getSourceIcon = (source: string) => {
    const icons = {
      pos: '🛒',
      reservation: '🏨',
      supplier: '🏢',
      invoice: '📄',
      petty_cash_income: '💰',
      petty_cash_expense: '💸'
    };
    return icons[source as keyof typeof icons] || '💳';
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      card: '💳',
      transfer: '🏦',
      check: '📝'
    };
    return icons[method as keyof typeof icons] || '💳';
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? '📈' : '📉';
  };

  const getTypeBadge = (type: string) => {
    return type === 'income' ? (
      <Badge className="bg-green-100 text-green-800">Ingreso</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Egreso</Badge>
    );
  };

  // Filtrar pagos por término de búsqueda
  const filteredPayments = payments.filter(payment =>
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separar por tipo
  const incomePayments = filteredPayments.filter(p => p.type === 'income');
  const expensePayments = filteredPayments.filter(p => p.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Pagos Consolidados</h1>
            <p className="text-emerald-100">Vista unificada de todos los pagos del sistema</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">💳</div>
            <div className="text-emerald-200">Sistema Unificado</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Fecha desde */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Fecha hasta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            {/* Fuente */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fuente</label>
              <Select 
                value={filters.source || 'all'} 
                onValueChange={(value) => handleFilterChange('source', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="reservation">Reservas</SelectItem>
                  <SelectItem value="supplier">Proveedores</SelectItem>
                  <SelectItem value="invoice">Facturas</SelectItem>
                  <SelectItem value="petty_cash_income">Caja Chica (Ingresos)</SelectItem>
                  <SelectItem value="petty_cash_expense">Caja Chica (Gastos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Método de pago */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Método</label>
              <Select 
                value={filters.paymentMethod || 'all'} 
                onValueChange={(value) => handleFilterChange('paymentMethod', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select 
                value={filters.type || 'all'} 
                onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Egresos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monto mínimo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto mín.</label>
              <Input
                type="number"
                placeholder="$0"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Búsqueda de texto */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por descripción, referencia o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas resumidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Egresos</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Balance Neto</p>
                  <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netAmount)}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transacciones</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPayments}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Desglose por fuente y método de pago */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por fuente */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose por Fuente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.bySource).map(([source, data]) => (
                  <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSourceIcon(source)}</span>
                      <span className="font-medium capitalize">{source.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${data.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{data.count} transacciones</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por método de pago */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose por Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byPaymentMethod).map(([method, data]) => (
                  <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPaymentMethodIcon(method)}</span>
                      <span className="font-medium capitalize">{method}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${data.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{data.count} transacciones</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de pagos con tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Pagos</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avanzados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todos ({filteredPayments.length})</TabsTrigger>
              <TabsTrigger value="income">Ingresos ({incomePayments.length})</TabsTrigger>
              <TabsTrigger value="expense">Egresos ({expensePayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <PaymentsList payments={filteredPayments} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="income">
              <PaymentsList payments={incomePayments} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="expense">
              <PaymentsList payments={expensePayments} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para la lista de pagos
function PaymentsList({ payments, isLoading }: { payments: ConsolidatedPayment[], isLoading: boolean }) {
  const getSourceIcon = (source: string) => {
    const icons = {
      pos: '🛒',
      reservation: '🏨',
      supplier: '🏢',
      invoice: '📄',
      petty_cash_income: '💰',
      petty_cash_expense: '💸'
    };
    return icons[source as keyof typeof icons] || '💳';
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      card: '💳',
      transfer: '🏦',
      check: '📝'
    };
    return icons[method as keyof typeof icons] || '💳';
  };

  const getTypeBadge = (type: string) => {
    return type === 'income' ? (
      <Badge className="bg-green-100 text-green-800">Ingreso</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Egreso</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">💳</div>
        <p className="text-gray-500 text-lg">No se encontraron pagos</p>
        <p className="text-gray-400">Ajusta los filtros para ver más resultados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment, index) => (
        <div key={`${payment.source}-${payment.id}-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getSourceIcon(payment.source)}</span>
                <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{payment.description}</p>
                  {getTypeBadge(payment.type)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="capitalize">{payment.source.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{payment.paymentMethod}</span>
                  <span>•</span>
                  <span>{new Date(payment.date).toLocaleDateString('es-CL')}</span>
                  {payment.customerName && (
                    <>
                      <span>•</span>
                      <span>{payment.customerName}</span>
                    </>
                  )}
                  {payment.reference && (
                    <>
                      <span>•</span>
                      <span>Ref: {payment.reference}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className={`text-lg font-bold ${payment.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {payment.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(payment.amount))}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 