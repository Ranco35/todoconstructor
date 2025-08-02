'use client';

import React, { useState } from 'react';
import OpenSessionModal from './OpenSessionModal';
import HistoricalCashManagementModal from './HistoricalCashManagementModal';

interface NoSessionInterfaceProps {
  currentUser: {
    id?: string;
    name: string;
    role: string;
  };
}

export default function NoSessionInterface({ currentUser }: NoSessionInterfaceProps) {
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);

  const handleOpenSession = () => {
    console.log('🔓 Botón Abrir Sesión clickeado - abriendo modal');
    console.log('🔍 Estado actual del modal:', isOpenSessionModalOpen);
    setIsOpenSessionModalOpen(true);
    console.log('✅ Modal establecido a true');
  };

  const handleViewHistory = () => {
    console.log('📋 Navegando al historial de sesiones...');
    window.location.href = '/dashboard/pettyCash/sessions';
  };

  const handleHistoricalCash = () => {
    console.log('📚 Abriendo modal de cajas históricas...');
    setIsHistoricalModalOpen(true);
  };

  const handleSessionCreated = () => {
    console.log('✅ Sesión creada exitosamente - recargando página');
    window.location.reload(); // Recargar para mostrar la nueva sesión
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-blue-500 text-6xl mb-6">💰</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Sistema de Caja Chica
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="text-yellow-600 text-2xl mb-3">⚠️</div>
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              No hay sesión de caja activa
            </h2>
            <p className="text-yellow-700 mb-4">
              Para comenzar a usar el sistema de caja chica, necesitas abrir una sesión de caja.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-blue-500 text-2xl mb-3">🚀</div>
              <h3 className="font-semibold text-blue-800 mb-2">Abrir Sesión Nueva</h3>
              <p className="text-blue-600 text-sm">
                Crea una nueva sesión de caja para el día de hoy
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-green-500 text-2xl mb-3">📊</div>
              <h3 className="font-semibold text-green-800 mb-2">Historial</h3>
              <p className="text-green-600 text-sm">
                Consulta sesiones anteriores y reportes
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-purple-500 text-2xl mb-3">📚</div>
              <h3 className="font-semibold text-purple-800 mb-2">Cajas Históricas</h3>
              <p className="text-purple-600 text-sm">
                Registra movimientos de días anteriores
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleOpenSession}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              🔓 Abrir Nueva Sesión
            </button>
            <button 
              onClick={handleViewHistory}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              📚 Ver Historial
            </button>
            <button 
              onClick={handleHistoricalCash}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              📚 Cajas Históricas
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>Sistema desarrollado para gestión de caja chica</p>
            <p>Usuario: {currentUser.name} • Rol: {currentUser.role}</p>
          </div>
        </div>

        {/* Modal para abrir sesión */}
        <OpenSessionModal
          isOpen={isOpenSessionModalOpen}
          onClose={() => setIsOpenSessionModalOpen(false)}
          onSuccess={handleSessionCreated}
          userId={currentUser.id}
          currentUser={currentUser}
        />

        {/* Modal para cajas históricas */}
        <HistoricalCashManagementModal
          isOpen={isHistoricalModalOpen}
          onClose={() => setIsHistoricalModalOpen(false)}
          currentUser={{
            id: parseInt(currentUser.id || '0'),
            username: currentUser.name,
            email: '',
            firstName: currentUser.name,
            lastName: '',
            role: currentUser.role,
            department: '',
            isCashier: true,
            isActive: true,
            lastLogin: null
          }}
        />
      </div>
    </div>
  );
} 