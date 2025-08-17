'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Importaciones separadas para debugging
import { 
  diagnoseMultipleRoomCheckout, 
  fixMultipleRoomForCheckout, 
  forceMultipleRoomCheckout 
} from '@/actions/reservations/fix-multiple-room-checkout';

import {
  getPrincipalIdFromModular,
  checkOutFromModularId,
  batchCheckoutModularIds
} from '@/actions/reservations/fix-modular-checkout-ids';

import { 
  fixReservationState, 
  getReservationDetailsFromModular 
} from '@/actions/reservations/fix-reservation-state';

// Cache buster: 2025-01-15-17:30
export default function DebugReservasMultiples() {
  const [reservationId, setReservationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isMounted, setIsMounted] = useState(false);

  // Prevenir hidratación incorrecta
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Función para diagnóstico
  const handleDiagnose = async () => {
    if (!reservationId.trim()) {
      showMessage('Por favor ingresa un ID de reserva', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await diagnoseMultipleRoomCheckout(parseInt(reservationId));
      setDiagnosis(result);
      
      if (result.success) {
        showMessage('Diagnóstico completado', 'success');
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Error en diagnóstico', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener ID principal
  const handleGetPrincipalId = async () => {
    if (!reservationId.trim()) {
      showMessage('Ingresa un ID modular', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await getPrincipalIdFromModular(parseInt(reservationId));
      if (result.success) {
        showMessage(`${result.message} - Estado: ${result.status}`, 'info');
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Error obteniendo ID principal', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para check-out individual
  const handleModularCheckout = async (modularId: number) => {
    if (!confirm(`¿Realizar check-out desde ID modular ${modularId}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkOutFromModularId(modularId);
      showMessage(result.message, result.success ? 'success' : 'error');
    } catch (error) {
      showMessage('Error en check-out modular', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para check-out batch (la que estaba causando problemas)
  const handleBatchCheckout = async () => {
    if (!confirm('¿Realizar check-out automático para Ximena (132) y Alejandra (133)?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await batchCheckoutModularIds([132, 133]);
      showMessage(result.summary, result.success ? 'success' : 'error');
      
      // Mostrar detalles en consola
      result.results.forEach((r) => {
        console.log(`${r.guestName}: ${r.success ? 'Éxito' : 'Error'} - ${r.message}`);
      });
    } catch (error) {
      showMessage('Error en check-out batch', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading inicial durante hidratación
  if (!isMounted) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-pulse">🔄 Cargando herramientas de debug...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛠️ Debug: Reservas Múltiples - Check-out
        </h1>
        <p className="text-gray-600">
          Herramienta para diagnosticar y corregir problemas de check-out en reservas de múltiples habitaciones
        </p>
      </div>

      {/* Problema Identificado */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">🚨 PROBLEMA IDENTIFICADO</CardTitle>
          <CardDescription>
            Los IDs 132 y 133 son IDs modulares (habitaciones), NO principales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-sm text-red-800">
            <strong>Lo que pasa:</strong><br/>
            • Calendario muestra ID modular 132 (Ximena) y 133 (Alejandra)<br/>
            • Check-out intenta usar estos IDs modulares<br/>
            • Necesita los IDs principales de la tabla reservations
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setReservationId('132')}
            >
              🔍 ID 132 (Ximena)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setReservationId('133')}
            >
              🔍 ID 133 (Alejandra)
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBatchCheckout}
              disabled={!isMounted || isLoading}
            >
              {!isMounted ? '🚀 Check-out Ambas (Fixed)' : (isLoading ? 'Procesando...' : '🚀 Check-out Ambas (Fixed)')}
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={async () => {
                if (confirm('¿Cambiar estado de Ximena (ID:132) a EN_CURSO para habilitar check-out?')) {
                  setIsLoading(true);
                  try {
                    const result = await fixReservationState(132, 'en_curso');
                    showMessage(result.message, result.success ? 'success' : 'error');
                    
                    if (result.success) {
                      showMessage('🎉 LISTO! Recarga la página de reservas y ya debería aparecer el botón de check-out', 'success');
                    }
                  } catch (error) {
                    showMessage('Error al cambiar estado', 'error');
                    console.error(error);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={!isMounted || isLoading}
            >
              🔧 Habilitar Check-out (ID 132)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Herramientas de Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Herramientas de Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="ID Modular (ej: 132, 133)"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleDiagnose}
              disabled={!isMounted || isLoading}
              variant="outline"
            >
              Diagnosticar
            </Button>
            <Button 
              onClick={handleGetPrincipalId}
              disabled={!isMounted || isLoading}
              variant="secondary"
            >
              Obtener ID Principal
            </Button>
            <Button 
              onClick={() => handleModularCheckout(parseInt(reservationId))}
              disabled={!isMounted || isLoading || !reservationId.trim()}
              variant="destructive"
            >
              Check-out Directo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mensajes */}
      {isMounted && message && (
        <Alert className={
          messageType === 'success' ? 'border-green-200 bg-green-50' :
          messageType === 'error' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }>
          <AlertDescription className={
            messageType === 'success' ? 'text-green-800' :
            messageType === 'error' ? 'text-red-800' :
            'text-blue-800'
          }>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Resultados del Diagnóstico */}
      {isMounted && diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Resultado del Diagnóstico
              {diagnosis.guestName && (
                <Badge variant="outline">{diagnosis.guestName}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600">Estado Actual</div>
                <div className="font-semibold">
                  {diagnosis.currentStatus || 'N/A'}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600">¿Puede Check-out?</div>
                <div className="font-semibold">
                  {diagnosis.canCheckout ? (
                    <span className="text-green-600">✅ Sí</span>
                  ) : (
                    <span className="text-red-600">❌ No</span>
                  )}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600">ID Principal</div>
                <div className="font-semibold">
                  {diagnosis.reservationId || 'N/A'}
                </div>
              </div>
            </div>

            {diagnosis.issues && diagnosis.issues.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">⚠️ Problemas Detectados:</h4>
                <div className="space-y-1">
                  {diagnosis.issues.map((issue: string, index: number) => (
                    <div 
                      key={index} 
                      className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">📖 Cómo Usar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p><strong>Solución Rápida:</strong> Haz clic en "🚀 Check-out Ambas" para resolver automáticamente</p>
          <p><strong>Diagnóstico:</strong> Ingresa ID y haz clic en "Diagnosticar" para más detalles</p>
          <p><strong>Individual:</strong> Usa "Check-out Directo" para casos específicos</p>
        </CardContent>
      </Card>
    </div>
  );
}