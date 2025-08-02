'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { addPayment } from '@/actions/reservations/update';
import { toast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Loader2 } from 'lucide-react';

interface AddPaymentModalProps {
  reservationId: number;
  currentPaidAmount: number;
  totalAmount: number;
  pendingAmount: number;
  paymentStatus: string;
  trigger?: React.ReactNode;
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
  { value: 'tarjeta_debito', label: '💳 Tarjeta de Débito' },
  { value: 'transferencia', label: '🏦 Transferencia Bancaria' },
  { value: 'cheque', label: '📝 Cheque' },
  { value: 'deposito', label: '🏛️ Depósito Bancario' },
  { value: 'otro', label: '🔸 Otro' }
];

export default function AddPaymentModal({
  reservationId,
  currentPaidAmount,
  totalAmount,
  pendingAmount,
  paymentStatus,
  trigger
}: AddPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    method: '',
    reference: '',
    notes: '',
    processedBy: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.method || !formData.processedBy) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Error", 
        description: "El monto debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (amount > pendingAmount) {
      toast({
        title: "Advertencia",
        description: `El monto excede lo pendiente ($${pendingAmount.toLocaleString('es-CL')}). ¿Está seguro?`,
        variant: "destructive"
      });
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('method', formData.method);
      data.append('reference', formData.reference);
      data.append('notes', formData.notes);
      data.append('processedBy', formData.processedBy);

      const result = await addPayment(reservationId, data);

      if (result.success) {
        toast({
          title: "¡Pago registrado!",
          description: `Se registró el pago de $${amount.toLocaleString('es-CL')} correctamente`,
        });

        // Resetear formulario
        setFormData({
          amount: '',
          method: '',
          reference: '',
          notes: '',
          processedBy: ''
        });
        
        setOpen(false);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al registrar el pago',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">✅ Pagado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Parcial</Badge>;
      case 'no_payment':
        return <Badge className="bg-red-100 text-red-800">❌ Sin Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">⚠️ Vencido</Badge>;
      default:
        return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
            <DollarSign className="w-4 h-4 mr-2" />
            Agregar Abono
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Agregar Abono/Pago
          </DialogTitle>
        </DialogHeader>

        {/* Estado actual de pagos */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado:</span>
            {getPaymentStatusBadge()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="font-semibold">${totalAmount.toLocaleString('es-CL')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pagado:</span>
            <span className="text-green-600 font-semibold">${currentPaidAmount.toLocaleString('es-CL')}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm text-gray-600">Pendiente:</span>
            <span className="text-red-600 font-semibold">${pendingAmount.toLocaleString('es-CL')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Pago *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 50000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="text-lg font-semibold"
            />
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="method">Método de Pago *</Label>
            <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Referencia */}
          <div className="space-y-2">
            <Label htmlFor="reference">Referencia/Comprobante</Label>
            <Input
              id="reference"
              placeholder="Ej: Nº transacción, comprobante, etc."
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          {/* Procesado por */}
          <div className="space-y-2">
            <Label htmlFor="processedBy">Procesado por *</Label>
            <Input
              id="processedBy"
              placeholder="Nombre del responsable"
              value={formData.processedBy}
              onChange={(e) => setFormData({ ...formData, processedBy: e.target.value })}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Comentarios adicionales..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Registrar Pago
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 