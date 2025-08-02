'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { createCashSessionWithVerification, getLastClosedSessionBalance } from '@/actions/configuration/petty-cash-actions';

interface CashOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId: number) => void;
  userId?: string; // UUID string - opcional porque puede venir de currentUser
  cashRegisterId?: number;
  cashRegisterName?: string;
  currentUser?: any; // Para casos donde se pasa el usuario completo
}

interface PreviousBalanceData {
  hasHistory: boolean;
  expectedAmount?: number;
  lastClosureDate?: string;
  lastSessionDate?: string;
  lastSessionNumber?: string;
  lastUser?: string;
  difference?: number;
  source?: 'closure' | 'session';
  message: string;
  error?: string;
}

export default function CashOpeningModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  cashRegisterId = 1,
  cashRegisterName = "Caja Principal",
  currentUser
}: CashOpeningModalProps) {
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<PreviousBalanceData | null>(null);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar saldo anterior al abrir el modal
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 Modal abierto - cargando saldo anterior');
      loadPreviousBalance();
    } else {
      console.log('❌ Modal cerrado');
    }
  }, [isOpen, cashRegisterId]);

  const loadPreviousBalance = async () => {
    console.log('⏳ Iniciando carga de saldo anterior...');
    setIsLoadingBalance(true);
    try {
      const balance = await getLastClosedSessionBalance(cashRegisterId);
      console.log('✅ Saldo anterior cargado:', balance);
      setPreviousBalance(balance);
    } catch (error) {
      console.error('❌ Error loading previous balance:', error);
      setPreviousBalance({
        hasHistory: false,
        message: 'Error al cargar el saldo anterior',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      console.log('🏁 Finalizando carga de saldo anterior');
      setIsLoadingBalance(false);
    }
  };

  const calculateDifference = () => {
    if (!previousBalance?.hasHistory || !previousBalance.expectedAmount || !declaredAmount) {
      return 0;
    }
    return parseFloat(declaredAmount) - previousBalance.expectedAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validación de monto
    if (!declaredAmount || isNaN(Number(declaredAmount)) || Number(declaredAmount) <= 0) {
      setError('El monto declarado debe ser mayor a 0');
      return;
    }

    // Determinar userId del usuario actual
    const finalUserId = userId || currentUser?.id;
    if (!finalUserId) {
      alert('No se pudo identificar al usuario actual');
      return;
    }

    console.log('🚀 Iniciando creación de sesión con datos:', {
      userId: finalUserId,
      cashRegisterId,
      declaredAmount,
      notes,
      expectedAmount: previousBalance?.expectedAmount
    });

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', finalUserId);
      formData.append('cashRegisterId', cashRegisterId.toString());
      formData.append('declaredAmount', declaredAmount);
      formData.append('notes', notes);
      
      if (previousBalance?.hasHistory && previousBalance.expectedAmount) {
        formData.append('expectedAmount', previousBalance.expectedAmount.toString());
      }

      console.log('📤 Enviando petición de creación de sesión...');
      const result = await createCashSessionWithVerification(formData);
      console.log('📥 Resultado de creación de sesión:', result);

      if (result.success) {
        onSuccess(result.sessionId!);
        // Resetear formulario
        setDeclaredAmount('');
        setNotes('');
        setShowDiscrepancy(false);
        onClose();
      } else {
        alert(result.error || 'Error al crear la sesión de caja');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error inesperado al crear la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const difference = calculateDifference();
  const hasDifference = Math.abs(difference) > 0;

  console.log('🎨 Renderizando modal:', { isOpen, isLoading, isLoadingBalance, previousBalance });

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('📝 Dialog onOpenChange:', open);
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Apertura de Caja - {cashRegisterName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del saldo anterior */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Saldo anterior
            </h3>
            
            {isLoadingBalance ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando información anterior...
              </div>
            ) : previousBalance ? (
              <div className="space-y-2">
                {previousBalance.hasHistory ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Último cierre:</span>
                      <span className="font-medium">{previousBalance.lastSessionNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Usuario:</span>
                      <span className="font-medium">{previousBalance.lastUser}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Saldo esperado:</span>
                      <span className="font-bold text-lg text-green-600">
                        ${previousBalance.expectedAmount?.toLocaleString()}
                      </span>
                    </div>
                    {previousBalance.difference && Math.abs(previousBalance.difference) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Diferencia anterior:</span>
                        <Badge variant={previousBalance.difference >= 0 ? "default" : "destructive"}>
                          {previousBalance.difference >= 0 ? '+' : ''}${previousBalance.difference.toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{previousBalance.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : null}
          </div>

          {/* Monto declarado */}
          <div className="space-y-2">
            <Label htmlFor="declaredAmount" className="text-base font-semibold">
              ¿Con cuánto dinero inicia la caja? *
            </Label>
            <Input
              id="declaredAmount"
              type="number"
              step="0.01"
              min="0"
              value={declaredAmount === '0' ? '' : declaredAmount}
              onChange={(e) => {
                const clean = e.target.value.replace(/^0+(?=\d)/, '');
                setDeclaredAmount(clean);
              }}
              placeholder="Ej: 50000"
              className="text-lg"
              required
            />
            <p className="text-sm text-gray-600">
              Ingrese el monto físico real con el que cuenta en la caja
            </p>
          </div>

          {/* Mostrar diferencia si existe */}
          {previousBalance?.hasHistory && declaredAmount && (
            <div className={`p-4 rounded-lg border-2 ${
              hasDifference 
                ? difference >= 0 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {hasDifference ? (
                  <AlertTriangle className={`h-5 w-5 ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-semibold">
                  {hasDifference ? 'Diferencia Detectada' : 'Sin Diferencias'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Esperado:</span>
                  <div className="font-bold">${previousBalance.expectedAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Declarado:</span>
                  <div className="font-bold">${parseFloat(declaredAmount).toLocaleString()}</div>
                </div>
              </div>
              
              {hasDifference && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-600">Diferencia:</span>
                  <div className={`font-bold text-lg ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}${difference.toLocaleString()}
                    <span className="text-sm font-normal">
                      ({difference >= 0 ? 'Sobrante' : 'Faltante'})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre la apertura de caja..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !declaredAmount}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando sesión...
                </>
              ) : (
                'Abrir Caja'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 