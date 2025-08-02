'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PettyCashDashboard from './PettyCashDashboard';
import ExpenseForm from './ExpenseForm';
import PurchaseForm from './PurchaseForm';
import CashClosureModal from './CashClosureModal';
import OpenSessionModal from './OpenSessionModal';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';
import SupplierPaymentForm from './SupplierPaymentForm';

interface ClientPettyCashPageProps {
  currentSession: CashSessionData | null;
  expenses: any[];
  purchases: any[];
  incomes: any[];
  summary: any;
  closureSummary: any;
  currentUser?: any;
}

export default function ClientPettyCashPage({
  currentSession,
  expenses,
  purchases,
  incomes,
  summary,
  closureSummary,
  currentUser
}: ClientPettyCashPageProps) {
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierPaymentForm, setShowSupplierPaymentForm] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const router = useRouter();

  const handleSessionCreated = () => {
    setIsOpenSessionModalOpen(false);
    router.refresh();
  };

  const handleOpenModal = () => {
    setIsOpenSessionModalOpen(true);
  };

  const handleOpenExpenseForm = () => {
    setShowExpenseForm(true);
  };

  const handleOpenPurchaseForm = () => {
    setShowPurchaseForm(true);
  };

  const handleOpenSupplierPaymentForm = () => {
    setShowSupplierPaymentForm(true);
  };

  const handleOpenClosureModal = () => {
    console.log('🔒 handleOpenClosureModal llamado');
    console.log('🔍 Estado actual showClosureModal:', showClosureModal);
    setShowClosureModal(true);
    console.log('✅ showClosureModal establecido a true');
  };

  const handleOpenHistorial = () => {
    console.log('📋 Navegando al historial de sesiones...');
    router.push('/dashboard/pettyCash/sessions');
  };

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema Integrado - Caja Chica + Cierre
            </h1>
            <p className="text-gray-600">
              Gestión completa de gastos menores y cierre de sesiones de caja
            </p>
          </div>
          
          {/* Acciones rápidas en el header */}
          <div className="flex items-center space-x-4">
            {currentSession ? (
              <>
                <button
                  onClick={handleOpenExpenseForm}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>💸</span>
                  <span>Nuevo Gasto</span>
                </button>
                <button
                  onClick={handleOpenPurchaseForm}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>🛒</span>
                  <span>Nueva Compra</span>
                </button>
                <button
                  onClick={() => router.push('/dashboard/pettyCash/sessions')}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>📋</span>
                  <span>Historial</span>
                </button>
                {/* Botón Panel Administrativo - Solo para Admins */}
                {(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => router.push('/dashboard/pettyCash/admin')}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Panel Administrativo - Vista completa de transacciones"
                  >
                    <span>🛡️</span>
                    <span>Panel Admin</span>
                  </button>
                )}
                {/* Botón de Reset - Solo para Admins */}
                {(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => router.push('/dashboard/pettyCash/reset')}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Reset del Sistema - Solo Administradores"
                  >
                    <span>🧹</span>
                    <span>Reset</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenModal}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>🔓</span>
                  <span>Abrir Sesión</span>
                </button>
                <button
                  onClick={handleOpenHistorial}
                  className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>📋</span>
                  <span>Historial</span>
                </button>
                {/* Botón Panel Administrativo - Solo para Admins */}
                {(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => router.push('/dashboard/pettyCash/admin')}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Panel Administrativo - Vista completa de transacciones"
                  >
                    <span>🛡️</span>
                    <span>Panel Admin</span>
                  </button>
                )}
                {/* Botón de Reset - Solo para Admins */}
                {(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => router.push('/dashboard/pettyCash/reset')}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Reset del Sistema - Solo Administradores"
                  >
                    <span>🧹</span>
                    <span>Reset</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Estado de sesión */}
        {currentSession && (
          <div className="mt-4 flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-sm">
              <span className="font-medium text-green-800">
                Sesión Activa: {currentSession.sessionNumber}
              </span>
              <span className="text-green-600 ml-2">
                ({sessionDuration(currentSession.openedAt)})
              </span>
            </div>
          </div>
        )}

        {!currentSession && (
          <div className="mt-4 flex items-center space-x-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <div className="text-sm">
              <span className="font-medium text-orange-800">
                Sin sesión activa
              </span>
              <span className="text-orange-600 ml-2">
                - Abrir sesión para comenzar
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Principal */}
      <PettyCashDashboard
        currentSession={currentSession}
        expenses={expenses}
        purchases={purchases}
        incomes={incomes}
        summary={summary}
        closureSummary={closureSummary}
        showExpenseForm={showExpenseForm}
        setShowExpenseForm={setShowExpenseForm}
        showPurchaseForm={showPurchaseForm}
        setShowPurchaseForm={setShowPurchaseForm}
        showClosureModal={showClosureModal}
        setShowClosureModal={setShowClosureModal}
        currentUser={currentUser}
        showSupplierPaymentForm={showSupplierPaymentForm}
        onOpenSupplierPaymentForm={handleOpenSupplierPaymentForm}
      />

      {/* No Session State */}
      {!currentSession && (
        <NoSessionCard onOpenSession={handleOpenModal} />
      )}

      {/* Open Session Modal */}
      <OpenSessionModal
        isOpen={isOpenSessionModalOpen}
        onClose={() => setIsOpenSessionModalOpen(false)}
        onSuccess={handleSessionCreated}
        currentUser={currentUser}
      />

      {/* Supplier Payment Form */}
      {showSupplierPaymentForm && currentSession && (
        <SupplierPaymentForm
          sessionId={currentSession.id}
          userId={currentUser?.id || ''}
          userName={currentUser?.name || 'Usuario'}
          onClose={() => setShowSupplierPaymentForm(false)}
        />
      )}
    </div>
  );
}

// Función auxiliar para calcular duración de sesión
function sessionDuration(openedAt: string | Date): string {
  const now = new Date();
  const opened = typeof openedAt === 'string' ? new Date(openedAt) : openedAt;
  const diff = now.getTime() - opened.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
}

// Component for when there's no active session
function NoSessionCard({ onOpenSession }: { onOpenSession: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="text-6xl mb-6">🏪</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          ¿Cómo funciona el Sistema Integrado?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🌅</div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Apertura</h3>
            <p className="text-sm text-gray-600">
              Inicia el día con la &quot;Apertura&quot; de sesión, registra tus gastos y compras,
              y finaliza con el &quot;Cierre&quot; automático.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Caja Chica</h3>
            <p className="text-sm text-gray-600">
              Gestiona gastos menores y compras sin límites de monto
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🛒</div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Ventas</h3>
            <p className="text-sm text-gray-600">
              Las ventas se registran automáticamente y se incluyen en el cierre
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Cierre</h3>
            <p className="text-sm text-gray-600">
              Concilia automáticamente efectivo, ventas y gastos del día
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-yellow-600 text-2xl">💡</div>
            <h3 className="text-lg font-semibold text-yellow-800">
              Características Principales
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-yellow-700">
              ✅ <strong>Sin límites de monto:</strong> Gastos y compras sin restricciones
            </div>
            <div className="text-yellow-700">
              ✅ <strong>Aprobación automática:</strong> Todas las transacciones se procesan inmediatamente
            </div>
            <div className="text-yellow-700">
              ✅ <strong>Integración con inventario:</strong> Las compras actualizan stock automáticamente
            </div>
            <div className="text-yellow-700">
              ✅ <strong>Cierre automático:</strong> Cálculo preciso sin tolerancias restrictivas
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Para comenzar a usar el sistema:
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">
              1. Haz clic en &quot;Abrir Nueva Sesión&quot; para iniciar
            </p>
            <p className="text-blue-700 text-sm mt-2">
              Una vez abierta la sesión, podrás registrar gastos, realizar compras y gestionar 
              el cierre de caja de manera integrada y automática.
            </p>
          </div>
          
          <button
            onClick={() => {
              onOpenSession();
            }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Abrir Nueva Sesión
          </button>
        </div>
      </div>
    </div>
  );
} 