'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Package, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { createInvoiceFromReservation, getReservationForInvoice } from '@/actions/reservations/create-invoice-from-reservation';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CreateInvoiceFromReservationProps {
  reservationId: number;
  reservationStatus: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function CreateInvoiceFromReservation({ 
  reservationId, 
  reservationStatus, 
  onSuccess,
  trigger 
}: CreateInvoiceFromReservationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    notes: '',
    paymentTerms: '30 días'
  });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const canCreateInvoice = reservationStatus === 'finalizada';

  const handleOpen = async () => {
    if (!canCreateInvoice) {
      toast({
        title: "No se puede crear factura",
        description: "Solo se pueden crear facturas de reservas finalizadas.",
        variant: "destructive"
      });
      return;
    }

    setIsOpen(true);
    setLoading(true);
    setResult(null);

    try {
      const dataResult = await getReservationForInvoice(reservationId);
      if (dataResult.success && dataResult.data) {
        setReservationData(dataResult.data);
        
        // Generar número de factura automático
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        const autoNumber = `F-RES-${String(reservationId).padStart(4, '0')}-${year}${month}${day}`;
        
        setFormData(prev => ({
          ...prev,
          invoiceNumber: autoNumber,
          notes: `Factura generada automáticamente desde reserva #${reservationId}`
        }));
      } else {
        setResult({
          success: false,
          message: dataResult.error || 'Error al cargar datos de la reserva'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error inesperado al cargar datos'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    setCreating(true);
    setResult(null);

    try {
      const result = await createInvoiceFromReservation({
        reservationId,
        invoiceNumber: formData.invoiceNumber,
        notes: formData.notes,
        paymentTerms: formData.paymentTerms
      });

      if (result.success) {
        setResult({
          success: true,
          message: `Factura ${result.data.invoice.number} creada exitosamente. Se transfirieron ${result.data.transferred_payments} pagos.`
        });

        // Redirigir automáticamente a la factura recién creada
        setTimeout(() => {
          setIsOpen(false);
          router.push(`/dashboard/sales/invoices/${result.data.invoice.id}`);
          onSuccess?.();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: result.error || 'Error al crear la factura'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error inesperado al crear la factura'
      });
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      'finalizada': { label: 'Finalizada', color: 'bg-green-100 text-green-800' },
      'facturada': { label: 'Facturada', color: 'bg-blue-100 text-blue-800' },
      'en_curso': { label: 'En Curso', color: 'bg-orange-100 text-orange-800' },
      'confirmada': { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
      'prereserva': { label: 'Prereserva', color: 'bg-yellow-100 text-yellow-800' }
    };
    const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button 
              onClick={handleOpen}
              disabled={!canCreateInvoice}
              variant={canCreateInvoice ? "default" : "secondary"}
              className={canCreateInvoice ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <FileText className="w-4 h-4 mr-2" />
              Crear Factura
            </Button>
          )}
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Crear Factura desde Reserva
                </DialogTitle>
                <DialogDescription>
                  Generar factura automáticamente desde la reserva finalizada
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={creating}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Cargando datos de la reserva...</span>
            </div>
          )}

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {reservationData && !loading && (
            <div className="space-y-6">
              {/* Información de la Reserva */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información de la Reserva
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Huésped</Label>
                      <p className="font-semibold">{reservationData.reservation.guest_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{reservationData.reservation.guest_email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Check-in</Label>
                      <p className="text-sm">{formatDate(reservationData.reservation.check_in)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Check-out</Label>
                      <p className="text-sm">{formatDate(reservationData.reservation.check_out)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estado</Label>
                      <div className="mt-1">{getStatusBadge(reservationData.reservation.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Total</Label>
                      <p className="font-semibold text-green-600">{formatCurrency(reservationData.reservation.total_amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Cliente para Facturación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                      <p className="font-semibold">
                        {reservationData.client.nombrePrincipal} {reservationData.client.apellido}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{reservationData.client.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                      <p className="text-sm">{reservationData.client.telefono}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">RUT</Label>
                      <p className="text-sm">{reservationData.reservation.billing_rut}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Productos */}
              {reservationData.products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Productos Adicionales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reservationData.products.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{product.quantity} x {formatCurrency(product.unit_price)}</p>
                            <p className="font-semibold">{formatCurrency(product.total_price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pagos */}
              {reservationData.payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Pagos Realizados ({reservationData.payments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reservationData.payments.map((payment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium">{payment.payment_method}</p>
                            <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                            {payment.reference_number && (
                              <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Configuración de la Factura */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Configuración de la Factura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Número de Factura</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="Número automático generado"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
                    <Input
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      placeholder="30 días"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas para la factura..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resumen */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <DollarSign className="w-5 h-5" />
                    Resumen de la Factura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Reserva</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(reservationData.reservation.total_amount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pagos Realizados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(reservationData.payments.reduce((sum: number, p: any) => sum + p.amount, 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Productos Adicionales</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {reservationData.products.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={creating}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateInvoice}
                  disabled={creating}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando Factura...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Crear Factura
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 