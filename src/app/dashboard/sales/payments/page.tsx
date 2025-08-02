'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  DollarSign,
  Banknote,
  Building2,
  FileText
} from 'lucide-react';
import PaymentTable from '@/components/sales/PaymentTable';
import PaymentModal from '@/components/sales/PaymentModal';

interface PaymentStats {
  byMethod: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, number>;
  totalAmount: number;
  thisMonth: number;
  todayAmount: number;
  pendingInvoices: number;
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

const PAYMENT_METHOD_ICONS: Record<string, React.ComponentType<any>> = {
  'cash': Banknote,
  'bank_transfer': Building2,
  'credit_card': CreditCard,
  'debit_card': CreditCard,
  'check': FileText,
  'online_payment': CreditCard,
  'crypto': DollarSign,
  'other': Receipt
};

export default function PaymentsPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/sales/payments/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const handlePaymentSuccess = () => {
    setRefreshKey(prev => prev + 1);
    loadStats();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Módulo de Pagos</h1>
          <p className="text-muted-foreground mt-2">
            Gestione los pagos recibidos de las facturas emitidas
          </p>
        </div>
        <Button onClick={() => setShowPaymentModal(true)}>
          <Receipt className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {/* Estadísticas Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Recaudado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Desde el inicio
              </p>
            </CardContent>
          </Card>

          {/* Pagos Este Mes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Este Mes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Transacciones procesadas
              </p>
            </CardContent>
          </Card>

          {/* Recaudado Hoy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recaudado Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.todayAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresos del día
              </p>
            </CardContent>
          </Card>

          {/* Facturas Pendientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Por cobrar
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métodos de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Distribución por método de pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byMethod).map(([method, data]) => {
                  const Icon = PAYMENT_METHOD_ICONS[method] || Receipt;
                  const label = PAYMENT_METHOD_LABELS[method] || method;
                  const percentage = stats.totalAmount > 0 ? (data.amount / stats.totalAmount * 100) : 0;
                  
                  return (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} pagos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(data.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Estados de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="h-5 w-5" />
                Estados de Pagos
              </CardTitle>
              <CardDescription>
                Distribución por estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  const total = Object.values(stats.byStatus).reduce((sum, c) => sum + c, 0);
                  const percentage = total > 0 ? (count / total * 100) : 0;
                  
                  const statusConfig = {
                    completed: { label: 'Completados', color: 'bg-green-100 text-green-800' },
                    pending: { label: 'Pendientes', color: 'bg-yellow-100 text-yellow-800' },
                    cancelled: { label: 'Cancelados', color: 'bg-red-100 text-red-800' }
                  };
                  
                  const config = statusConfig[status as keyof typeof statusConfig] || { 
                    label: status, 
                    color: 'bg-gray-100 text-gray-800' 
                  };
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{count} pagos</div>
                        <div className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenido Principal */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Todos los Pagos</TabsTrigger>
          <TabsTrigger value="recent">Pagos Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <PaymentTable 
            key={refreshKey}
            onNewPayment={() => setShowPaymentModal(true)}
          />
        </TabsContent>

        <TabsContent value="recent">
          <PaymentTable 
            key={`recent-${refreshKey}`}
            onNewPayment={() => setShowPaymentModal(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Nuevo Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
} 