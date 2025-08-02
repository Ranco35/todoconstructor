import { runWebsiteImagesSystemTest, simpleConnectivityTest, TestResult } from '@/actions/website/test-images'

export const dynamic = 'force-dynamic'

interface DebugResult {
  title: string
  success: boolean
  error?: string
  data?: any
}

async function runDebugTests(): Promise<DebugResult[]> {
  const results: DebugResult[] = []

  // Test simple de conectividad
  console.log('🔌 Running simple connectivity test...')
  const simpleTest = await simpleConnectivityTest()
  results.push({
    title: 'Conectividad Simple',
    success: simpleTest.success,
    error: simpleTest.error,
    data: simpleTest.data
  })

  // Test completo del sistema
  console.log('🧪 Running comprehensive system test...')
  try {
    const systemTests = await runWebsiteImagesSystemTest()
    
    systemTests.forEach(test => {
      results.push({
        title: test.test,
        success: test.success,
        error: test.error,
        data: test.data
      })
    })
  } catch (error) {
    results.push({
      title: 'Sistema Completo',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: { exception: JSON.stringify(error) }
    })
  }

  return results
}

function ResultCard({ result }: { result: DebugResult }) {
  return (
    <div className={`p-6 rounded-lg border-2 ${
      result.success 
        ? 'border-green-500 bg-green-50' 
        : 'border-red-500 bg-red-50'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-4 h-4 rounded-full ${
          result.success ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <h3 className="font-bold text-lg">{result.title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          result.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {result.success ? 'ÉXITO' : 'ERROR'}
        </span>
      </div>

      {result.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <h4 className="font-semibold text-red-800 mb-2">Error:</h4>
          <pre className="text-sm text-red-700 whitespace-pre-wrap">
            {result.error}
          </pre>
        </div>
      )}

      {result.data && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded">
          <h4 className="font-semibold text-gray-800 mb-2">Datos:</h4>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default async function WebsiteImagesDebugPage() {
  console.log('🚀 Starting website images debug page...')
  
  const results = await runDebugTests()
  const successCount = results.filter(r => r.success).length
  const totalTests = results.length

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔧 Debug: Sistema de Imágenes Website
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Esta página ejecuta pruebas exhaustivas del sistema de imágenes para diagnosticar problemas.
          </p>
        </div>
      </div>

      {/* Resumen de Resultados */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">📊 Resumen de Pruebas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">{totalTests}</div>
            <div className="text-sm text-gray-600">Pruebas Totales</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">Exitosas</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-red-600">{totalTests - successCount}</div>
            <div className="text-sm text-gray-600">Fallidas</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-white">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-4 h-4 rounded-full ${
              successCount === totalTests ? 'bg-green-500' : 
              successCount > 0 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-semibold">
              Estado General: {
                successCount === totalTests ? 'TODAS LAS PRUEBAS EXITOSAS ✅' :
                successCount > 0 ? 'PRUEBAS PARCIALMENTE EXITOSAS ⚠️' :
                'TODAS LAS PRUEBAS FALLARON ❌'
              }
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                successCount === totalTests ? 'bg-green-500' :
                successCount > 0 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(successCount / totalTests) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Resultados Detallados */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🔍 Resultados Detallados
        </h2>
        
        {results.map((result, index) => (
          <ResultCard key={index} result={result} />
        ))}
      </div>

      {/* Guía de Resolución */}
      <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-bold text-yellow-800 mb-4">
          💡 Guía de Resolución
        </h2>
        <div className="space-y-3 text-yellow-700">
          <div>
            <strong>🔌 Si falla "Conectividad Simple":</strong>
            <br />- Verificar variables de entorno SUPABASE_SERVICE_ROLE_KEY
            <br />- Verificar configuración de red/firewall
            <br />- Revisar logs del servidor Supabase
          </div>
          <div>
            <strong>🛡️ Si falla "Normal Client Connectivity (RLS)":</strong>
            <br />- Problema con políticas RLS
            <br />- Verificar que el usuario tenga permisos correctos
            <br />- Ejecutar las políticas RLS corregidas
          </div>
          <div>
            <strong>📊 Si falla "Table Structure Verification":</strong>
            <br />- La tabla website_images no existe
            <br />- Ejecutar migración: 20250115000020_create_website_images_table.sql
            <br />- Verificar que se aplicó correctamente
          </div>
          <div>
            <strong>📋 Si falla "Sample Data Verification":</strong>
            <br />- Tabla vacía (normal en instalación nueva)
            <br />- Insertar datos de ejemplo si es necesario
          </div>
        </div>
      </div>

      {/* Enlaces de Navegación */}
      <div className="mt-8 flex gap-4 justify-center">
        <a 
          href="/admin/website" 
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          ← Volver a Website Admin
        </a>
        <a 
          href="/admin/website/images" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir a Gestión de Imágenes
        </a>
      </div>
    </div>
  )
} 