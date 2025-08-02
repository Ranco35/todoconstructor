'use client';

import React, { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/actions/sales/invoices/list';
import { getPaymentSummary } from '@/actions/sales/payments/create';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, User, DollarSign, Edit3, Link as LinkIcon, CreditCard, History } from 'lucide-react';
import Link from 'next/link';
import PaymentModal from '@/components/sales/PaymentModal';
import InvoicePaymentHistory from '@/components/sales/InvoicePaymentHistory';

function getStatusBadge(status: string) {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' },
    sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Pagada', color: 'bg-green-100 text-green-800' },
    overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Anulada', color: 'bg-gray-100 text-gray-800' },
    converted: { label: 'Convertida', color: 'bg-purple-100 text-purple-800' },
  };
  const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.color}`}>{c.label}</span>;
}

interface PaymentSummary {
  totalPaid: number;
  remainingBalance: number;
  payments: any[];
  invoiceTotal: number;
  isFullyPaid: boolean;
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = Number(resolvedParams.id);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (isNaN(invoiceId)) return;
    loadInvoiceData();
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      // Cargar factura
      const result = await getInvoiceById(invoiceId);
      if (!result.success || !result.data) {
        notFound();
      }
      setInvoice(result.data);

      // Cargar resumen de pagos
      const paymentResult = await getPaymentSummary(invoiceId);
      if (paymentResult.success && paymentResult.data) {
        setPaymentSummary(paymentResult.data);
      }
    } catch (error) {
      console.error('Error loading invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Recargar datos después de un pago exitoso
    loadInvoiceData();
  };

  const formatCurrency = (amount: number, currency: string = 'CLP'): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return notFound();
  }

  const canAddPayment = invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-xl shadow-lg">
              <FileText className="text-white text-2xl w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Factura {invoice.number}
                {getStatusBadge(invoice.status)}
              </h1>
              <p className="text-gray-600 text-lg">Detalle completo de la factura</p>
              {invoice.budget_id && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                  <LinkIcon className="w-4 h-4" />
                  Presupuesto origen:
                  <Link href={`/dashboard/sales/budgets/${invoice.budget_id}`} className="underline hover:text-blue-900">
                    #{invoice.budget_id}
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <Link href={`/dashboard/sales/invoices/edit/${invoice.id}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Editar
                </Button>
              </Link>
            )}
            {canAddPayment && (
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="w-4 h-4" /> Registrar Pago
              </Button>
            )}
            <Link href="/dashboard/sales/invoices">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" /> Volver a Facturas
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información del Cliente */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <User className="w-5 h-5" /> Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {invoice.client ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {invoice.client.nombrePrincipal} {invoice.client.apellido}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" /> {invoice.client.email}
                      </div>
                      {invoice.client.telefono && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" /> {invoice.client.telefono}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Cliente no encontrado</p>
                )}
              </CardContent>
            </Card>

            {/* Líneas de la Factura */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <FileText className="w-5 h-5" /> Líneas de la Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-4 px-6 font-medium text-gray-700 w-2/5 min-w-[200px]">Descripción</th>
                        <th className="text-center py-4 px-6 font-medium text-gray-700 w-1/6">Cantidad</th>
                        <th className="text-right py-4 px-6 font-medium text-gray-700 w-1/6">Precio Unit.</th>
                        <th className="text-center py-4 px-6 font-medium text-gray-700 w-1/6">Desc. %</th>
                        <th className="text-right py-4 px-6 font-medium text-gray-700 w-1/6">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line: any) => (
                        <tr key={line.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-6 w-2/5 min-w-[200px]">
                            <div className="font-medium text-gray-900 break-words">
                              {line.productName || line.description || 'Producto sin descripción'}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">{line.quantity}</td>
                          <td className="py-4 px-6 text-right">{formatCurrency(line.unitPrice)}</td>
                          <td className="py-4 px-6 text-center">{line.discountPercent}%</td>
                          <td className="py-4 px-6 text-right">{formatCurrency(line.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Historial de Pagos */}
            <InvoicePaymentHistory 
              invoiceId={invoiceId}
              invoiceTotal={invoice.total}
              onPaymentAdded={handlePaymentSuccess}
            />
          </div>

          {/* Resumen Financiero (1/3) */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <DollarSign className="w-5 h-5" /> Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Subtotal Neto:</span>
                  <span>{formatCurrency(invoice.total / 1.19)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">IVA (19%):</span>
                  <span>{formatCurrency(invoice.total - invoice.total / 1.19)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-700">{formatCurrency(invoice.total)}</span>
                </div>
                
                {/* Información de Pagos */}
                {paymentSummary && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Pagado:</span>
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(paymentSummary.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Pendiente:</span>
                        <span className="text-orange-600 font-semibold">
                          {formatCurrency(paymentSummary.remainingBalance)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    {invoice.total > 0 && (
                      <div className="mt-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(paymentSummary.totalPaid / invoice.total) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {((paymentSummary.totalPaid / invoice.total) * 100).toFixed(1)}% pagado
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="text-xs text-green-700 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> IVA incluido
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Fecha de creación */}
        <div className="mt-8 text-right text-sm text-gray-500">
          Fecha de creación: {invoice.created_at ? new Date(invoice.created_at).toLocaleString('es-CL') : '-'}
        </div>
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        initialInvoiceId={invoiceId}
      />
    </div>
  );
} 