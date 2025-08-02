'use client';

import React, { useState } from 'react';
import { deleteCashSession } from '@/actions/configuration/petty-cash-actions';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';

interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: CashSessionData;
}

export default function DeleteSessionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  session 
}: DeleteSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('sessionId', session.id.toString());

      const result = await deleteCashSession(data);

      if (result.success) {
        onSuccess();
        onClose();
      }
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              🗑️ Eliminar Sesión
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

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    ¿Estás seguro de que quieres eliminar esta sesión?
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Esta acción no se puede deshacer.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la sesión */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Sesión:</strong> {session.sessionNumber}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Cajero:</strong> {session.User.name}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Estado:</strong> {session.status}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Monto Inicial:</strong> ${session.openingAmount.toLocaleString()}
              </div>
            </div>

            {/* Restricciones */}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Restricciones
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>No se pueden eliminar sesiones cerradas</li>
                      <li>No se pueden eliminar sesiones con transacciones</li>
                      <li>No se pueden eliminar sesiones con cierre asociado</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
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
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 