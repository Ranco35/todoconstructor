'use client';

import { useState, useEffect } from 'react';
import { getReservationPayments } from '@/actions/reservations/management';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
  created_at: string;
  payment_type: string; // Added payment_type
}

interface SimplePaymentHistoryProps {
  reservationId: number;
}

export default function SimplePaymentHistory({ reservationId }: SimplePaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reservationId) {
      loadPaymentHistory();
    }
  }, [reservationId]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const result = await getReservationPayments(reservationId);
      if (result.success) {
        setPayments(result.data || []);
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo': return '💵';
      case 'tarjeta_credito': 
      case 'tarjeta_debito': return '💳';
      case 'transferencia': return '🏦';
      case 'cheque': return '📄';
      default: return '💰';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta_credito': return 'Tarjeta de Crédito';
      case 'tarjeta_debito': return 'Tarjeta de Débito';
      case 'transferencia': return 'Transferencia';
      case 'cheque': return 'Cheque';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando historial...</span>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">No hay pagos registrados</p>
        <p className="text-gray-400 text-sm">Los pagos aparecerán aquí cuando se procesen</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {getPaymentMethodIcon(payment.payment_method)}
              </span>
              <div>
                <div className="font-semibold text-gray-800 text-lg">
                  ${payment.amount.toLocaleString()}
                </div>
                <div className="inline-block px-2 py-1 rounded text-xs font-bold ml-1"
                  style={{
                    backgroundColor: payment.payment_type === 'pago_total' ? '#16a34a' : '#fbbf24',
                    color: payment.payment_type === 'pago_total' ? 'white' : '#92400e',
                  }}>
                  {payment.payment_type === 'pago_total' ? 'Pago Total' : 'Abono'}
                </div>
                <div className="text-sm text-gray-600">
                  {getPaymentMethodLabel(payment.payment_method)}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar size={14} />
                <span className="font-medium">Fecha de Pago:</span> {formatDate(payment.created_at)}
              </div>
            </div>
          </div>
          
          {payment.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Notas:</span> {payment.notes}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 