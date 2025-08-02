'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CashSessionData } from '@/actions/configuration/petty-cash-actions';
import EditSessionModal from './EditSessionModal';
import DeleteSessionModal from './DeleteSessionModal';
import ForceDeleteSessionModal from './ForceDeleteSessionModal';

interface SessionActionsProps {
  session: CashSessionData;
  currentUser: any;
}

export default function SessionActions({ session, currentUser }: SessionActionsProps) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [forceDeleteModalOpen, setForceDeleteModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isAdmin = currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR';
  const canEdit = isAdmin && session.status !== 'closed';
  const canDelete = isAdmin && session.status === 'open';
  const canForceDelete = isAdmin; // Solo admins pueden hacer eliminación fuerte
  const canClose = isAdmin && session.status === 'open';

  const handleEditSuccess = () => {
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    router.refresh();
  };

  const handleForceDeleteSuccess = () => {
    router.refresh();
  };

  const handleCloseSession = async () => {
    if (!confirm('¿Estás seguro de que quieres cerrar esta sesión?\n\nEsto la cerrará con el monto inicial sin diferencias.')) {
      return;
    }

    setIsClosing(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', session.id.toString());
      formData.append('actualCash', session.openingAmount.toString());
      formData.append('notes', `Sesión cerrada administrativamente desde historial. Fecha: ${new Date().toLocaleString()}`);

      const { createCashClosure } = await import('@/actions/configuration/cash-closure-actions');
      const result = await createCashClosure(formData);

      if (result.success) {
        alert('✅ Sesión cerrada exitosamente');
        router.refresh();
      } else {
        alert(`❌ Error al cerrar sesión: ${result.error}`);
      }
    } catch (error) {
      console.error('Error closing session:', error);
      alert('❌ Error inesperado al cerrar la sesión');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={() => router.push(`/dashboard/pettyCash/sessions/${session.id}`)}
          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
        >
          👁️ Ver
        </button>
        
        {canEdit && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            ✏️ Editar
          </button>
        )}

        {canClose && (
          <button
            onClick={handleCloseSession}
            disabled={isClosing}
            className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isClosing ? '⏳ Cerrando...' : '🔒 Cerrar'}
          </button>
        )}
        
        {canDelete && (
          <button
            onClick={() => {
              alert('⚠️ ADVERTENCIA:\n\nSolo debe eliminarse sesiones que NO tengan transacciones.\n\nSi la sesión tiene gastos o compras, usa "Eliminación Fuerte" en su lugar.');
              setDeleteModalOpen(true);
            }}
            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            🗑️ Eliminar
          </button>
        )}

        {canForceDelete && (
          <button
            onClick={() => setForceDeleteModalOpen(true)}
            className="text-red-800 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors border border-red-300"
          >
            💥 Eliminación Fuerte
          </button>
        )}

        {/* Debug info - solo mostrar en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 ml-2">
            Role: {currentUser?.role} | Admin: {isAdmin ? 'Yes' : 'No'} | Status: {session.status}
          </div>
        )}
      </div>

      {/* Modales */}
      <EditSessionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        session={session}
      />
      
      <DeleteSessionModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        session={session}
      />

      <ForceDeleteSessionModal
        isOpen={forceDeleteModalOpen}
        onClose={() => setForceDeleteModalOpen(false)}
        onSuccess={handleForceDeleteSuccess}
        session={session}
      />
    </>
  );
} 