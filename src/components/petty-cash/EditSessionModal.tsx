'use client';

import React, { useState } from 'react';
import { updateCashSession } from '@/actions/configuration/petty-cash-actions';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: CashSessionData;
}

export default function EditSessionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  session 
}: EditSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    openingAmount: session.openingAmount.toString(),
    notes: session.notes || '',
    status: session.status,
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validación de monto
    if (!formData.openingAmount || isNaN(Number(formData.openingAmount)) || Number(formData.openingAmount) <= 0) {
      setError('El monto inicial debe ser mayor a 0');
      return;
    }
    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('sessionId', session.id.toString());
      data.append('openingAmount', formData.openingAmount);
      data.append('notes', formData.notes);
      data.append('status', formData.status);

      const result = await updateCashSession(data);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        // Handle error
      }
    } catch {
      // Handle unexpected error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const clean = value.replace(/^0+(?=\d)/, '');
    setFormData(prev => ({
      ...prev,
      [name]: clean,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              ✏️ Editar Sesión
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

          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información de la sesión */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Sesión:</strong> {session.sessionNumber}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Cajero:</strong> {session.User.name}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Caja:</strong> {session.CashRegister.name}
              </div>
            </div>

            {/* Monto inicial */}
            <div>
              <label htmlFor="openingAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Monto Inicial ($)
              </label>
              <input
                type="number"
                id="openingAmount"
                name="openingAmount"
                value={formData.openingAmount === '0' ? '' : formData.openingAmount}
                onChange={e => {
                  const { name, value } = e.target;
                  const clean = value.replace(/^0+(?=\d)/, '');
                  setFormData(prev => ({
                    ...prev,
                    [name]: clean,
                  }));
                }}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="OPEN">Abierta</option>
                <option value="SUSPENDED">Suspendida</option>
                {session.status === 'CLOSED' && (
                  <option value="CLOSED">Cerrada</option>
                )}
              </select>
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales sobre la sesión..."
              />
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 