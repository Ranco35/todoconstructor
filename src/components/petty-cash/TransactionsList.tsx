'use client';

import React, { useState } from 'react';
import { PettyCashExpenseData, PettyCashPurchaseData, deletePettyCashTransaction } from '@/actions/configuration/petty-cash-actions';
import { PettyCashIncomeData, deletePettyCashIncome } from '@/actions/configuration/petty-cash-income-actions';
import { Trash2, AlertTriangle, CheckCircle, DollarSign, ShoppingCart, Plus } from 'lucide-react';

interface TransactionsListProps {
  expenses: PettyCashExpenseData[];
  purchases: PettyCashPurchaseData[];
  incomes: PettyCashIncomeData[];
  currentSession: {
    id: number;
    status: string;
    userId: string;
  };
  currentUser?: {
    id: string;
    role: string;
    name: string;
  };
  onTransactionDeleted?: () => void;
}

export default function TransactionsList({
  expenses,
  purchases,
  incomes,
  currentSession,
  currentUser,
  onTransactionDeleted
}: TransactionsListProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Verificar si el usuario puede eliminar transacciones
  const canDelete = currentSession.status === 'open' && currentUser && (
    currentUser.role === 'ADMINISTRADOR' || 
    currentUser.role === 'SUPER_USER' || 
    currentSession.userId === currentUser.id
  );

  const handleDeleteTransaction = async (transactionId: number, transactionType: 'expense' | 'purchase' | 'income') => {
    if (!canDelete) {
      setDeleteError('No tienes permisos para eliminar transacciones');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar este ${transactionType === 'expense' ? 'gasto' : transactionType === 'purchase' ? 'compra' : 'ingreso'}?`)) {
      return;
    }

    setIsDeleting(transactionId);
    setDeleteError(null);

    try {
      let result;
      
      if (transactionType === 'income') {
        result = await deletePettyCashIncome(transactionId, currentSession.id);
      } else {
        const formData = new FormData();
        formData.append('transactionId', transactionId.toString());
        formData.append('transactionType', transactionType);
        formData.append('sessionId', currentSession.id.toString());
        
        result = await deletePettyCashTransaction(formData);
      }

      if (result.success) {
        onTransactionDeleted?.();
      } else {
        setDeleteError(result.error || 'Error al eliminar la transacción');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setDeleteError('Error inesperado al eliminar la transacción');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <DollarSign className="w-4 h-4 text-red-500" />;
      case 'purchase':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'income':
        return <Plus className="w-4 h-4 text-green-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'expense':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Gasto</span>;
      case 'purchase':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Compra</span>;
      case 'income':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ingreso</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Transacción</span>;
    }
  };

  // Combinar todas las transacciones y ordenarlas por fecha
  const allTransactions = [
    ...expenses.map(exp => ({ ...exp, type: 'expense' as const })),
    ...purchases.map(pur => ({ ...pur, type: 'purchase' as const })),
    ...incomes.map(inc => ({ ...inc, type: 'income' as const }))
  ].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  if (allTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay transacciones</h3>
        <p className="text-gray-500">Aún no se han registrado transacciones en esta sesión.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al eliminar</h3>
              <p className="text-sm text-red-700 mt-1">{deleteError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {allTransactions.map((transaction) => (
            <li key={`${transaction.type}-${transaction.id}`} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTransactionBadge(transaction.type)}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description || 'Sin descripción'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatDate(transaction.createdAt || '')}</span>
                      {transaction.CostCenter && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {transaction.CostCenter.name}
                        </span>
                      )}
                      {transaction.User && (
                        <span>por {transaction.User.name}</span>
                      )}
                    </div>
                    {transaction.type === 'purchase' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.quantity} x {formatCurrency(transaction.unitPrice)} = {formatCurrency(transaction.totalAmount)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(
                        transaction.type === 'purchase' ? transaction.totalAmount : transaction.amount
                      )}
                    </p>
                  </div>
                  
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id, transaction.type)}
                      disabled={isDeleting === transaction.id}
                      className="inline-flex items-center p-1 border border-transparent rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      title="Eliminar transacción"
                    >
                      {isDeleting === transaction.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {!canDelete && currentSession.status === 'closed' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Sesión cerrada</h3>
              <p className="text-sm text-yellow-700 mt-1">
                No se pueden eliminar transacciones de sesiones cerradas.
              </p>
            </div>
          </div>
        </div>
      )}

      {!canDelete && currentSession.status === 'open' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Permisos limitados</h3>
              <p className="text-sm text-blue-700 mt-1">
                Solo el cajero de la sesión o un administrador puede eliminar transacciones.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 