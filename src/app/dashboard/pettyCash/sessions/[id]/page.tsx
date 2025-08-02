import React from 'react';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getCashSessionById } from '@/actions/configuration/petty-cash-actions';
import { getPettyCashExpenses, getPettyCashPurchases, getPettyCashSummary } from '@/actions/configuration/petty-cash-actions';
import { getCashClosureSummary } from '@/actions/configuration/cash-closure-actions';
import { redirect } from 'next/navigation';
import SessionDetailsClient from './SessionDetailsClient';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

    const { id } = await params;
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      throw new Error('ID de sesión inválido');
    }

    // Obtener datos de la sesión
    const session = await getCashSessionById(sessionId);
    if (!session) {
      throw new Error('Sesión no encontrada');
    }

    // Obtener datos relacionados
    const [expenses, purchases, summary, closureSummary] = await Promise.all([
      getPettyCashExpenses(sessionId),
      getPettyCashPurchases(sessionId),
      getPettyCashSummary(sessionId),
      getCashClosureSummary(sessionId)
    ]);

    return (
      <SessionDetailsClient 
        session={session}
        expenses={expenses}
        purchases={purchases}
        summary={summary}
        closureSummary={closureSummary}
        currentUser={currentUser}
      />
    );
  } catch (error) {
    console.error('Error in SessionDetailsPage:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar sesión</h3>
            <p className="text-gray-600 mb-6">No se pudo cargar la información de la sesión</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }
} 