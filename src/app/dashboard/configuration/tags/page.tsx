'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Users, Building2, Settings, Zap, AlertTriangle } from 'lucide-react';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import ClientTagsAdmin from '@/components/tags/ClientTagsAdmin';
import SupplierTagsAdmin from '@/components/tags/SupplierTagsAdmin';
import Head from '@/components/transversal/seccions/Head';

export default function TagsAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('clientes');

  // Cargar usuario actual
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Verificar si el usuario tiene permisos administrativos
  const hasAdminAccess = user?.role === 'SUPER_USER' || user?.role === 'ADMINISTRADOR';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Head title="Administración de Etiquetas" />
        {hasAdminAccess ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Etiquetas</h1>
                <p className="text-slate-600">Administra etiquetas para categorizar clientes y proveedores</p>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Settings size={20} />
                <span className="text-sm">Configuración</span>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setSeccionActiva('clientes')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  seccionActiva === 'clientes'
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-blue-300'
                }`}
              >
                <Users size={18} />
                Etiquetas de Clientes
                {seccionActiva === 'clientes' && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
              
              <button
                onClick={() => setSeccionActiva('proveedores')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  seccionActiva === 'proveedores'
                    ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-purple-300'
                }`}
              >
                <Building2 size={18} />
                Etiquetas de Proveedores
                {seccionActiva === 'proveedores' && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>

              <button
                disabled
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                title="Próximamente: Reglas automáticas de asignación"
              >
                <Zap size={18} />
                Reglas Automáticas
                <span className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded-full">Próximamente</span>
              </button>
            </div>

            <div className="relative">
              <div className={`transition-all duration-300 ease-in-out ${
                seccionActiva === 'clientes' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute inset-0 pointer-events-none'
              }`}>
                {seccionActiva === 'clientes' && <ClientTagsAdmin />}
              </div>

              <div className={`transition-all duration-300 ease-in-out ${
                seccionActiva === 'proveedores' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'
              }`}>
                {seccionActiva === 'proveedores' && <SupplierTagsAdmin />}
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Etiquetas de Clientes</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Categoriza clientes por tipo, región, preferencias</li>
                      <li>• Facilita la segmentación para campañas de marketing</li>
                      <li>• Mejora la gestión y seguimiento de relaciones</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-2">Etiquetas de Proveedores</h3>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Organiza proveedores por especialidad, ubicación</li>
                      <li>• Facilita la búsqueda y selección de proveedores</li>
                      <li>• Optimiza la gestión de la cadena de suministro</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <span className="text-6xl mb-4 text-red-400">⛔</span>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">No tienes autorización</h2>
            <p className="text-gray-600 mb-4">Esta sección solo está disponible para administradores.</p>
            <pre className="bg-gray-100 p-4 rounded text-xs text-left max-w-xl overflow-x-auto">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 