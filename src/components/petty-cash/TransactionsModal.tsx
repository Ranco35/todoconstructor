'use client';

import React, { useState } from 'react';
import { PettyCashExpenseData, PettyCashPurchaseData, deletePettyCashExpense, deletePettyCashPurchase } from '@/actions/configuration/petty-cash-actions';
import { PettyCashIncomeData } from '@/actions/configuration/petty-cash-income-actions';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: PettyCashExpenseData[];
  purchases: PettyCashPurchaseData[];
  incomes: PettyCashIncomeData[];
  currentUser?: {
    id: string;
    role: string;
    name: string;
  };
  currentSession?: {
    id: number;
    openingAmount: number;
  };
  onTransactionDeleted?: () => void;
}

interface TransactionItem {
  id: string;
  type: 'expense' | 'purchase' | 'income';
  amount: number;
  description: string;
  category?: string;
  receiptNumber?: string;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  paymentMethod?: string;
  createdAt: string;
  runningBalance?: number;
}

export default function TransactionsModal({ 
  isOpen, 
  onClose, 
  expenses, 
  purchases,
  incomes,
  currentUser,
  currentSession,
  onTransactionDeleted
}: TransactionsModalProps) {
  const [deletingTransaction, setDeletingTransaction] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<TransactionItem | null>(null);

  if (!isOpen) return null;

  // Verificar si el usuario es administrador
  const isAdmin = currentUser && 
    (currentUser.role === 'SUPER_USER' || currentUser.role === 'ADMINISTRADOR');

  // Combinar gastos, compras e ingresos en una sola lista
  const allTransactions: TransactionItem[] = [
    ...expenses.map(expense => ({
      id: expense.id,
      type: 'expense' as const,
      amount: expense.amount || 0,
      description: expense.description || '',
      category: expense.Category?.name,
      receiptNumber: expense.receiptNumber,
      createdAt: expense.createdAt || expense.requestedAt || new Date().toISOString(),
    })),
    ...purchases.map(purchase => ({
      id: purchase.id,
      type: 'purchase' as const,
      amount: purchase.totalAmount || 0,
      description: purchase.description || purchase.productName || '',
      productId: purchase.productId,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      createdAt: purchase.createdAt || purchase.requestedAt || new Date().toISOString(),
    })),
    ...incomes.map(income => ({
      id: income.id?.toString() || '',
      type: 'income' as const,
      amount: income.amount || 0,
      description: income.description || '',
      category: income.category,
      paymentMethod: income.paymentMethod,
      createdAt: income.createdAt || new Date().toISOString(),
    }))
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Calcular el saldo corriente para cada transacción
  let currentBalance = currentSession?.openingAmount || 0;
  
  const transactionsWithBalance = allTransactions.map((transaction, index) => {
    // Los ingresos SUMAN al saldo, gastos y compras RESTAN
    if (transaction.type === 'income') {
      currentBalance = currentBalance + transaction.amount;
    } else {
      currentBalance = currentBalance - transaction.amount;
    }
    
    // Debug temporal
    console.log(`Transacción ${index + 1}:`, {
      tipo: transaction.type,
      descripcion: transaction.description,
      monto: transaction.amount,
      operacion: transaction.type === 'income' ? 'SUMA' : 'RESTA',
      saldoAnterior: transaction.type === 'income' ? currentBalance - transaction.amount : currentBalance + transaction.amount,
      saldoDespues: currentBalance
    });
    
    return {
      ...transaction,
      runningBalance: currentBalance
    };
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteTransaction = async (id: string, type: 'expense' | 'purchase' | 'income') => {
    if (!currentUser) return;
    
    setDeletingTransaction(id);
    
    try {
      let result;
      if (type === 'expense') {
        result = await deletePettyCashExpense(id, currentUser.id);
      } else if (type === 'purchase') {
        result = await deletePettyCashPurchase(id, currentUser.id);
      } else {
        // TODO: Implementar función de eliminar ingresos
        alert('La eliminación de ingresos no está implementada aún');
        return;
      }

      if (result.success) {
        // Notificar al componente padre que se eliminó una transacción
        if (onTransactionDeleted) {
          onTransactionDeleted();
        }
        setShowDeleteConfirm(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      alert('Error inesperado al eliminar la transacción');
    } finally {
      setDeletingTransaction(null);
    }
  };

  const confirmDelete = (transaction: TransactionItem) => {
    setShowDeleteConfirm(transaction);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h2 className="text-2xl font-bold">Transacciones de Hoy</h2>
                <div className="flex items-center gap-4 text-orange-100">
                  <span>{allTransactions.length} transacciones registradas</span>
                  {currentSession && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="text-sm">💰</span>
                        <strong>Apertura: {formatCurrency(currentSession.openingAmount)}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {allTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay transacciones registradas
              </h3>
              <p className="text-gray-600 mb-4">
                Las transacciones aparecerán aquí una vez que registres gastos o compras.
              </p>
              
              {/* Mostrar saldo inicial si hay sesión */}
              {currentSession && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-sm mx-auto">
                  <div className="flex items-center justify-center gap-2 text-blue-800">
                    <span className="text-lg">💰</span>
                    <span className="font-medium">Saldo inicial disponible:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(currentSession.openingAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {transactionsWithBalance.map((transaction, index) => (
                <div
                  key={`${transaction.type}-${transaction.id}`}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        transaction.type === 'expense' 
                          ? 'bg-red-100 text-red-600' 
                          : transaction.type === 'purchase'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {transaction.type === 'expense' ? '💸' : transaction.type === 'purchase' ? '🛒' : '💰'}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'expense'
                              ? 'bg-red-100 text-red-700'
                              : transaction.type === 'purchase'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {transaction.type === 'expense' ? 'Gasto' : transaction.type === 'purchase' ? 'Compra' : 'Ingreso'}
                          </span>
                          <span className="text-sm text-gray-500">
                            #{index + 1}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {transaction.description}
                        </h4>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {transaction.category && (
                            <p>
                              <span className="font-medium">Categoría:</span> {transaction.category}
                            </p>
                          )}
                          {transaction.receiptNumber && (
                            <p>
                              <span className="font-medium">Boleta:</span> {transaction.receiptNumber}
                            </p>
                          )}
                          {transaction.paymentMethod && (
                            <p>
                              <span className="font-medium">Método de pago:</span> {transaction.paymentMethod}
                            </p>
                          )}
                          {transaction.quantity && transaction.unitPrice && (
                            <p>
                              <span className="font-medium">Detalle:</span> {transaction.quantity} unidad(es) × {formatCurrency(transaction.unitPrice)}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Fecha:</span> {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount and Balance */}
                    <div className="text-right flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        {/* Monto de la transacción */}
                      <div className={`text-xl font-bold ${
                        transaction.type === 'expense' 
                          ? 'text-red-600' 
                          : transaction.type === 'income'
                            ? 'text-emerald-600'
                            : 'text-green-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        
                        {/* Saldo corriente después de la transacción */}
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="text-xs">💰</span>
                          <span className="font-medium">Saldo:</span>
                          <span className={`font-bold ${
                            (transaction.runningBalance || 0) < 0 
                              ? 'text-red-600' 
                              : (transaction.runningBalance || 0) < 50000 
                                ? 'text-orange-600' 
                                : 'text-green-600'
                          }`}>
                            {formatCurrency(transaction.runningBalance || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Botón eliminar solo para administradores */}
                      {isAdmin && (
                        <button
                          onClick={() => confirmDelete(transaction)}
                          disabled={deletingTransaction === transaction.id}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                          title="Eliminar transacción (Solo administradores)"
                        >
                          {deletingTransaction === transaction.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '🗑️'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total de {allTransactions.length} transacciones
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total gastado:</span> {' '}
                <span className="font-bold text-red-600">
                  {formatCurrency(allTransactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total ingresos:</span> {' '}
                <span className="font-bold text-emerald-600">
                  {formatCurrency(allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
              
              {/* Saldo final */}
              {currentSession && transactionsWithBalance.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Saldo actual:</span> {' '}
                  <span className={`font-bold text-lg ${
                    (transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance || 0) < 0 
                      ? 'text-red-600' 
                      : (transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance || 0) < 50000 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                  }`}>
                    {formatCurrency(transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance || currentSession.openingAmount)}
                  </span>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  ⚠️
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar eliminación
                </h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                ¿Estás seguro de que deseas eliminar esta transacción?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {showDeleteConfirm.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tipo: {showDeleteConfirm.type === 'expense' ? 'Gasto' : 'Compra'}
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteTransaction(showDeleteConfirm.id, showDeleteConfirm.type as 'expense' | 'purchase')}
                  disabled={deletingTransaction === showDeleteConfirm.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {deletingTransaction === showDeleteConfirm.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Eliminando...
                    </div>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 