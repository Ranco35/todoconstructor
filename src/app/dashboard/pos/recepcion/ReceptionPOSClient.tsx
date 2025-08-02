'use client';

import React, { useState } from 'react';
import ReceptionPOS from '@/components/pos/ReceptionPOS';
import PettyCashDashboard from '@/components/petty-cash/PettyCashDashboard';
import { ArrowLeft } from 'lucide-react';

interface ReceptionPOSClientProps {
  sessionId: number;
  cashRegister: any;
  currentUser: any;
}

export default function ReceptionPOSClient({ 
  sessionId, 
  cashRegister, 
  currentUser 
}: ReceptionPOSClientProps) {
  const [showPettyCash, setShowPettyCash] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Simular estado de conexión
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showPettyCash) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header de navegación */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPettyCash(false)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver al POS</span>
                </button>
                <div className="h-6 border-l border-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-900">
                  Caja Chica - {cashRegister?.name || 'Recepción'}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Conectado' : 'Sin conexión'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard de Caja Chica */}
        <div className="p-6">
          <PettyCashDashboard />
        </div>
      </div>
    );
  }

  return (
    <ReceptionPOS
      sessionId={sessionId}
      cashRegisterName={cashRegister?.name || 'Caja Recepción'}
      currentUser={currentUser}
      isOnline={isOnline}
      onOpenPettyCash={() => setShowPettyCash(true)}
    />
  );
} 