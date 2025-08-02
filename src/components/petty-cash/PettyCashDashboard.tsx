'use client';

import React, { useState } from 'react';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';
import { PettyCashExpenseData, PettyCashPurchaseData } from '@/actions/configuration/petty-cash-actions';
import { PettyCashIncomeData } from '@/actions/configuration/petty-cash-income-actions';
import { CashClosureSummary } from '@/actions/configuration/cash-closure-actions';
import ExpenseForm from './ExpenseForm';
import PurchaseForm from './PurchaseForm';
import IncomeForm from './IncomeForm';
import CashClosureModal from './CashClosureModal';
import HistoricalCashManagementModal from './HistoricalCashManagementModal';
import TransactionsModal from './TransactionsModal';
import CashOpeningModal from './CashOpeningModal';
import TransactionsReportModal from './TransactionsReportModal';
import TransactionsList from './TransactionsList';

interface PettyCashDashboardProps {
  currentSession: CashSessionData | null;
  expenses: PettyCashExpenseData[];
  purchases: PettyCashPurchaseData[];
  incomes: PettyCashIncomeData[];
  summary: any;
  closureSummary: CashClosureSummary | null;
  showExpenseForm?: boolean;
  setShowExpenseForm?: (show: boolean) => void;
  showPurchaseForm?: boolean;
  setShowPurchaseForm?: (show: boolean) => void;
  showClosureModal?: boolean;
  setShowClosureModal?: (show: boolean) => void;
  currentUser?: any;
  onSessionCreated?: () => void;
  showSupplierPaymentForm?: boolean;
  onOpenSupplierPaymentForm?: () => void;
}

type TabType = 'overview' | 'petty-cash' | 'transactions' | 'closure';

export default function PettyCashDashboard({ 
  currentSession, 
  expenses, 
  purchases, 
  incomes, 
  summary,
  closureSummary,
  showExpenseForm = false,
  setShowExpenseForm,
  showPurchaseForm = false,
  setShowPurchaseForm,
  showClosureModal = false,
  setShowClosureModal,
  currentUser,
  onSessionCreated,
  showSupplierPaymentForm,
  onOpenSupplierPaymentForm
}: PettyCashDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  // Si no hay funciones externas, usar estado local (fallback)
  const [localShowExpenseForm, setLocalShowExpenseForm] = useState(false);
  const [localShowPurchaseForm, setLocalShowPurchaseForm] = useState(false);
  const [localShowClosureModal, setLocalShowClosureModal] = useState(false);

  const handleShowExpenseForm = (show: boolean) => {
    if (setShowExpenseForm) {
      setShowExpenseForm(show);
    } else {
      setLocalShowExpenseForm(show);
    }
  };

  const handleShowPurchaseForm = (show: boolean) => {
    if (setShowPurchaseForm) {
      setShowPurchaseForm(show);
    } else {
      setLocalShowPurchaseForm(show);
    }
  };

  const handleShowClosureModal = (show: boolean) => {
    console.log('🔒 handleShowClosureModal llamado con:', show);
    console.log('🔍 currentSession:', currentSession);
    console.log('🔍 setShowClosureModal función:', setShowClosureModal);
    
    // Verificar que hay sesión activa antes de abrir modal de cierre
    if (show && !currentSession) {
      console.error('❌ No hay sesión activa');
      alert('No hay una sesión activa para cerrar. Por favor, abre una nueva sesión primero.');
      return;
    }
    
    if (setShowClosureModal) {
      console.log('✅ Usando setShowClosureModal del padre');
      setShowClosureModal(show);
    } else {
      console.log('✅ Usando setLocalShowClosureModal');
      setLocalShowClosureModal(show);
    }
    
    console.log('🔍 finalShowClosureModal después de cambio:', finalShowClosureModal);
  };

  const finalShowExpenseForm = setShowExpenseForm ? showExpenseForm : localShowExpenseForm;
  const finalShowPurchaseForm = setShowPurchaseForm ? showPurchaseForm : localShowPurchaseForm;
  const finalShowClosureModal = setShowClosureModal ? showClosureModal : localShowClosureModal;

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: '📊' },
    { id: 'petty-cash', name: 'Caja Chica', icon: '💰' },
    { id: 'transactions', name: 'Transacciones', icon: '📋' },
    { id: 'closure', name: 'Cierre', icon: '🔒' }
  ];

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay sesión activa</h3>
            <p className="text-gray-600 mb-6">Para usar caja chica necesitas una sesión abierta</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setShowOpeningModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Abrir Nueva Sesión
              </button>
              <button 
                onClick={() => setShowHistoricalModal(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                📚 Cajas Históricas
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard/pettyCash/sessions'}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                📋 Historial Sesiones
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sessionDuration = () => {
    const now = new Date();
    const opened = new Date(currentSession.openedAt);
    const diff = now.getTime() - opened.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header Mejorado */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  {currentSession.User.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{currentSession.User.name} - Cajero</h3>
                  <p className="text-gray-300">{currentSession.User.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3 bg-white bg-opacity-15 backdrop-blur-sm px-4 py-3 rounded-xl mb-2 border border-white border-opacity-20">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <strong className="text-lg">Sesión {currentSession.sessionNumber}</strong>
                </div>
                <small className="text-gray-300">Abierta desde: {sessionDuration()}</small>
              </div>
            </div>
          </div>

          {/* Tabs Mejorados */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-8 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <OverviewTab 
                currentSession={currentSession}
                summary={summary}
                closureSummary={closureSummary}
                onOpenExpenseForm={() => handleShowExpenseForm(true)}
                onOpenPurchaseForm={() => handleShowPurchaseForm(true)}
                onOpenClosureModal={() => handleShowClosureModal(true)}
                setActiveTab={setActiveTab}
                onOpenHistoricalModal={() => setShowHistoricalModal(true)}
                onOpenTransactionsModal={() => setShowTransactionsModal(true)}
                onOpenReportModal={() => setShowReportModal(true)}
                onOpenIncomeForm={() => setShowIncomeForm(true)}
                onOpenSupplierPaymentForm={onOpenSupplierPaymentForm}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'petty-cash' && (
              <PettyCashTab 
                expenses={expenses}
                purchases={purchases}
                incomes={incomes}
                summary={summary}
              />
            )}
            {activeTab === 'transactions' && (
              <TransactionsList
                expenses={expenses}
                purchases={purchases}
                incomes={incomes}
                currentSession={currentSession}
                currentUser={currentUser}
                onTransactionDeleted={onSessionCreated}
              />
            )}
            {activeTab === 'closure' && (
              <ClosureTab 
                closureSummary={closureSummary}
                onOpenClosureModal={() => handleShowClosureModal(true)}
              />
            )}
          </div>

          {/* Modals */}
          {finalShowExpenseForm && (
            <ExpenseForm
              sessionId={currentSession.id}
              userId={parseInt(currentSession.User.id)}
              userName={currentSession.User.name}
              onClose={() => handleShowExpenseForm(false)}
            />
          )}

          {finalShowPurchaseForm && (
            <PurchaseForm
              sessionId={currentSession.id}
              userId={parseInt(currentSession.User.id)}
              userName={currentSession.User.name}
              onClose={() => handleShowPurchaseForm(false)}
            />
          )}

          {showIncomeForm && (
            <>
              {currentSession && currentSession.id && currentSession.status === 'open' ? (
                <>
                  {console.log('[PettyCashDashboard] Renderizando IncomeForm con sessionId:', currentSession.id, 'status:', currentSession.status)}
                  <IncomeForm
                    cashRegisterId={currentSession.cashRegisterId}
                    onClose={() => setShowIncomeForm(false)}
                    userId={currentUser?.id || ''}
                  />
                </>
              ) : (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-center font-semibold">
                  No hay una sesión de caja activa. Abre una sesión para registrar ingresos de efectivo.
                </div>
              )}
            </>
          )}

          {finalShowClosureModal && (
              <CashClosureModal
              sessionId={currentSession.id}
              closureSummary={closureSummary}
              onClose={() => handleShowClosureModal(false)}
              onSuccess={() => {
                // Recargar la página tras el cierre exitoso para actualizar el estado
                window.location.reload();
              }}
              currentUser={currentUser}
              />
          )}

          {showHistoricalModal && (
            <HistoricalCashManagementModal
              isOpen={showHistoricalModal}
              onClose={() => setShowHistoricalModal(false)}
              currentUser={currentUser}
            />
          )}

          {showTransactionsModal && (
            <TransactionsModal
              isOpen={showTransactionsModal}
              onClose={() => setShowTransactionsModal(false)}
              expenses={expenses}
              purchases={purchases}
              incomes={incomes}
              currentUser={currentUser}
              currentSession={currentSession}
            />
          )}

          {showOpeningModal && (
          <CashOpeningModal
            isOpen={showOpeningModal}
            onClose={() => setShowOpeningModal(false)}
              currentUser={currentUser}
              onSessionCreated={onSessionCreated}
            />
          )}

          {showReportModal && (
          <TransactionsReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
              currentSession={currentSession}
          />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component Mejorado
function OverviewTab({ currentSession, summary, closureSummary, onOpenExpenseForm, onOpenPurchaseForm, onOpenClosureModal, setActiveTab, onOpenHistoricalModal, onOpenTransactionsModal, onOpenReportModal, onOpenIncomeForm, onOpenSupplierPaymentForm, currentUser }: any) {
  // Calcular saldo actual que va quedando (incluyendo ingresos)
  const saldoInicial = currentSession?.openingAmount || 0;
  const totalGastos = summary?.totalExpenses || 0;
  const totalCompras = (summary?.totalPurchases || 0);
  const totalIngresos = summary?.totalIncomes || 0;
  const saldoActual = saldoInicial + totalIngresos - totalGastos - totalCompras;

  return (
    <div className="space-y-6">
      {/* ESTADO FINANCIERO DE LA CAJA - DISEÑO MEJORADO */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            💰 Estado Financiero de la Caja
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Saldo Inicial */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                🏦
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Saldo Inicial</h3>
              <p className="text-2xl font-bold text-blue-600">
                ${saldoInicial.toLocaleString()}
              </p>
            </div>

            {/* Total Ingresos */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                💰
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Ingresos</h3>
              <p className="text-2xl font-bold text-emerald-600">
                ${totalIngresos.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Reposiciones y ajustes
              </p>
            </div>

            {/* Total Gastado */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                💸
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Gastado</h3>
              <p className="text-2xl font-bold text-red-600">
                ${(totalGastos + totalCompras).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Gastos: ${totalGastos.toLocaleString()} + Compras: ${totalCompras.toLocaleString()}
              </p>
            </div>

            {/* Saldo Actual */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                saldoActual >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {saldoActual >= 0 ? '💵' : '⚠️'}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Saldo Actual</h3>
              <p className={`text-2xl font-bold ${
                saldoActual >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(saldoActual).toLocaleString()}
              </p>
              {saldoActual < 0 && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  DÉFICIT
                </p>
              )}
            </div>
          </div>

          {/* Fórmula de cálculo */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-center text-sm text-gray-600">
                <span className="font-medium">Fórmula:</span> 
                <span className="text-blue-600 font-semibold"> ${saldoInicial.toLocaleString()}</span>
                <span className="text-gray-500"> + </span>
                <span className="text-emerald-600 font-semibold">${totalIngresos.toLocaleString()}</span>
                <span className="text-gray-500"> - </span>
                <span className="text-red-600 font-semibold">${(totalGastos + totalCompras).toLocaleString()}</span>
                <span className="text-gray-500"> = </span>
                <span className={`font-bold ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(saldoActual).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          {/* Alerta de déficit */}
          {saldoActual < 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold text-sm">
                  ALERTA: La caja está en déficit. Has gastado más dinero del que tenías disponible.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🚀 Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={onOpenHistoricalModal}
            className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
          >
            <span className="text-2xl mb-2">📚</span>
            <span className="text-sm font-medium text-gray-700">Cajas Históricas</span>
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/pettyCash/sessions'}
            className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
          >
            <span className="text-2xl mb-2">📋</span>
            <span className="text-sm font-medium text-gray-700">Historial Sesiones</span>
          </button>
          <button 
            onClick={onOpenTransactionsModal}
            className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-md"
          >
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">Ver Transacciones</span>
          </button>
          <button 
            onClick={onOpenReportModal}
            className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-md"
          >
            <span className="text-2xl mb-2">📈</span>
            <span className="text-sm font-medium text-gray-700">Reportes Excel</span>
          </button>
        </div>
      </div>

      {/* Modules Grid Mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Petty Cash Module */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-transparent hover:border-orange-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              💰
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Caja Chica</h3>
              <p className="text-gray-600">Gastos menores y compras urgentes</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl text-center border-2 border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl font-bold text-gray-900">${(summary.totalSpent || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Gastos Hoy</div>
            </div>
            <button 
              onClick={onOpenTransactionsModal}
              className="bg-white p-4 rounded-xl text-center border-2 border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 w-full cursor-pointer hover:border-orange-200 hover:bg-orange-50"
            >
              <div className="text-2xl font-bold text-gray-900">{summary.totalTransactions || 0}</div>
              <div className="text-sm text-gray-600">Transacciones</div>
            </button>
            <div className="bg-white p-4 rounded-xl text-center border-2 border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                              <div className="text-2xl font-bold text-gray-900">{summary.pendingTransactions || 0}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onOpenExpenseForm}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              💸 Nuevo Gasto
            </button>
            <button 
              onClick={onOpenPurchaseForm}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🛒 Comprar Productos
            </button>
            <button 
              onClick={onOpenSupplierPaymentForm}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              👥 Pago Proveedores Part-Time
            </button>
          </div>
        </div>

        {/* Cash Closure Module */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-transparent hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              🔒
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Cierre de Caja</h3>
              <p className="text-gray-600">Conciliación total del turno</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl text-center border-2 border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl font-bold text-gray-900">${(closureSummary?.totalSales || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Ventas Total</div>
            </div>
            <div className="bg-white p-4 rounded-xl text-center border-2 border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl font-bold text-gray-900">${(closureSummary?.salesCash || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Efectivo</div>
            </div>
            <div className="bg-white p-4 rounded-xl text-center border-2 border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl font-bold text-gray-900">${(closureSummary?.salesCard || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Tarjetas</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setActiveTab('closure')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              📊 Ver Resumen
            </button>
            <button 
              onClick={() => {
                console.log('🔒 Botón Cerrar Caja (superior) clickeado');
                console.log('onOpenClosureModal función:', onOpenClosureModal);
                if (onOpenClosureModal) {
                  onOpenClosureModal();
                } else {
                  console.error('❌ onOpenClosureModal no está definido');
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🔒 Cerrar Caja
            </button>
          </div>
        </div>
      </div>

      {/* Integration Flow Mejorado */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-center mb-8">🔄 Flujo Integrado del Día</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white bg-opacity-15 backdrop-blur-sm p-6 rounded-xl text-center relative border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl mb-3">🌅</div>
            <div className="font-bold mb-2 text-lg">Apertura</div>
            <div className="text-sm opacity-90">Sesión iniciada con ${(currentSession.openingAmount || 0).toLocaleString()}</div>
            <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl">→</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm p-6 rounded-xl text-center relative border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl mb-3">🛒</div>
            <div className="font-bold mb-2 text-lg">Ventas</div>
            <div className="text-sm opacity-90">Efectivo + Tarjetas registradas</div>
            <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl">→</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm p-6 rounded-xl text-center relative border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl mb-3">💰</div>
            <div className="font-bold mb-2 text-lg">Caja Chica</div>
            <div className="text-sm opacity-90">Gastos menores controlados</div>
            <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl">→</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm p-6 rounded-xl text-center border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl mb-3">🔒</div>
            <div className="font-bold mb-2 text-lg">Cierre</div>
            <div className="text-sm opacity-90">Conciliación automática</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Mejoradas */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-3">
          ⚡ Acciones Rápidas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button 
            onClick={onOpenExpenseForm}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">💸</div>
            <div className="font-semibold">Nuevo Gasto</div>
            <div className="text-sm opacity-90">Registrar gasto menor</div>
          </button>
          
          <button 
            onClick={onOpenPurchaseForm}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">🛒</div>
            <div className="font-semibold">Nueva Compra</div>
            <div className="text-sm opacity-90">Comprar productos</div>
          </button>
          
          <button 
            onClick={onOpenIncomeForm}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold">Ajuste de Efectivo</div>
            <div className="text-sm opacity-90">Préstamo, reposición, reembolso</div>
          </button>
          
          <button 
            onClick={onOpenHistoricalModal}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold">Transacciones Históricas</div>
            <div className="text-sm opacity-90">Importar/Exportar por Excel</div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/pettyCash/sessions'}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold">Historial Sesiones</div>
            <div className="text-sm opacity-90">Ver todas las sesiones</div>
          </button>
          
          {/* Panel Administrativo - Solo para Admins */}
          {(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR') && (
            <button 
              onClick={() => window.location.href = '/dashboard/pettyCash/admin'}
              className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-2">🛡️</div>
              <div className="font-semibold">Panel Administrativo</div>
              <div className="text-sm opacity-90">Vista completa con filtros avanzados</div>
            </button>
          )}
          
          <button 
            onClick={() => setActiveTab('closure')}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-6 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold">Ver Resumen</div>
            <div className="text-sm opacity-90">Estado de cierre</div>
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('closure')}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            📊 Ver Resumen
          </button>
          <button 
            onClick={() => {
              console.log('🔒 Botón Cerrar Caja clickeado');
              console.log('onOpenClosureModal función:', onOpenClosureModal);
              if (onOpenClosureModal) {
                onOpenClosureModal();
              } else {
                console.error('❌ onOpenClosureModal no está definido');
              }
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🔒 Cerrar Caja
          </button>
        </div>
      </div>
    </div>
  );
}

// Petty Cash Tab Component Mejorado
function PettyCashTab({ expenses, purchases, incomes, summary }: { expenses: any; purchases: any; incomes: any; summary: any }) {
  return (
    <div className="space-y-8">
      {/* Información del usuario y límites mejorada */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
            👤 Información del Cajero
          </h3>
          <div className="text-sm text-blue-700 bg-blue-100 px-4 py-2 rounded-lg">
            Sin límites configurados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-6 text-center border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl font-bold text-green-600 mb-2">Sin Límite</div>
            <div className="text-sm text-gray-600">Límite Diario</div>
          </div>
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-6 text-center border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl font-bold text-gray-900 mb-2">{(summary.totalTransactions || 0) - (summary.pendingTransactions || 0)}</div>
            <div className="text-sm text-gray-600">Transacciones Aprobadas</div>
          </div>
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-6 text-center border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-3xl font-bold text-orange-600 mb-2">{summary.pendingTransactions || 0}</div>
            <div className="text-sm text-gray-600">Pendiente Aprobación</div>
          </div>
        </div>

        {/* Transactions Table Mejorada */}
        <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-100 shadow-lg mt-8">
          <div className="px-8 py-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <h4 className="text-xl font-bold text-gray-900">Transacciones de Hoy</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Hora</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tipo</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Descripción</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Monto</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Expenses */}
                {expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-8 py-4 text-sm text-gray-900">
                      {expense.requestedAt || expense.createdAt ? new Date(expense.requestedAt || expense.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900">
                      <div>
                        <span className="font-medium">Gasto</span>
                        {expense.Category && (
                          <div className="text-xs text-blue-600 mt-1">
                            📁 {expense.Category.name}
                          </div>
                        )}
                        {expense.CostCenter && (
                            <div className="text-xs text-purple-600 mt-1">
                              🏢 {expense.CostCenter.name}
                              {expense.CostCenter.code && ` (${expense.CostCenter.code})`}
                            </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-8 py-4 text-sm font-semibold text-red-600">-${(expense.amount || 0).toLocaleString()}</td>
                    <td className="px-8 py-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
                        <span className="text-lg">✅</span>
                        <span>Aprobado</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Purchases */}
                {purchases.map((purchase: any) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-8 py-4 text-sm text-gray-900">
                      {purchase.requestedAt || purchase.createdAt ? new Date(purchase.requestedAt || purchase.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900">
                      <div>
                        <span className="font-medium">Compra</span>
                        {purchase.Product ? (
                          <div className="text-xs text-green-600 mt-1">
                            🔗 {purchase.Product.name}
                            {purchase.Product.sku && ` (${purchase.Product.sku})`}
                            {purchase.Product.Category && (
                              <div className="text-xs text-blue-600">
                                📁 {purchase.Product.Category.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">
                            📦 Producto nuevo
                          </div>
                        )}
                        {purchase.CostCenter && (
                          <div className="text-xs text-purple-600 mt-1">
                            🏢 {purchase.CostCenter.name}
                            {purchase.CostCenter.code && ` (${purchase.CostCenter.code})`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900">{purchase.description}</td>
                    <td className="px-8 py-4 text-sm font-semibold text-red-600">-${(purchase.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-8 py-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
                        <span className="text-lg">✅</span>
                        <span>Aprobado</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Incomes */}
                {incomes.map((income: any) => (
                  <tr key={income.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-8 py-4 text-sm text-gray-900">
                      {income.requestedAt || income.createdAt ? new Date(income.requestedAt || income.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900">
                      <div>
                        <span className="font-medium">Ingreso</span>
                        {income.Category && (
                          <div className="text-xs text-green-600 mt-1">
                            📁 {income.Category.name}
                          </div>
                        )}
                        {income.CostCenter && (
                            <div className="text-xs text-purple-600 mt-1">
                              🏢 {income.CostCenter.name}
                              {income.CostCenter.code && ` (${income.CostCenter.code})`}
                            </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900">{income.description}</td>
                    <td className="px-8 py-4 text-sm font-semibold text-green-600">+${(income.amount || 0).toLocaleString()}</td>
                    <td className="px-8 py-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
                        <span className="text-lg">✅</span>
                        <span>Aprobado</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && purchases.length === 0 && incomes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-4">📋</div>
                      <div className="text-lg font-medium">No hay transacciones registradas hoy</div>
                      <div className="text-sm">Las transacciones aparecerán aquí cuando las registres</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Closure Tab Component Mejorado
function ClosureTab({ closureSummary, onOpenClosureModal }: { closureSummary: any; onOpenClosureModal: () => void }) {
  if (!closureSummary) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6">📊</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Calculando resumen de cierre...</h3>
        <p className="text-gray-600 mb-6">Los datos se están procesando</p>
        <button 
          onClick={onOpenClosureModal}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2"
        >
          🔒 Proceder al Cierre de Caja
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-green-800 mb-4">
            🔒 Resumen para Cierre de Caja - Sesión {closureSummary.sessionNumber || 'N/A'}
          </h3>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-2xl border-2 border-green-100">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
              <tr>
                <th className="px-8 py-6 text-left font-bold text-lg">Concepto</th>
                <th className="px-8 py-6 text-right font-bold text-lg">Efectivo</th>
                <th className="px-8 py-6 text-right font-bold text-lg">Tarjetas</th>
                <th className="px-8 py-6 text-right font-bold text-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-8 py-6 font-semibold text-lg">💰 Monto de Apertura</td>
                <td className="px-8 py-6 text-right text-green-600 font-bold text-lg">${(closureSummary.openingAmount || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-gray-500">-</td>
                <td className="px-8 py-6 text-right text-green-600 font-bold text-lg">${(closureSummary.openingAmount || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-8 py-6 font-semibold text-lg">🛒 Ventas del Día</td>
                <td className="px-8 py-6 text-right text-green-600 font-bold text-lg">+${(closureSummary.salesCash || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-gray-700 font-semibold text-lg">${(closureSummary.salesCard || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-green-600 font-bold text-lg">${(closureSummary.totalSales || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-8 py-6 font-semibold text-lg">💸 Gastos Caja Chica</td>
                <td className="px-8 py-6 text-right text-red-600 font-bold text-lg">-${(closureSummary.totalExpenses || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-gray-500">-</td>
                <td className="px-8 py-6 text-right text-red-600 font-bold text-lg">-${(closureSummary.totalExpenses || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-8 py-6 font-semibold text-lg">🛒 Compras Caja Chica</td>
                <td className="px-8 py-6 text-right text-red-600 font-bold text-lg">-${(closureSummary.totalPurchases || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-gray-500">-</td>
                <td className="px-8 py-6 text-right text-red-600 font-bold text-lg">-${(closureSummary.totalPurchases || 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-gradient-to-r from-green-100 to-emerald-100 border-t-4 border-green-500">
                <td className="px-8 py-6 font-bold text-2xl">🎯 EFECTIVO ESPERADO</td>
                <td className="px-8 py-6 text-right text-green-700 font-bold text-2xl">${(closureSummary.expectedCash || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-gray-700 font-semibold text-xl">${(closureSummary.salesCard || 0).toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-green-700 font-bold text-2xl">${((closureSummary.expectedCash || 0) + (closureSummary.salesCard || 0)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-6 mt-8">
          <div className="flex items-start gap-4">
            <div className="text-green-600 text-2xl">✅</div>
            <div>
              <strong className="text-green-800 text-lg">Resumen de Cierre:</strong>
              <div className="text-green-700 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span><strong>Efectivo esperado en caja:</strong></span>
                  <span className="font-bold">${(closureSummary.expectedCash || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Ventas con tarjeta:</strong></span>
                  <span className="font-bold">${(closureSummary.salesCard || 0).toLocaleString()} (no afectan efectivo)</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Total de ventas del día:</strong></span>
                  <span className="font-bold">${(closureSummary.totalSales || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Duración de sesión:</strong></span>
                  <span className="font-bold">{closureSummary.sessionDuration || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button 
            onClick={onOpenClosureModal}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2"
          >
            🔒 Proceder al Cierre de Caja
          </button>
        </div>
      </div>
    </div>
  );
} 