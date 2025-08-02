import React from 'react';
import { 
  getCurrentCashSession, 
  getPettyCashExpenses, 
  getPettyCashPurchases, 
  getPettyCashSummary 
} from '@/actions/configuration/petty-cash-actions';
import { getPettyCashIncomes } from '@/actions/configuration/petty-cash-income-actions';
import { getCashClosureSummary } from '@/actions/configuration/cash-closure-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import ClientWrapper from './ClientWrapper';
import NoSessionInterface from '@/components/petty-cash/NoSessionInterface';
import { redirect } from 'next/navigation';

const MOCK_CASH_REGISTER_ID = 1; // En un proyecto real, esto se obtendría del contexto

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function PettyCashPage() {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }

    // Verificar si el usuario tiene permisos de cajero
    if (!currentUser.isCashier && currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
      throw new Error('No tienes permisos para acceder a esta sección');
    }

    // Obtener la sesión actual de caja
    const currentSession = await getCurrentCashSession(MOCK_CASH_REGISTER_ID);
    
    let expenses: any[] = [];
    let purchases: any[] = [];
    let incomes: any[] = [];
    let summary = {
      totalExpenses: 0,
      totalPurchases: 0,
      totalTransactions: 0,
      pendingTransactions: 0,
      totalSpent: 0,
    };
    let closureSummary = null;

    if (currentSession) {
      // Obtener datos de la sesión activa
      const [expensesData, purchasesData, incomesResult, summaryData, closureSummaryData] = await Promise.all([
        getPettyCashExpenses(currentSession.id),
        getPettyCashPurchases(currentSession.id),
        getPettyCashIncomes(currentSession.id),
        getPettyCashSummary(currentSession.id),
        getCashClosureSummary(currentSession.id)
      ]);
      
      // Asignar los datos correctamente
      expenses = expensesData;
      purchases = purchasesData;
      incomes = incomesResult.success ? incomesResult.data : [];
      summary = summaryData;
      closureSummary = closureSummaryData;
      
      console.log('🔍 INGRESOS OBTENIDOS:', {
        success: incomesResult.success,
        count: incomes.length,
        data: incomes
      });
    }

    // Si no hay sesión activa, mostrar interfaz para crear una
    if (!currentSession) {
      return <NoSessionInterface currentUser={currentUser} />;
    }

    return (
      <ClientWrapper
        currentSession={currentSession}
        expenses={expenses}
        purchases={purchases}
        incomes={incomes}
        summary={summary}
        closureSummary={closureSummary}
        currentUser={currentUser}
      />
    );
  } catch (error) {
    console.error('Error loading petty cash page:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error al cargar el sistema
            </h2>
            <p className="text-red-600">
              No se pudieron cargar los datos de caja chica. Por favor, intenta de nuevo.
            </p>
          </div>
        </div>
      </div>
    );
  }
}