'use client';

import React, { useState, useEffect } from 'react';
import { createPettyCashIncome, PettyCashIncomeData } from '@/actions/configuration/petty-cash-income-actions';
import CostCenterSelector from './CostCenterSelector';
import { getOpenCashSessions } from '@/actions/configuration/petty-cash-actions';

interface IncomeFormProps {
  onClose: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  cashRegisterId: number;
  userId: string;
}

export default function IncomeForm({ onClose, onSubmit, isLoading = false, cashRegisterId, userId }: IncomeFormProps) {
  const [formData, setFormData] = useState<PettyCashIncomeData>({
    amount: 0,
    description: '',
    category: 'Reposición',
    paymentMethod: 'Efectivo',
    notes: '',
    bankReference: '',
    bankAccount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSessions, setOpenSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      const sessions = await getOpenCashSessions();
      setOpenSessions(sessions);
      if (sessions.length === 1) setSelectedSessionId(sessions[0].id);
    }
    fetchSessions();
  }, []);

  const selectedSession = openSessions.find(s => s.id === selectedSessionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!selectedSessionId) {
      setError('Debes seleccionar una sesión de caja abierta');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createPettyCashIncome({ ...formData, cashRegisterId, sessionId: selectedSessionId });
      if (result.success) {
        setFormData({
          amount: 0,
          description: '',
          category: 'Reposición',
          paymentMethod: 'Efectivo',
          notes: '',
          bankReference: '',
          bankAccount: ''
        });
        onClose();
        if (onSubmit) onSubmit();
        alert('💰 Ajuste de efectivo registrado exitosamente');
      } else {
        setError(result.message || 'Error al registrar el ajuste');
      }
    } catch (err) {
      setError('Error inesperado al registrar el ajuste');
      console.error('Error submitting income form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Selector de sesión de caja */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar sesión de caja abierta</label>
            <select
              value={selectedSessionId || ''}
              onChange={e => setSelectedSessionId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Selecciona una sesión...</option>
              {openSessions.map(session => (
                <option key={session.id} value={session.id}>
                  #{session.sessionNumber} | Monto inicial: ${session.openingAmount} | {new Date(session.openedAt).toLocaleString()}
                </option>
              ))}
            </select>
            {selectedSession && (
              <div className="mt-2 text-xs text-gray-600">
                <b>Sesión seleccionada:</b> #{selectedSession.sessionNumber} | Caja: {selectedSession.cashRegisterId} | Monto inicial: ${selectedSession.openingAmount} | Abierta: {new Date(selectedSession.openedAt).toLocaleString()}
              </div>
            )}
          </div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                💰 Ajuste de Efectivo - Ingreso a Caja
              </h2>
              <p className="text-gray-600">
                Registra un ajuste de efectivo físico (préstamo, reposición, reembolso)
              </p>
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Ajuste
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Préstamo de María, Reposición desde banco, Reembolso cliente"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del Ajuste
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormData({...formData, amount: Number(clean)});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ajuste
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Reposición">Reposición de Caja</option>
                  <option value="Préstamo">Préstamo Personal</option>
                  <option value="Reembolso">Reembolso de Gastos</option>
                  <option value="Depósito">Depósito Bancario</option>
                  <option value="PagoCliente">Pago de Clientes</option>
                  <option value="Otros">Otros Ajustes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {formData.paymentMethod === 'Transferencia' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia Bancaria
                  </label>
                  <input
                    type="text"
                    value={formData.bankReference}
                    onChange={(e) => setFormData({...formData, bankReference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Número de transferencia"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta Bancaria
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Cuenta origen"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centro de Costo
              </label>
              <CostCenterSelector
                value={formData.costCenterId}
                onChange={(value) => setFormData({...formData, costCenterId: value})}
                placeholder="Seleccionar centro de costo (opcional)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Detalles adicionales sobre el ajuste de efectivo..."
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : '💰 Registrar Ajuste de Efectivo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 