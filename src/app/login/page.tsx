'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Iniciando login con API route:', { username: formData.username });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Error HTTP:', response.status, response.statusText);
        try {
          const errBody = await response.json();
          const message = errBody?.message || errBody?.error || `${response.status} ${response.statusText}`;
          setError(message);
        } catch {
          setError(`Error del servidor: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const result = await response.json();
      console.log('📋 Resultado del login:', result);

      if (!result) {
        console.error('❌ No se recibió respuesta del servidor');
        setError('Error: No se recibió respuesta del servidor. Revisa la consola para más detalles.');
        return;
      }

      if (result.success) {
        console.log('✅ Login exitoso, hidratando sesión de cliente...');

        try {
          if (result.session?.access_token && result.session?.refresh_token) {
            const supabase = createClient();
            await supabase.auth.setSession({
              access_token: result.session.access_token,
              refresh_token: result.session.refresh_token,
            });
          }
        } catch (setErr) {
          console.warn('No se pudo hidratar la sesión del cliente:', setErr);
        }

        console.log('➡️ Redirigiendo a dashboard...');
        router.push('/dashboard');
        router.refresh();
      } else {
        console.error('❌ Login fallido:', result.message);
        setError(result.message || 'Error en el login');
      }
    } catch (error) {
      console.error('💥 Error capturado:', error);
      
      if (error.name === 'AbortError') {
        setError('Error: La petición tardó demasiado. Intenta de nuevo.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Error: No se pudo conectar con el servidor. Verifica tu conexión.');
      } else {
        setError(`Error interno del servidor: ${error.message || error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y Título */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <div className="text-3xl font-bold text-indigo-600">A</div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TC Constructor</h1>
          <p className="text-indigo-200">Sistema de Gestión Empresarial</p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Iniciar Sesión</h2>
            <p className="text-gray-600 text-center mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-500 mr-3">⚠️</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario o Correo
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Ingresa tu usuario o correo"
                disabled={loading}
                suppressHydrationWarning
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Ingresa tu contraseña"
                disabled={loading}
                suppressHydrationWarning
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-indigo-200 text-sm">
          <p>© 2024 TC Constructor. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
} 