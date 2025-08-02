'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BudgetDetailView from '@/components/sales/BudgetDetailView';
import { getBudgetById, type BudgetWithDetails } from '@/actions/sales/budgets/get';
import { approveBudgetAndCreateInvoice } from '@/actions/sales/budgets/update';
import { updateBudgetStatus } from '@/actions/sales/budgets/update';
import { exportBudgetToPDF } from '@/utils/pdfExport';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const budgetId = parseInt(resolvedParams.id);

  const [budget, setBudget] = useState<BudgetWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (budgetId && !isNaN(budgetId)) {
      loadBudget();
      loadCurrentUser();
    } else {
      setError('ID de presupuesto inválido');
      setLoading(false);
    }
  }, [budgetId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getBudgetById(budgetId);
      
      if (result.success && result.data) {
        setBudget(result.data);
      } else {
        setError(result.error || 'Error al cargar el presupuesto');
      }
    } catch (err) {
      setError('Error inesperado al cargar el presupuesto');
      console.error('Error cargando presupuesto:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error cargando usuario actual:', err);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard/sales/budgets');
  };

  const handleEdit = () => {
    router.push(`/dashboard/sales/budgets/edit/${budgetId}`);
  };

  const handleDownload = async () => {
    if (!budget || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      // Preparar datos del presupuesto para el PDF
      const budgetData = {
        quoteNumber: budget.number,
        clientId: budget.clientId,
        expirationDate: budget.expirationDate,
        paymentTerms: budget.paymentTerms,
        currency: budget.currency || 'CLP',
        notes: budget.notes || '',
        total: budget.total,
        lines: budget.lines.map(line => ({
          tempId: `line-${line.id}`,
          productId: line.productId,
          productName: line.productName,
          description: line.description || line.productName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || 0,
          subtotal: line.subtotal
        }))
      };

      // Preparar datos del cliente si existen
      const clientData = budget.client ? {
        id: budget.client.id,
        firstName: budget.client.nombrePrincipal || '',
        lastName: budget.client.apellido || '',
        email: budget.client.email || '',
        phone: budget.client.telefono || budget.client.telefonoMovil || '',
        address: '', // No disponible en la estructura actual
        city: '', // No disponible en la estructura actual
        rut: budget.client.rut || ''
      } : undefined;

      // Generar y descargar PDF
      await exportBudgetToPDF(budgetData, clientData);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSend = async () => {
    if (!budget) return;
    setIsSending(true);
    setSendMessage(null);
    try {
      const result = await updateBudgetStatus(budgetId, 'sent');
      if (result.success) {
        setSendMessage('✅ Presupuesto enviado correctamente');
        setBudget(prev => prev ? { ...prev, status: 'sent' } : null);
      } else {
        setSendMessage(`❌ Error al enviar presupuesto: ${result.error}`);
      }
    } catch (error) {
      setSendMessage('❌ Error inesperado al enviar presupuesto');
    } finally {
      setIsSending(false);
    }
  };

  const handleConvert = () => {
    // TODO: Implementar conversión a factura
    console.log('Convirtiendo presupuesto a factura:', budgetId);
    // Aquí podrías redireccionar a crear factura desde presupuesto
  };

  const handleApprove = async () => {
    if (!budget) return;
    
    setIsApproving(true);
    setApprovalMessage(null);
    
    try {
      const result = await approveBudgetAndCreateInvoice(budgetId);
      
      if (result.success) {
        setApprovalMessage('✅ Presupuesto aprobado y factura creada exitosamente');
        
        // Actualizar el presupuesto en el estado
        setBudget(prev => prev ? { ...prev, status: 'converted' } : null);
        
        // Mostrar mensaje de éxito y redireccionar después de 2 segundos
        setTimeout(() => {
          router.push(`/dashboard/sales/invoices/${result.data.invoice.id}`);
        }, 2000);
      } else {
        setApprovalMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setApprovalMessage('❌ Error inesperado al aprobar presupuesto');
      console.error('Error aprobando presupuesto:', error);
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          
          {/* Navegación */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Presupuestos
            </Button>
          </div>

          {/* Loading */}
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 text-lg">Cargando presupuesto...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          
          {/* Navegación */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Presupuestos
            </Button>
          </div>

          {/* Error */}
          <div className="max-w-2xl mx-auto py-20">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadBudget}
                  className="ml-4"
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          
          {/* Navegación */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Presupuestos
            </Button>
          </div>

          {/* Not Found */}
          <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Presupuesto no encontrado</h2>
            <p className="text-gray-600 mb-6">
              El presupuesto con ID {budgetId} no existe o no tienes permisos para verlo.
            </p>
            <Button onClick={handleGoBack}>
              Volver a Presupuestos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      {/* Navegación */}
      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Presupuestos
        </Button>
      </div>

      {/* Mensaje de Envío */}
      {sendMessage && (
        <div className="container mx-auto px-4 mb-4">
          <Alert className={`${sendMessage.includes('✅') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{sendMessage}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Overlay de Envío */}
      {isSending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Enviando presupuesto...</p>
            </div>
          </div>
        </div>
      )}
      {/* Mensaje de Aprobación */}
      {approvalMessage && (
        <div className="container mx-auto px-4 mb-4">
          <Alert className={`${approvalMessage.includes('✅') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{approvalMessage}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Overlay de Aprobación */}
      {isApproving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Aprobando presupuesto y creando factura...</p>
            </div>
          </div>
        </div>
      )}
      {/* Detalle del Presupuesto */}
      <BudgetDetailView
        budget={budget}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onSend={handleSend}
        onConvert={handleConvert}
        onApprove={handleApprove}
        isDownloading={isDownloading}
        currentUser={currentUser}
      />
    </div>
  );
} 