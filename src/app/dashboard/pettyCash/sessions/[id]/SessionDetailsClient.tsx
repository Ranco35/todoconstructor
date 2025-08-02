'use client';

import React from 'react';
import { CashSessionData, PettyCashExpenseData, PettyCashPurchaseData } from '@/actions/configuration/petty-cash-actions';
import { CashClosureSummary } from '@/actions/configuration/cash-closure-actions';
import { UserData } from '@/actions/configuration/auth-actions';
import { useRouter } from 'next/navigation';

interface SessionDetailsClientProps {
  session: CashSessionData;
  expenses: PettyCashExpenseData[];
  purchases: PettyCashPurchaseData[];
  summary: {
    totalExpenses: number;
    totalPurchases: number;
    totalTransactions: number;
    pendingTransactions: number;
    totalSpent: number;
  };
  closureSummary: CashClosureSummary | null;
  currentUser: UserData;
}

export default function SessionDetailsClient({ 
  session,
  expenses,
  purchases,
  summary,
  closureSummary,
  currentUser
}: SessionDetailsClientProps) {
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Abierta' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: '🔒', label: 'Cerrada' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️', label: 'Suspendida' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.closed;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-2">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Detalles de Sesión {session.sessionNumber || `S${session.id}`}
              </h1>
              <p className="text-gray-600">
                Información completa de la sesión de caja chica
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard/pettyCash/sessions')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>←</span>
                <span>Volver al Historial</span>
              </button>
            </div>
          </div>

          {/* Información básica de la sesión */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Estado</p>
                  <div className="mt-1">
                    {getStatusBadge(session.status)}
                  </div>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Monto Inicial</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(session.openingAmount)}</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Cajero</p>
                  <p className="text-lg font-bold text-purple-900">{session.User.name}</p>
                  <p className="text-sm text-purple-600">{session.User.email}</p>
                </div>
                <div className="text-3xl">👤</div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Caja Registradora</p>
                  <p className="text-lg font-bold text-orange-900">{session.CashRegister.name}</p>
                  <p className="text-sm text-orange-600">{session.CashRegister.location}</p>
                </div>
                <div className="text-3xl">🏦</div>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📅 Fecha de Apertura</h3>
              <p className="text-gray-700">{formatDate(session.openedAt)}</p>
            </div>
            {session.closedAt && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🔒 Fecha de Cierre</h3>
                <p className="text-gray-700">{formatDate(session.closedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de transacciones */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Resumen de Transacciones</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total Gastos</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</p>
                  <p className="text-sm text-red-600">{expenses.length} transacciones</p>
                </div>
                <div className="text-3xl">💸</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Compras</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalPurchases)}</p>
                  <p className="text-sm text-blue-600">{purchases.length} transacciones</p>
                </div>
                <div className="text-3xl">🛒</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(summary.totalSpent)}</p>
                  <p className="text-sm text-purple-600">{summary.totalTransactions} transacciones</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de cierre (si existe) */}
        {closureSummary && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔒 Resumen de Cierre</h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Monto Inicial</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(closureSummary.openingAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(closureSummary.totalIncomes)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Gastos + Compras</p>
                  <p className="text-lg font-bold text-red-600">-{formatCurrency(closureSummary.totalExpenses + closureSummary.totalPurchases)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Efectivo Esperado</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(closureSummary.expectedCash)}</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Duración de sesión: {closureSummary.sessionDuration}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de transacciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gastos */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💸 Gastos ({expenses.length})</h3>
            
            {expenses.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expenses.map((expense) => (
                  <div key={expense.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        {expense.Category && (
                          <p className="text-sm text-gray-600">Categoría: {expense.Category.name}</p>
                        )}
                        {expense.CostCenter && (
                          <p className="text-sm text-gray-600">Centro de Costo: {expense.CostCenter.name}</p>
                        )}
                        <p className="text-sm text-gray-500">Por: {expense.User.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                        {expense.createdAt && (
                          <p className="text-xs text-gray-500">{formatDate(expense.createdAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No hay gastos registrados</p>
              </div>
            )}
          </div>

          {/* Compras */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🛒 Compras ({purchases.length})</h3>
            
            {purchases.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{purchase.productName}</p>
                        <p className="text-sm text-gray-600">
                          {purchase.quantity} × {formatCurrency(purchase.unitPrice)}
                        </p>
                        {purchase.supplier && (
                          <p className="text-sm text-gray-600">Proveedor: {purchase.supplier}</p>
                        )}
                        <p className="text-sm text-gray-500">Por: {purchase.User.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{formatCurrency(purchase.totalAmount)}</p>
                        {purchase.createdAt && (
                          <p className="text-xs text-gray-500">{formatDate(purchase.createdAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No hay compras registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* Notas de la sesión */}
        {session.notes && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Notas de la Sesión</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{session.notes}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 