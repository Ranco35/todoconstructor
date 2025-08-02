'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';
import EditSessionModal from '@/components/petty-cash/EditSessionModal';
import DeleteSessionModal from '@/components/petty-cash/DeleteSessionModal';
import SessionActions from '@/components/petty-cash/SessionActions';
import HistoricalCashManagementModal from '@/components/petty-cash/HistoricalCashManagementModal';

interface SessionListClientProps {
  sessions: CashSessionData[];
  stats: {
    totalSessions: number;
    todaySessions: number;
    openSessions: number;
    closedSessions: number;
  };
  currentUser: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
    isCashier: boolean;
    isActive: boolean;
    lastLogin: Date | null;
  };
  filters: any;
}

export default function SessionListClient({ sessions, stats, currentUser }: SessionListClientProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingSession, setEditingSession] = useState<CashSessionData | null>(null);
  const [deletingSession, setDeletingSession] = useState<CashSessionData | null>(null);
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);

  const handleEditSuccess = () => {
    // Refresh the page
    window.location.reload();
  };

  const handleDeleteSuccess = () => {
    // Refresh the page
    window.location.reload();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Abierta' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: '🔒', label: 'Cerrada' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️', label: 'Suspendida' },
      // Compatibilidad con mayúsculas
      OPEN: { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Abierta' },
      CLOSED: { color: 'bg-gray-100 text-gray-800', icon: '🔒', label: 'Cerrada' },
      SUSPENDED: { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️', label: 'Suspendida' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.closed;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getDuration = (openedAt: Date, closedAt?: Date | null) => {
    const start = new Date(openedAt);
    const end = closedAt ? new Date(closedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (selectedStatus) params.set('status', selectedStatus);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    router.push(`/dashboard/pettyCash/sessions?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    router.push('/dashboard/pettyCash/sessions');
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📋 Historial de Sesiones
              </h1>
              <p className="text-gray-600">
                Gestiona y revisa todas las sesiones de caja chica
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistoricalModal(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>📚</span>
                <span>Cajas Históricas</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/pettyCash')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>←</span>
                <span>Volver a Caja Chica</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Sesiones</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalSessions}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Hoy</p>
                  <p className="text-2xl font-bold text-green-900">{stats.todaySessions}</p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Abiertas</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.openSessions}</p>
                </div>
                <div className="text-3xl">🟢</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cerradas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.closedSessions}</p>
                </div>
                <div className="text-3xl">🔒</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="OPEN">Abiertas</option>
                  <option value="CLOSED">Cerradas</option>
                  <option value="SUSPENDED">Suspendidas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleFilterChange}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🔍 Filtrar
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Sesiones */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sesión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cajero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apertura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cierre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Inicial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.sessionNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Caja: {session.CashRegister.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.User.name}</div>
                      <div className="text-sm text-gray-500">{session.User.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(session.openedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.closedAt ? formatDate(session.closedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getDuration(session.openedAt, session.closedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${session.openingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.closingAmount !== null && session.closingAmount !== undefined ? `$${session.closingAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <SessionActions session={session} currentUser={currentUser} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron sesiones
              </h3>
              <p className="text-gray-500">
                Intenta ajustar los filtros o crear una nueva sesión
              </p>
            </div>
          )}
        </div>

        {/* Modales */}
        {editingSession && (
          <EditSessionModal
            isOpen={true}
            onClose={() => {
              setEditingSession(null);
            }}
            onSuccess={handleEditSuccess}
            session={editingSession}
          />
        )}
        
        {deletingSession && (
          <DeleteSessionModal
            isOpen={true}
            onClose={() => {
              setDeletingSession(null);
            }}
            onSuccess={handleDeleteSuccess}
            session={deletingSession}
          />
        )}

        {/* Modal de Cajas Históricas */}
        <HistoricalCashManagementModal
          isOpen={showHistoricalModal}
          onClose={() => setShowHistoricalModal(false)}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
} 