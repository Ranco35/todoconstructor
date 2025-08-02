'use client';

import React, { useState, useEffect } from 'react';
import { resetCashSessions, getCashSessionStatus } from '@/actions/configuration/reset-cash-actions';

interface ResetCashSessionPageProps {
  currentUser: any;
}

export default function ResetCashSessionPage({ currentUser }: ResetCashSessionPageProps) {
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [resetCompleted, setResetCompleted] = useState(false);

  useEffect(() => {
    loadSessionStatus();
  }, []);

  const loadSessionStatus = async () => {
    try {
      const status = await getCashSessionStatus();
      setSessionStatus(status);
    } catch (error) {
      console.error('Error loading session status:', error);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres cerrar todas las sesiones activas?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await resetCashSessions();
      if (result.success) {
        alert(`✅ Reset completado exitosamente!\n\n${result.message}`);
        setResetCompleted(true);
        await loadSessionStatus(); // Recargar estado
      } else {
        alert(`❌ Error durante el reset: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during reset:', error);
      alert('❌ Error inesperado durante el reset');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧹</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Reset del Sistema de Caja Chica</h1>
                <p className="text-red-100">Cerrar sesiones activas y empezar desde cero</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Advertencia Importante</h3>
                  <p className="text-yellow-700 text-sm">
                    Esta acción cerrará todas las sesiones de caja activas. Las sesiones se cerrarán 
                    con el monto inicial como efectivo final. Los datos de gastos y compras se mantendrán 
                    para historial.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado Actual del Sistema</h2>
              
              {sessionStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-600 text-2xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-blue-900">{sessionStatus.activeSessions}</div>
                    <div className="text-sm text-blue-700">Sesiones Activas</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-2xl mb-2">📋</div>
                    <div className="text-2xl font-bold text-green-900">{sessionStatus.totalExpenses}</div>
                    <div className="text-sm text-green-700">Gastos Registrados</div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-purple-600 text-2xl mb-2">🛒</div>
                    <div className="text-2xl font-bold text-purple-900">{sessionStatus.totalPurchases}</div>
                    <div className="text-sm text-purple-700">Compras Registradas</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">Cargando estado del sistema...</p>
                </div>
              )}
            </div>

            {/* Active Sessions Details */}
            {sessionStatus && sessionStatus.activeSessionsDetails && sessionStatus.activeSessionsDetails.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sesiones Activas Detectadas</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Usuario</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Monto Inicial</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Abierta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sessionStatus.activeSessionsDetails.map((session: any) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{session.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{session.userId}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">${session.openingAmount?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(session.openedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

                          {/* Reset Actions */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones de Reset</h2>
                  

                  
                  <div className="space-y-4">
                  {sessionStatus && sessionStatus.activeSessions > 0 ? (
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Procesando Reset...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <span>🧹</span>
                          <span>Cerrar Todas las Sesiones Activas</span>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <div className="text-green-600 text-4xl mb-4">✅</div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Sistema Limpio
                      </h3>
                      <p className="text-green-700">
                        No hay sesiones activas. El sistema está listo para empezar desde cero.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Siguientes Pasos</h3>
                <div className="space-y-2 text-blue-700">
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Ve a la página principal de Caja Chica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Haz clic en "Abrir Nueva Sesión"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Ingresa el monto inicial real de tu caja</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Registra solo transacciones reales</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <a
                    href="/dashboard/pettyCash"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span>🏠</span>
                    <span>Ir a Caja Chica</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 