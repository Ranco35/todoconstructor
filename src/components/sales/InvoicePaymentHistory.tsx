'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPaymentSummary } from '@/actions/sales/payments/create';
import { CreditCard, Calendar, User, FileText, DollarSign, Loader2 } from 'lucide-react';

interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  processedBy?: string;
  createdAt: string;
  status: string;
}

interface PaymentSummary {
  totalPaid: number;
  remainingBalance: number;
  payments: Payment[];
  invoiceTotal: number;
  isFullyPaid: boolean;
}

interface InvoicePaymentHistoryProps {
  invoiceId: number;
  invoiceTotal: number;
  onPaymentAdded?: () => void;
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

export default function InvoicePaymentHistory({ 
  invoiceId, 
  invoiceTotal, 
  onPaymentAdded 
}: InvoicePaymentHistoryProps) {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, [invoiceId]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const result = await getPaymentSummary(invoiceId);
      if (result.success && result.data) {
        setPaymentSummary(result.data);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return '💵';
      case 'bank_transfer': return '🏦';
      case 'credit_card': 
      case 'debit_card': return '💳';
      case 'check': return '📄';
      case 'online_payment': return '🌐';
      case 'crypto': return '₿';
      default: return '💰';
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-gray-600">Cargando historial de pagos...</span>
      </div>
    );
  }

  if (!paymentSummary || paymentSummary.payments.length === 0) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <CreditCard className="w-5 h-5" /> Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin pagos registrados</h3>
            <p className="text-gray-500">Aún no se han registrado pagos para esta factura.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <CreditCard className="w-5 h-5" /> Historial de Pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Resumen de Pagos */}
        <div className="bg-gray-50 p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentSummary.totalPaid)}
              </div>
              <div className="text-sm text-green-700">Total Pagado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(paymentSummary.remainingBalance)}
              </div>
              <div className="text-sm text-orange-700">Saldo Pendiente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {paymentSummary.payments.length}
              </div>
              <div className="text-sm text-gray-700">Pagos Realizados</div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          {invoiceTotal > 0 && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(paymentSummary.totalPaid / invoiceTotal) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {((paymentSummary.totalPaid / invoiceTotal) * 100).toFixed(1)}% pagado
              </div>
            </div>
          )}
        </div>

        {/* Tabla de Pagos */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Fecha</TableHead>
                <TableHead className="w-[120px]">Monto</TableHead>
                <TableHead className="w-[150px]">Método</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[150px]">Referencia</TableHead>
                <TableHead className="w-[120px]">Procesado por</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentSummary.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {formatDate(payment.paymentDate)}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                      <span className="text-sm">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {payment.referenceNumber || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {payment.processedBy || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                    {payment.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 