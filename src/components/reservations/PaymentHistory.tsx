'use client';

import { useState, useEffect } from 'react';
import { getPaymentHistory } from '@/actions/reservations/process-payment';
import { CreditCard, Calendar, User, FileText, DollarSign } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  payment_type: 'abono' | 'pago_total';
  payment_method: string;
  previous_paid_amount: number;
  new_total_paid: number;
  remaining_balance: number;
  total_reservation_amount: number;
  reference_number?: string;
  notes?: string;
  processed_by: string;
  created_at: string;
}

interface PaymentHistoryProps {
  reservationId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentHistory({ reservationId, isOpen, onClose }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reservationId) {
      loadPaymentHistory();
    }
  }, [isOpen, reservationId]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const result = await getPaymentHistory(reservationId);
      if (result.success) {
        setPayments(result.payments);
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

  const getPaymentTypeColor = (type: string) => {
    return type === 'pago_total' 
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo': return '💵';
      case 'tarjeta': return '💳';
      case 'transferencia': return '🏦';
      case 'cheque': return '📄';
      default: return '💰';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={24} />
              <h2 className="text-xl font-bold">Historial de Pagos</h2>
              <span className="bg-blue-500 px-2 py-1 rounded-full text-sm">
                Reserva #{reservationId}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando historial...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hay pagos registrados</p>
              <p className="text-gray-400 text-sm">Los pagos aparecerán aquí cuando se procesen</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Resumen</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total pagado:</span>
                    <div className="text-lg font-bold text-green-600">
                      ${payments[0]?.new_total_paid?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Saldo pendiente:</span>
                    <div className="text-lg font-bold text-blue-600">
                      ${payments[0]?.remaining_balance?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total reserva:</span>
                    <div className="text-lg font-bold text-gray-800">
                      ${payments[0]?.total_reservation_amount?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment List */}
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {getPaymentMethodIcon(payment.payment_method)}
                          </span>
                          <div>
                            <div className="font-semibold text-gray-800">
                              ${payment.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {payment.payment_method}
                            </div>
                          </div>
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getPaymentTypeColor(payment.payment_type)}`}
                          >
                            {payment.payment_type === 'pago_total' ? '✅ Pago Total' : '💰 Abono'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                {formatDate(payment.created_at)}
                              </span>
                            </div>
                            {payment.processed_by && (
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                <span className="text-gray-600">
                                  Procesado por: {payment.processed_by}
                                </span>
                              </div>
                            )}
                            {payment.reference_number && (
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-gray-400" />
                                <span className="text-gray-600">
                                  Ref: {payment.reference_number}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              Total pagado después: 
                              <span className="font-medium text-green-600 ml-1">
                                ${payment.new_total_paid.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              Saldo restante: 
                              <span className="font-medium text-blue-600 ml-1">
                                ${payment.remaining_balance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <strong>Observaciones:</strong> {payment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 