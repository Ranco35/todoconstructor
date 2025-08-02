'use client';

import React from 'react';
import { SupplierPaymentData } from '@/actions/suppliers/payments';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  MoreHorizontal,
  Receipt,
  Clock,
  MapPin,
  Hash
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SupplierPaymentHistoryProps {
  payments: SupplierPaymentData[];
  totalAmount: number;
  totalPayments: number;
  isLoading?: boolean;
}

// Iconos y colores para métodos de pago
const paymentMethodConfig = {
  cash: {
    icon: Banknote,
    label: 'Efectivo',
    color: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600'
  },
  transfer: {
    icon: Smartphone,
    label: 'Transferencia',
    color: 'bg-blue-100 text-blue-800',
    iconColor: 'text-blue-600'
  },
  card: {
    icon: CreditCard,
    label: 'Tarjeta',
    color: 'bg-purple-100 text-purple-800',
    iconColor: 'text-purple-600'
  },
  other: {
    icon: MoreHorizontal,
    label: 'Otro',
    color: 'bg-gray-100 text-gray-800',
    iconColor: 'text-gray-600'
  }
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return `Hace ${Math.floor(days / 365)} años`;
}

export default function SupplierPaymentHistory({ 
  payments, 
  totalAmount, 
  totalPayments, 
  isLoading = false 
}: SupplierPaymentHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Cargando pagos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin pagos registrados
            </h3>
            <p className="text-gray-500">
              Este proveedor no tiene pagos realizados desde caja chica.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Historial de Pagos
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total pagado</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-xs text-gray-400">
              {totalPayments} pago{totalPayments !== 1 ? 's' : ''}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => {
            const methodConfig = paymentMethodConfig[payment.paymentMethod];
            const PaymentIcon = methodConfig.icon;

            return (
              <div
                key={payment.id}
                className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${methodConfig.color.replace('text-', 'bg-').replace('-800', '-100')}`}>
                        <PaymentIcon className={`h-4 w-4 ${methodConfig.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {payment.description}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {payment.CashSession.sessionNumber} • {getTimeAgo(payment.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Detalles adicionales */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payment.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {payment.User.name}
                        </div>
                      </div>

                      {payment.CostCenter && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building className="h-3 w-3" />
                          {payment.CostCenter.name}
                          {payment.CostCenter.code && (
                            <span className="text-gray-400">({payment.CostCenter.code})</span>
                          )}
                        </div>
                      )}

                      {payment.receiptNumber && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Receipt className="h-3 w-3" />
                          Comprobante: {payment.receiptNumber}
                        </div>
                      )}

                      {(payment.bankReference || payment.bankAccount) && (
                        <div className="text-sm text-gray-600">
                          {payment.bankReference && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              Ref: {payment.bankReference}
                            </div>
                          )}
                          {payment.bankAccount && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Cuenta: {payment.bankAccount}
                            </div>
                          )}
                        </div>
                      )}

                      {payment.notes && (
                        <div className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                          "{payment.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monto y método */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {formatCurrency(payment.amount)}
                    </div>
                    <Badge className={methodConfig.color}>
                      {methodConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen al final */}
        {payments.length > 3 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total de pagos mostrados</span>
              <span className="font-semibold">{payments.length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 