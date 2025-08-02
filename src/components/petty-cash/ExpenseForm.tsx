'use client';

import React, { useState } from 'react';
import { createPettyCashExpense } from '@/actions/configuration/petty-cash-actions';
import ExpenseCategorySelector from './ExpenseCategorySelector';
import CostCenterSelector from './CostCenterSelector';

interface ExpenseFormProps {
  sessionId: number;
  userId: number;
  userName: string;
  onClose: () => void;
}

export default function ExpenseForm({ sessionId, userId, userName, onClose }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [costCenterId, setCostCenterId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'other'>('cash');
  const [bankReference, setBankReference] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [affectsPhysicalCash, setAffectsPhysicalCash] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    setLoading(true);
    if (!categoryId) {
      setCategoryError('Debes seleccionar una categoría para el gasto.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('sessionId', sessionId.toString());
    formData.append('requestedBy', userId.toString());
    formData.append('description', description);
    formData.append('amount', amount);
    formData.append('transactionType', 'expense');
    formData.append('paymentMethod', paymentMethod);
    formData.append('affectsPhysicalCash', affectsPhysicalCash.toString());
    
    if (categoryId) {
      formData.append('categoryId', categoryId.toString());
    }
    if (costCenterId) {
      formData.append('costCenterId', costCenterId.toString());
    }
    if (bankReference) {
      formData.append('bankReference', bankReference);
    }
    if (bankAccount) {
      formData.append('bankAccount', bankAccount);
    }
    formData.append('notes', notes);

    try {
      const result = await createPettyCashExpense(formData);
      if (result.success) {
        onClose();
        // Optionally show success message
        alert('Gasto registrado y aprobado automáticamente. Sin límites configurados.');
      } else {
        alert(result.error || 'Error al registrar el gasto');
      }
    } catch (error) {
      console.error('Error registering expense:', error);
      alert('Error al registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                💸 Nuevo Gasto de Caja Chica
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Usuario:</strong> {userName} | <strong>Sin límites configurados</strong>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Gasto *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe el gasto realizado..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  max={999999999}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría del Gasto *
                </label>
                <ExpenseCategorySelector
                  value={categoryId?.toString()}
                  onChange={(value) => setCategoryId(value ? parseInt(value) : undefined)}
                  placeholder="Seleccionar categoría para el gasto"
                />
                {categoryError && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{categoryError}</p>
                )}
                {!categoryId && !categoryError && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selecciona una categoría para clasificar este gasto correctamente
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centro de Costo *
                </label>
                <CostCenterSelector
                  value={costCenterId}
                  onChange={setCostCenterId}
                  required={true}
                  placeholder="Seleccionar centro de costo para el gasto"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer' | 'card' | 'other')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Afecta Caja Física
                </label>
                <select
                  value={affectsPhysicalCash.toString()}
                  onChange={(e) => setAffectsPhysicalCash(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="true">Sí - Descuenta de caja</option>
                  <option value="false">No - Solo registro</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'transfer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia Bancaria
                  </label>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de transferencia"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta Bancaria
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Cuenta origen"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Comentarios adicionales (opcional)"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Este gasto será registrado sin límites de monto.
                  {affectsPhysicalCash ? ' Se descontará del efectivo de la caja una vez procesado.' : ' Solo se registrará como información, sin afectar el saldo de caja.'}
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
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={loading || !description.trim() || !amount || !categoryId || !costCenterId}
              >
                {loading ? 'Registrando...' : '💾 Registrar Gasto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 