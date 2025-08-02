import React from 'react';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getCashSessions, getCashSessionStats } from '@/actions/configuration/petty-cash-actions';
import { redirect } from 'next/navigation';
import SessionListClient from './SessionListClient';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; startDate?: string; endDate?: string; page?: string }>;
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

    // Obtener searchParams
    const params = await searchParams;

    // Preparar filtros
    const filters: any = {};
    if (params.status) {
      filters.status = params.status as 'OPEN' | 'CLOSED' | 'SUSPENDED';
    }
    if (params.startDate) {
      filters.startDate = new Date(params.startDate);
    }
    if (params.endDate) {
      filters.endDate = new Date(params.endDate);
    }

    // Obtener datos
    const [sessions, stats] = await Promise.all([
      getCashSessions(filters),
      getCashSessionStats(),
    ]);

    return (
      <SessionListClient 
        sessions={sessions} 
        stats={stats}
        currentUser={currentUser}
        filters={params}
      />
    );
  } catch (error) {
    console.error('Error in SessionsPage:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar sesiones</h3>
            <p className="text-gray-600 mb-6">No se pudieron cargar las sesiones de caja</p>
          </div>
        </div>
      </div>
    );
  }
} 