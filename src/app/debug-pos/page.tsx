'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPOSPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnosis = async () => {
    setLoading(true)
    try {
      // Ejecutar diagnóstico
      const response = await fetch('/api/debug-pos', {
        method: 'POST',
      })
      const result = await response.json()
      setDebugInfo(result)
    } catch (error) {
      console.error('Error en diagnóstico:', error)
      setDebugInfo({ error: 'Error ejecutando diagnóstico' })
    } finally {
      setLoading(false)
    }
  }

  const syncProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sync-pos-products', {
        method: 'POST',
      })
      const result = await response.json()
      setDebugInfo(prev => ({ ...prev, syncResult: result }))
    } catch (error) {
      console.error('Error en sincronización:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">🔍 Diagnóstico del Sistema POS</h1>
      
      <div className="space-y-4 mb-8">
        <Button onClick={runDiagnosis} disabled={loading}>
          {loading ? 'Ejecutando diagnóstico...' : 'Ejecutar Diagnóstico'}
        </Button>
        
        <Button onClick={syncProducts} disabled={loading} variant="outline">
          Sincronizar Productos POS
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {debugInfo.data?.enabledProducts || 0}
                  </div>
                  <div className="text-sm text-blue-600">Productos habilitados para POS</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {debugInfo.data?.posProducts || 0}
                  </div>
                  <div className="text-sm text-green-600">Productos en POSProduct</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {debugInfo.data?.syncedProducts || 0}
                  </div>
                  <div className="text-sm text-purple-600">Productos sincronizados</div>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {debugInfo.data?.categories || 0}
                  </div>
                  <div className="text-sm text-orange-600">Categorías POS</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {debugInfo.data?.enabledProductsList && (
            <Card>
              <CardHeader>
                <CardTitle>✅ Productos Habilitados para POS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.data.enabledProductsList.map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span><strong>ID {product.id}:</strong> {product.name}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        POS Habilitado
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {debugInfo.data?.posProductsList && (
            <Card>
              <CardHeader>
                <CardTitle>📦 Productos en POSProduct</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.data.posProductsList.map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span><strong>ID {product.id}:</strong> {product.name}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        Product ID: {product.productId || 'Sin vincular'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {debugInfo.syncResult && (
            <Card>
              <CardHeader>
                <CardTitle>🔄 Resultado de Sincronización</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(debugInfo.syncResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>🔍 Información Completa de Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 