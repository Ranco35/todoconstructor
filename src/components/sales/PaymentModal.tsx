'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentForm from './PaymentForm';

interface PaymentFormData {
  invoice_id: number | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string;
  notes: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialInvoiceId?: number;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, initialInvoiceId }: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (formData: PaymentFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/sales/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: formData.invoice_id,
          amount: formData.amount,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          reference_number: formData.reference_number || undefined,
          notes: formData.notes || undefined,
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitResult({
          success: true,
          message: `Pago de $${formData.amount.toLocaleString('es-CL')} registrado exitosamente.`
        });

        // Delay para mostrar el mensaje y luego cerrar
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Error al registrar el pago.'
        });
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      setSubmitResult({
        success: false,
        message: 'Error de conexión. Intente nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>
                Complete la información del pago recibido
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Mostrar resultado del envío */}
        {submitResult && (
          <Alert className={submitResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {submitResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
              {submitResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario de pago */}
        {!submitResult?.success && (
          <PaymentForm
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isSubmitting={isSubmitting}
            initialInvoiceId={initialInvoiceId}
          />
        )}

        {/* Estado de éxito con información adicional */}
        {submitResult?.success && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              ¡Pago Registrado Exitosamente!
            </h3>
            <p className="text-muted-foreground mb-4">
              El pago ha sido procesado y la factura ha sido actualizada automáticamente.
            </p>
            <div className="text-sm text-muted-foreground">
              Cerrando automáticamente...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 