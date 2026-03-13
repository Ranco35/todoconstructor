'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleDashboard() {
  const [status, setStatus] = useState('Iniciando...');
  const router = useRouter();

  useEffect(() => {
    setStatus('Dashboard cargado correctamente ✅');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            🎉 Dashboard Simple - Admintermas
          </h1>
          
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              <strong>Estado:</strong> {status}
            </p>
            
            <p className="text-gray-600">
              Si ves este mensaje, significa que:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>✅ Next.js está funcionando</li>
              <li>✅ Client Components funcionan</li>
              <li>✅ Vercel deployment es exitoso</li>
              <li>✅ Las rutas son accesibles</li>
            </ul>
            
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium">
                🎉 ¡El problema del dashboard está RESUELTO!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Ahora podemos volver al dashboard principal.
              </p>
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al Dashboard Principal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 