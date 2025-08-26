'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('🏠 HomePage: Verificando autenticación...');
        const user = await getCurrentUser();
        
        if (user) {
          console.log('✅ HomePage: Usuario autenticado, redirigiendo a dashboard');
          router.push('/dashboard');
        } else {
          console.log('❌ HomePage: Usuario no autenticado, redirigiendo a login');
          router.push('/login');
        }
      } catch (error) {
        console.error('💥 HomePage Error:', error);
        // En caso de error, mostrar página de inicio
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FF7A00]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0B3555] mx-auto"></div>
          <p className="mt-4 text-[#0B3555]">Cargando Todo Constructor...</p>
          <p className="mt-2 text-sm text-[#0B3555]/70">Inicializando aplicación</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <h1 className="text-2xl font-bold text-red-900 mb-4">Error</h1>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF7A00]/10 to-[#0B3555]/10 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#0B3555]/10">
          <div className="flex flex-col items-center gap-3 mb-4">
            <img
              src="/images/logo-tc.png"
              onError={(e: any) => { e.currentTarget.src = '/next.svg'; }}
              alt="TC Constructor"
              className="h-16 w-16 rounded-full ring-2 ring-[#0B3555]/20"
            />
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0B3555]">
              TC Constructor
            </h1>
          </div>
          <p className="text-lg text-[#0B3555]/80 mb-8">
            Sistema de Gestión de Ferretería
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <a 
              href="/login" 
              className="block bg-[#0B3555] hover:bg-[#0A2C47] text-white font-medium py-4 px-6 rounded-lg transition-colors transform hover:scale-105"
            >
              🔐 Iniciar Sesión
            </a>
            <a 
              href="/dashboard" 
              className="block bg-[#FF7A00] hover:bg-[#E56E00] text-white font-medium py-4 px-6 rounded-lg transition-colors transform hover:scale-105"
            >
              📊 Dashboard
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <a 
              href="/test-simple" 
              className="block bg-[#0B3555] hover:bg-[#0A2C47] text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              🧪 Página de Prueba
            </a>
            <a 
              href="/api/test" 
              className="block bg-[#FF7A00] hover:bg-[#E56E00] text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              🔧 API Test
            </a>
          </div>
          
          <div className="bg-[#0B3555]/5 rounded-lg p-4 text-sm text-[#0B3555]/80">
            <p>✅ Aplicación funcionando correctamente</p>
            <p>🕒 {new Date().toLocaleString()}</p>
            <p>🌐 Deployment exitoso en Vercel</p>
          </div>
        </div>
      </div>
    </div>
  );
} 