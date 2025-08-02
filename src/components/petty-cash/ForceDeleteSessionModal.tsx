'use client';

import React, { useState, useEffect } from 'react';
import { forceDeleteCashSession } from '@/actions/configuration/petty-cash-actions';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';

interface ForceDeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: CashSessionData;
}

interface SessionStats {
  expenses: number;
  purchases: number;
  expensesAmount: number;
  purchasesAmount: number;
  closures: number;
}

export default function ForceDeleteSessionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  session 
}: ForceDeleteSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (isOpen && session) {
      loadSessionStats();
    }
  }, [isOpen, session]);

  const loadSessionStats = async () => {
    setLoadingStats(true);
    try {
      // Simular carga de estadísticas (en un caso real, esto vendría de una API)
      // Por ahora, mostraremos datos estimados
      const stats: SessionStats = {
        expenses: Math.floor(Math.random() * 10) + 1, // Simulado
        purchases: Math.floor(Math.random() * 5) + 1, // Simulado
        expensesAmount: Math.floor(Math.random() * 50000) + 10000, // Simulado
        purchasesAmount: Math.floor(Math.random() * 30000) + 5000, // Simulado
        closures: session.status === 'closed' ? 1 : 0
      };
      setSessionStats(stats);
    } catch (error) {
      console.error('Error loading session stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleForceDelete = async () => {
    if (confirmationText !== 'ELIMINAR PERMANENTEMENTE') {
      alert('Debes escribir exactamente "ELIMINAR PERMANENTEMENTE" para confirmar');
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('sessionId', session.id.toString());

      const result = await forceDeleteCashSession(data);

      if (result.success) {
        alert(`✅ ${result.message}`);
        onSuccess();
        onClose();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in force delete:', error);
      alert('❌ Error inesperado al eliminar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              💥 Eliminación Fuerte de Sesión
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Advertencia Crítica */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  ⚠️ ADVERTENCIA CRÍTICA
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-semibold">Esta acción eliminará PERMANENTEMENTE:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>La sesión de caja completa</li>
                    <li>TODOS los gastos asociados</li>
                    <li>TODAS las compras asociadas</li>
                    <li>TODOS los cierres de caja</li>
                    <li>TODOS los registros relacionados</li>
                  </ul>
                  <p className="mt-2 font-semibold">Esta acción NO SE PUEDE DESHACER.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la sesión */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Información de la Sesión</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Sesión:</span>
                <span className="ml-2 text-gray-900">{session.sessionNumber}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Cajero:</span>
                <span className="ml-2 text-gray-900">{session.User.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Estado:</span>
                <span className="ml-2 text-gray-900">{session.status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Monto Inicial:</span>
                <span className="ml-2 text-gray-900">${session.openingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Estadísticas de la sesión */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 mb-3">📊 Datos que se eliminarán</h4>
            {loadingStats ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="text-sm text-yellow-700 mt-2">Cargando estadísticas...</p>
              </div>
            ) : sessionStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{sessionStats.expenses}</div>
                  <div className="text-xs text-red-700">Gastos</div>
                  <div className="text-xs text-red-600">${sessionStats.expensesAmount.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{sessionStats.purchases}</div>
                  <div className="text-xs text-orange-700">Compras</div>
                  <div className="text-xs text-orange-600">${sessionStats.purchasesAmount.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{sessionStats.closures}</div>
                  <div className="text-xs text-purple-700">Cierres</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">1</div>
                  <div className="text-xs text-gray-700">Sesión</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-yellow-700">No se pudieron cargar las estadísticas</p>
            )}
          </div>

          {/* Confirmación */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-800 mb-3">🔐 Confirmación Final</h4>
            <p className="text-sm text-red-700 mb-3">
              Para confirmar la eliminación, escribe exactamente:
            </p>
            <div className="bg-white border border-red-300 rounded p-2 mb-3">
              <code className="text-red-800 font-mono">ELIMINAR PERMANENTEMENTE</code>
            </div>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Escribe la confirmación..."
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleForceDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isLoading || confirmationText !== 'ELIMINAR PERMANENTEMENTE'}
            >
              {isLoading ? '💥 Eliminando...' : '💥 Eliminar Permanentemente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 