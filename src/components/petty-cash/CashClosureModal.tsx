'use client';

import React, { useState } from 'react';
import { createCashClosure } from '@/actions/configuration/cash-closure-actions';
import { CashClosureSummary } from '@/actions/configuration/cash-closure-actions';

interface CashClosureModalProps {
  sessionId: number;
  closureSummary: CashClosureSummary;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: any;
}

export default function CashClosureModal({ sessionId, closureSummary, onClose, onSuccess, currentUser }: CashClosureModalProps) {
  const [loading, setLoading] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const expectedCash = closureSummary?.expectedCash || 0;
  const difference = actualCash ? parseFloat(actualCash) - expectedCash : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validación de monto
    if (!actualCash || isNaN(Number(actualCash)) || Number(actualCash) <= 0) {
      setError('El monto contado debe ser mayor a 0');
      return;
    }
    
    setLoading(true);

    let message = `🔒 CONFIRMAR CIERRE DE CAJA\n\n`;
    message += `📊 CÁLCULO DETALLADO:\n`;
    message += `🏦 Monto inicial: $${closureSummary.openingAmount.toLocaleString()}\n`;
    message += `💵 Ventas efectivo: +$${closureSummary.salesCash.toLocaleString()}\n`;
    message += `💸 Gastos realizados: -$${closureSummary.totalExpenses.toLocaleString()}\n`;
    message += `🛍️ Compras realizadas: -$${closureSummary.totalPurchases.toLocaleString()}\n`;
    message += `${'='.repeat(35)}\n`;
    message += `🎯 Efectivo esperado: ${expectedCash < 0 ? '-' : ''}$${Math.abs(expectedCash).toLocaleString()}\n`;
    message += `💵 Efectivo contado: $${parseFloat(actualCash).toLocaleString()}\n`;
    message += `📊 Diferencia: ${difference >= 0 ? '+' : ''}$${difference.toLocaleString()}\n\n`;
    if (closureSummary.totalExpenses > 0 || closureSummary.totalPurchases > 0) {
      message += `⚠️ NOTA: Los gastos y compras ($${(closureSummary.totalExpenses + closureSummary.totalPurchases).toLocaleString()}) ya fueron descontados del efectivo esperado.\n\n`;
    }
    message += `✅ El cierre se procesará automáticamente.\n\n`;
    message += `¿Proceder con el cierre?`;

    if (!confirm(message)) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('sessionId', sessionId.toString());
    formData.append('actualCash', actualCash);
    formData.append('notes', notes);

    try {
      const result = await createCashClosure(formData);
      if (result.success) {
        let successMessage = `🎉 CIERRE DE CAJA COMPLETADO\n\n`;
        successMessage += `📊 CÁLCULO FINAL APLICADO:\n`;
        successMessage += `🏦 Empezaste con: $${closureSummary.openingAmount.toLocaleString()}\n`;
        successMessage += `💵 Ventas en efectivo: +$${closureSummary.salesCash.toLocaleString()}\n`;
        successMessage += `💸 Gastos de caja chica: -$${closureSummary.totalExpenses.toLocaleString()}\n`;
        successMessage += `🛍️ Compras de caja chica: -$${closureSummary.totalPurchases.toLocaleString()}\n`;
        successMessage += `${'='.repeat(40)}\n`;
        const finalExpectedCash = result.expectedCash || expectedCash;
        successMessage += `🎯 Efectivo esperado: ${finalExpectedCash < 0 ? '-' : ''}$${Math.abs(finalExpectedCash).toLocaleString()}\n`;
        successMessage += `💵 Efectivo contado: $${actualCash.toLocaleString()}\n`;
        successMessage += `📊 Diferencia: ${(result.difference || 0) >= 0 ? '+' : ''}$${Math.abs(result.difference || 0).toLocaleString()}\n\n`;
        
        if (finalExpectedCash < 0) {
          successMessage += `⚠️ NOTA: Hubo déficit (gastaste más de lo que tenías en caja)\n`;
        }
        
        successMessage += `✅ Sesión cerrada exitosamente por: ${result.userName}\n`;
        successMessage += `📅 Fecha: ${new Date().toLocaleString()}`;
        
        alert(successMessage);
        onSuccess();
      } else {
        const errorMessage = result.error || 'Error al procesar el cierre de caja';
        
        // Detección mejorada de sesión eliminada con recuperación automática
        if (errorMessage.includes('no existe o fue eliminada')) {
          const confirmMessage = `❌ ERROR: ${errorMessage}\n\n` +
            `🔍 PROBLEMA DETECTADO: La sesión de caja fue eliminada por error.\n\n` +
            `💡 SOLUCIÓN AUTOMÁTICA DISPONIBLE:\n` +
            `¿Quieres crear una nueva sesión con el monto que tienes en caja ($${actualCash.toLocaleString()})?\n\n` +
            `✅ SI = Crear nueva sesión automáticamente\n` +
            `❌ NO = Solo recargar la página`;
            
          const shouldCreateNewSession = confirm(confirmMessage);
          
          if (shouldCreateNewSession) {
            // Crear nueva sesión con el monto actual
            try {
              const newSessionFormData = new FormData();
              // Usar el UUID correcto del usuario actual
              const userUUID = currentUser?.id || 'd5a89886-4457-4373-8014-d3e0c4426e35';
              console.log('🔧 Creando nueva sesión con userUUID:', userUUID);
              
              newSessionFormData.append('userId', userUUID); // UUID del usuario actual
              newSessionFormData.append('cashRegisterId', '1'); // Caja por defecto  
              newSessionFormData.append('declaredAmount', actualCash.toString());
              newSessionFormData.append('notes', `Sesión creada automáticamente tras recuperación de sesión eliminada. Monto inicial basado en cierre anterior: $${actualCash.toLocaleString()}`);
              
              // Importar y usar la función para crear sesión
              const { createCashSessionWithVerification } = await import('@/actions/configuration/petty-cash-actions');
              const createResult = await createCashSessionWithVerification(newSessionFormData);
              
              if (createResult.success) {
                alert(`🎉 RECUPERACIÓN EXITOSA!\n\n` +
                      `✅ Nueva sesión creada: ID ${createResult.sessionId}\n` +
                      `💰 Monto inicial: $${actualCash.toLocaleString()}\n\n` +
                      `La página se recargará para mostrar la nueva sesión.`);
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              } else {
                alert(`❌ Error creando nueva sesión: ${createResult.error}\n\n🔄 La página se recargará para limpiar el estado.`);
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            } catch (recoveryError) {
              console.error('Error en recuperación automática:', recoveryError);
              alert(`❌ Error en recuperación automática\n\n🔄 La página se recargará para limpiar el estado.`);
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          } else {
            // Solo recargar la página
            alert(`🔄 La página se recargará para limpiar el estado.`);
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } else {
          // Error normal, no de sesión eliminada
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error en cierre de caja:', error);
      alert('Error inesperado al procesar el cierre de caja');
    } finally {
      setLoading(false);
    }
  };

  const getDifferenceStyle = () => {
    if (difference === 0) {
      return 'bg-blue-50 border-blue-200 text-blue-700';
    }
    
    // Caso especial: cuando el efectivo esperado es negativo
    if (expectedCash < 0) {
      // Siempre es problemático cuando hay déficit
      return 'bg-red-50 border-red-200 text-red-700';
    } else {
      // Caso normal: efectivo esperado es positivo
      if (difference > 0) {
        return 'bg-green-50 border-green-200 text-green-700';
      } else {
        return 'bg-red-50 border-red-200 text-red-700';
      }
    }
  };

  const getDifferenceIcon = () => {
    if (difference === 0) return '✅';
    
    // Caso especial: cuando el efectivo esperado es negativo
    if (expectedCash < 0) {
      // Siempre es problemático cuando hay déficit
      return '⚠️';
    } else {
      // Caso normal: efectivo esperado es positivo
    if (difference > 0) return '💰';
      return '⚠️';
    }
  };

  const getDifferenceText = () => {
    if (difference === 0) return '¡Perfecto! Caja cuadrada';
    
    // Caso especial: cuando el efectivo esperado es negativo
    if (expectedCash < 0) {
      // Si esperabas -$100 y tienes $0, falta dinero para llegar al balance correcto
      if (difference > 0) return `Faltante: $${Math.abs(difference).toLocaleString()}`;
      if (difference < 0) return `Exceso de faltante: $${Math.abs(difference).toLocaleString()}`;
    } else {
      // Caso normal: efectivo esperado es positivo
    if (difference > 0) return `Sobrante: $${Math.abs(difference).toLocaleString()}`;
    return `Faltante: $${Math.abs(difference).toLocaleString()}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              🔒 Cierre de Caja - Sesión {closureSummary.sessionNumber}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Summary Card - Desglose SUPER CLARO de cálculo */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
            <h4 className="font-bold text-blue-900 mb-4 text-center">
              🧮 CÁLCULO DEL EFECTIVO ESPERADO
            </h4>
            
            {/* Fórmula visual */}
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-300">
              <div className="text-center text-sm font-mono text-gray-700 mb-3">
                Efectivo Esperado = Monto Inicial + Ventas + Ingresos - Gastos - Compras
              </div>
              
              <div className="space-y-3">
                {/* Monto inicial */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="text-2xl">🏦</span>
                    <span>Monto inicial (dinero con que abriste):</span>
                  </span>
                  <div className="text-right">
                    <div className="text-green-700 font-bold text-lg">+${closureSummary.openingAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Se suma</div>
                  </div>
                </div>
                
                {/* Ventas en efectivo */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="text-2xl">💵</span>
                    <span>Ventas cobradas en efectivo:</span>
                  </span>
                  <div className="text-right">
                    <div className="text-green-700 font-bold text-lg">+${closureSummary.salesCash.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Se suma al dinero</div>
                  </div>
                </div>

                {/* INGRESOS - Nueva línea destacada */}
                <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-lg px-3 border-2 border-emerald-200">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="text-2xl">💰</span>
                    <span className="text-emerald-800">Ingresos registrados (SE SUMAN):</span>
                  </span>
                  <div className="text-right">
                    <div className="text-emerald-700 font-bold text-xl">+${closureSummary.totalIncomes.toLocaleString()}</div>
                    <div className="text-xs text-emerald-600 font-semibold">💰 DINERO QUE ENTRÓ A CAJA</div>
                  </div>
                </div>
                
                {/* GASTOS - Súper destacado */}
                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 border-2 border-red-200">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="text-2xl">💸</span>
                    <span className="text-red-800">Gastos realizados (SE DESCUENTAN):</span>
                  </span>
                  <div className="text-right">
                    <div className="text-red-700 font-bold text-xl">-${closureSummary.totalExpenses.toLocaleString()}</div>
                    <div className="text-xs text-red-600 font-semibold">⚠️ DINERO QUE SALIÓ DE CAJA</div>
                  </div>
                </div>
                
                {/* COMPRAS - También destacado */}
                <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-3 border-2 border-orange-200">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="text-2xl">🛍️</span>
                    <span className="text-orange-800">Compras realizadas (SE DESCUENTAN):</span>
                  </span>
                  <div className="text-right">
                    <div className="text-orange-700 font-bold text-xl">-${closureSummary.totalPurchases.toLocaleString()}</div>
                    <div className="text-xs text-orange-600 font-semibold">⚠️ DINERO QUE SALIÓ DE CAJA</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resultado final - MUY destacado */}
            <div className={`rounded-xl p-4 text-white text-center ${
              expectedCash < 0 
                ? 'bg-gradient-to-r from-red-600 to-red-700' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}>
              <div className="text-sm font-medium mb-1">🎯 RESULTADO DEL CÁLCULO:</div>
              <div className="text-3xl font-bold mb-1">
                {expectedCash < 0 ? '-' : ''}${Math.abs(expectedCash).toLocaleString()}
              </div>
              <div className="text-sm opacity-90">
                {expectedCash < 0 
                  ? '⚠️ DÉFICIT: Gastaste más de lo que tenías en caja'
                  : 'Este es el dinero que DEBE quedar en caja'
                }
              </div>
            </div>
            
            {/* Explicación adicional */}
            <div className={`mt-4 border-l-4 p-3 rounded-r-lg ${
              expectedCash < 0 
                ? 'bg-red-50 border-red-400' 
                : 'bg-yellow-50 border-yellow-400'
            }`}>
              <div className="flex items-start gap-2">
                <span className={`text-lg ${expectedCash < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {expectedCash < 0 ? '⚠️' : '💡'}
                </span>
                <div className={`text-sm ${expectedCash < 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                  {expectedCash < 0 ? (
                    <>
                      <strong>⚠️ SITUACIÓN ESPECIAL - DÉFICIT:</strong> Los gastos que realizaste durante tu turno 
                      (${(closureSummary.totalExpenses + closureSummary.totalPurchases).toLocaleString()}) fueron mayores que el dinero inicial 
                      ($${closureSummary.openingAmount.toLocaleString()}). Esto significa que técnicamente la caja está en déficit y deberías tener un saldo negativo.
                    </>
                  ) : (
                    <>
                      <strong>Explicación:</strong> Cada gasto o compra que hiciste durante tu turno 
                      reduce el dinero que debe quedar en la caja. Por eso se restan del monto inicial.
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Información adicional sobre ventas con tarjeta */}
            {closureSummary.salesCard > 0 && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span>💳</span>
                    <span>Ventas con tarjeta (NO afecta el efectivo en caja):</span>
                  </span>
                  <span className="font-medium text-gray-800">${closureSummary.salesCard.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💵 Contar Efectivo en Caja *
              </label>
              <input
                type="number"
                value={actualCash === '0' ? '' : actualCash}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setActualCash(clean);
                }}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contar billetes y monedas"
                required
              />
            </div>

            {/* Difference Alert - SUPER CLARO */}
            {actualCash && (
              <div className={`p-4 rounded-lg border-2 ${getDifferenceStyle()}`}>
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <span className="text-xl">{getDifferenceIcon()}</span>
                  <span className="text-lg">{getDifferenceText()}</span>
                </div>
                
                {/* Explicación detallada de la diferencia */}
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>💵 Contaste en caja:</span>
                    <strong>${parseFloat(actualCash).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>🎯 Deberías tener (ya con gastos descontados):</span>
                    <strong>
                      {expectedCash < 0 ? '-' : ''}${Math.abs(expectedCash).toLocaleString()}
                    </strong>
                  </div>
                  <div className="border-t border-current opacity-50 my-1"></div>
                  <div className="flex justify-between font-bold">
                    <span>📊 Diferencia:</span>
                    <span>{difference >= 0 ? '+' : ''}${Math.abs(difference).toLocaleString()}</span>
                  </div>
                </div>
                
                {difference !== 0 && (
                  <div className="mt-3 p-2 bg-black bg-opacity-10 rounded text-sm">
                    {expectedCash < 0 ? (
                      // Caso déficit: siempre es problemático
                      difference > 0 
                        ? '⚠️ Falta dinero para cubrir el déficit de gastos'
                        : '⚠️ El déficit es aún mayor de lo calculado'
                    ) : (
                      // Caso normal: efectivo esperado positivo
                      difference > 0 
                        ? '💰 Hay más dinero del esperado - es un sobrante'
                        : '⚠️ Falta dinero según el cálculo - revisar transacciones'
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Observaciones
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Comentarios sobre el cierre..."
              />
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div className="text-blue-800 text-sm">
                  <strong>Información:</strong> Este cierre finalizará tu turno de caja. 
                  Asegúrate de haber contado correctamente el efectivo antes de proceder.
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={loading || !actualCash}
              >
                {loading ? 'Procesando...' : '🔒 Cerrar Caja'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 