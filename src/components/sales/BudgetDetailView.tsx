'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin,
  Download,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import type { BudgetWithDetails } from '@/actions/sales/budgets/get';
import EmailBudgetModal from './EmailBudgetModal';
import BudgetEmailHistory from './BudgetEmailHistory';
import InternalNotesSection from './InternalNotesSection';

interface BudgetDetailViewProps {
  budget: BudgetWithDetails;
  onEdit?: () => void;
  onDownload?: () => void;
  onSend?: () => void;
  onConvert?: () => void;
  onApprove?: () => void;
  isDownloading?: boolean;
  currentUser?: any;
}

export default function BudgetDetailView({ 
  budget, 
  onEdit, 
  onDownload, 
  onSend,
  onConvert,
  onApprove,
  isDownloading = false,
  currentUser 
}: BudgetDetailViewProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailHistoryKey, setEmailHistoryKey] = useState(0);

  const handleEmailSent = () => {
    // Refrescar el historial de emails cuando se envía un nuevo email
    setEmailHistoryKey(prev => prev + 1);
  };
  
  const formatCurrency = (amount: number, currency: string = 'CLP'): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Edit },
      sent: { label: 'Enviado', variant: 'default' as const, icon: Send },
      accepted: { label: 'Aceptado', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rechazado', variant: 'destructive' as const, icon: XCircle },
      expired: { label: 'Expirado', variant: 'destructive' as const, icon: Clock },
      converted: { label: 'Convertido', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateSubtotals = () => {
    const subtotal = budget.lines.reduce((sum, line) => sum + line.subtotal, 0);
    const iva = subtotal * 0.19; // IVA 19%
    const total = subtotal + iva;
    
    return { subtotal, iva, total };
  };

  const { subtotal, iva, total } = calculateSubtotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <FileText className="text-white text-2xl w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Presupuesto {budget.number}</h1>
              <p className="text-gray-600 text-lg">Detalle completo del presupuesto</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusBadge(budget.status)}
            
            <div className="flex gap-2">
              {(budget.status === 'draft' || budget.status === 'sent') && onEdit && (
                <Button onClick={onEdit} variant="outline" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              )}
              
              {budget.status === 'draft' && onSend && (
                <Button onClick={onSend} variant="default" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar
                </Button>
              )}

              {/* Botón de envío por email - disponible para presupuestos con cliente */}
              {budget.client && (
                <Button 
                  onClick={() => setShowEmailModal(true)} 
                  variant="outline" 
                  className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Mail className="w-4 h-4" />
                  Enviar por Email
                </Button>
              )}
              
              {budget.status === 'sent' && onApprove && (
                <Button onClick={onApprove} variant="default" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Aprobar y Crear Factura
                </Button>
              )}
              
              {budget.status === 'accepted' && onConvert && (
                <Button onClick={onConvert} variant="default" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Convertir a Factura
                </Button>
              )}
              
              {onDownload && (
                <Button onClick={onDownload} variant="outline" className="flex items-center gap-2" disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Información Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información del Cliente */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <User className="w-5 h-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {budget.client ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {budget.client.nombrePrincipal} {budget.client.apellido}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          {budget.client.email}
                        </div>
                        {budget.client.telefono && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {budget.client.telefono}
                          </div>
                        )}
                        {budget.client.telefonoMovil && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            Móvil: {budget.client.telefonoMovil}
                          </div>
                        )}
                        {budget.client.rut && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4" />
                            RUT: {budget.client.rut}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Cliente no encontrado</p>
                )}
              </CardContent>
            </Card>

            {/* Líneas del Presupuesto */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <FileText className="w-5 h-5" />
                  Líneas del Presupuesto
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
                      {budget.lines.map((line) => (
                        <tr key={line.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-6 w-2/5 min-w-[200px]">
                            <div className="font-medium text-gray-900 break-words">
                              {line.productName || line.description || 'Producto sin descripción'}
                            </div>
                            {line.productName && line.description && line.productName !== line.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {line.description}
                              </div>
                            )}
                            {line.productId && (
                              <div className="text-sm text-gray-500 mt-1">
                                ID: {line.productId}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                              {line.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-medium">
                            {formatCurrency(line.unitPrice, budget.currency)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {line.discountPercent > 0 && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                -{line.discountPercent}%
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-gray-900">
                            {formatCurrency(line.subtotal, budget.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral (1/3) */}
          <div className="space-y-6">
            
            {/* Resumen Financiero */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <DollarSign className="w-5 h-5" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal Neto:</span>
                    <span className="font-medium">{formatCurrency(subtotal, budget.currency)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (19%):</span>
                    <span className="font-medium">{formatCurrency(iva, budget.currency)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(total, budget.currency)}
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 text-center font-medium">
                      💰 IVA incluido
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información General */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Calendar className="w-5 h-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                    <p className="text-gray-900 font-medium">{formatDate(budget.createdAt)}</p>
                  </div>
                  
                  {budget.expirationDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Vencimiento</label>
                      <p className="text-gray-900 font-medium">{formatDate(budget.expirationDate)}</p>
                    </div>
                  )}
                  
                  {budget.paymentTerms && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Términos de Pago</label>
                      <p className="text-gray-900 font-medium">{budget.paymentTerms} días</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Moneda</label>
                    <p className="text-gray-900 font-medium">{budget.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            {budget.notes && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <FileText className="w-5 h-5" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{budget.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Historial de Emails */}
            <BudgetEmailHistory 
              key={emailHistoryKey}
              budgetId={budget.id} 
              className="border-0 shadow-xl"
            />

            {/* Notas Internas - Solo para Personal Interno */}
            <InternalNotesSection
              budgetId={budget.id}
              initialNotes={budget.internalNotes || ''}
              userRole={currentUser?.role || 'USER'}
            />
          </div>
        </div>

        {/* Modal de Envío de Email */}
        <EmailBudgetModal
          budget={budget}
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onEmailSent={handleEmailSent}
        />
      </div>
    </div>
  );
} 