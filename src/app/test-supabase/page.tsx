import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic'

export default async function TestSupabasePage() {
  let connectionStatus = 'Probando...';
  let errorMessage = '';
  let roomsCount = 0;

  try {
    const supabase = await getSupabaseServerClient();
    
    // Probar conexión básica
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('count')
      .limit(1);

    if (error) {
      connectionStatus = '❌ Error de conexión';
      errorMessage = error.message;
    } else {
      connectionStatus = '✅ Conexión exitosa';
      
      // Obtener conteo de habitaciones
      const { count } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });
      
      roomsCount = count || 0;
    }
  } catch (error) {
    connectionStatus = '❌ Error crítico';
    errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Prueba de Conexión Supabase</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Estado de Conexión</h2>
            <p className={`text-lg ${connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus}
            </p>
          </div>

          {errorMessage && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Error Detallado</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <pre className="text-red-800 text-sm whitespace-pre-wrap">{errorMessage}</pre>
              </div>
            </div>
          )}

          {roomsCount > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Información de Base de Datos</h3>
              <p className="text-gray-700">Habitaciones encontradas: <span className="font-semibold">{roomsCount}</span></p>
            </div>
          )}

          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-2">Variables de Entorno</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span> 
                <span className="ml-2 text-gray-600">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span> 
                <span className="ml-2 text-gray-600">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada'}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">SUPABASE_SERVICE_ROLE_KEY:</span> 
                <span className="ml-2 text-gray-600">
                  {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No configurada'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 