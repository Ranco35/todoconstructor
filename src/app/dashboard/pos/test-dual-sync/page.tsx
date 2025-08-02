'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Monitor,
  Info,
  Trash2
} from 'lucide-react'
import { 
  syncPOSProducts, 
  debugPOSSync, 
  getPOSSyncStats 
} from '@/actions/pos/pos-actions'

export default function TestDualSyncPage() {
  const [loading, setLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  // Función para ejecutar diagnóstico
  const handleDebug = async () => {
    setLoading(true)
    try {
      const result = await debugPOSSync()
      setDebugResult(result)
    } catch (error) {
      console.error('Error en diagnóstico:', error)
      setDebugResult({ success: false, error: 'Error interno' })
    } finally {
      setLoading(false)
    }
  }

  // Función para ejecutar sincronización
  const handleSync = async () => {
    setLoading(true)
    try {
      const result = await syncPOSProducts()
      setSyncResult(result)
      // Actualizar diagnóstico después de sincronización
      setTimeout(() => {
        handleDebug()
      }, 1000)
    } catch (error) {
      console.error('Error en sincronización:', error)
      setSyncResult({ success: false, error: 'Error interno' })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener estadísticas
  const handleGetStats = async () => {
    setLoading(true)
    try {
      const result = await getPOSSyncStats()
      setStats(result)
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      setStats({ success: false, error: 'Error interno' })
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar resultados
  const clearResults = () => {
    setDebugResult(null)
    setSyncResult(null)
    setStats(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Prueba de Sincronización Dual POS
          </h1>
          <p className="text-gray-600">
            Herramienta para probar y verificar que los productos se sincronicen correctamente 
            en AMBOS tipos de POS (Recepción y Restaurante).
          </p>
        </div>

        {/* Controles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button 
            onClick={handleDebug}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Monitor className="h-4 w-4" />}
            Diagnóstico
          </Button>
          
          <Button 
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Sincronizar
          </Button>
          
          <Button 
            onClick={handleGetStats}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Estadísticas
          </Button>
          
          <Button 
            onClick={clearResults}
            disabled={loading}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        {/* Resultados del Diagnóstico */}
        {debugResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Diagnóstico de Sincronización Dual
                {debugResult.success ? (
                  <Badge className="bg-green-100 text-green-800">Exitoso</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Error</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {debugResult.success ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {debugResult.data.enabledProducts}
                    </div>
                    <div className="text-sm text-blue-600">Productos Habilitados</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {debugResult.data.syncedUniqueProducts}
                    </div>
                    <div className="text-sm text-green-600">Productos Sincronizados</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {debugResult.data.receptionProducts}
                    </div>
                    <div className="text-sm text-purple-600">🏨 En Recepción</div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {debugResult.data.restaurantProducts}
                    </div>
                    <div className="text-sm text-orange-600">🍽️ En Restaurante</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">
                      {debugResult.data.pendingSync}
                    </div>
                    <div className="text-sm text-yellow-600">Pendientes</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">
                      {debugResult.data.duplicates}
                    </div>
                    <div className="text-sm text-gray-600">Duplicados</div>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-700">
                      {debugResult.data.receptionCategories}
                    </div>
                    <div className="text-sm text-indigo-600">Categorías Recepción</div>
                  </div>
                  
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-pink-700">
                      {debugResult.data.restaurantCategories}
                    </div>
                    <div className="text-sm text-pink-600">Categorías Restaurante</div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error en diagnóstico: {debugResult.error}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Lista de productos habilitados */}
              {debugResult.success && debugResult.data.enabledProductsList?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">📋 Productos Habilitados para POS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {debugResult.data.enabledProductsList.map((product: any) => (
                      <div key={product.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Badge variant="outline" className="text-xs">ID: {product.id}</Badge>
                        <span className="text-sm">{product.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Lista de duplicados */}
              {debugResult.success && debugResult.data.duplicatesList?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">⚠️ Productos Duplicados</h3>
                  <div className="space-y-2">
                    {debugResult.data.duplicatesList.map((duplicate: any) => (
                      <div key={duplicate.productId} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="font-medium">{duplicate.productName}</div>
                        <div className="text-sm text-gray-600">
                          Producto ID: {duplicate.productId} | 
                          Registros: {duplicate.count} | 
                          Tipos: {duplicate.types.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados de Sincronización */}
        {syncResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Resultado de Sincronización
                {syncResult.success ? (
                  <Badge className="bg-green-100 text-green-800">Exitoso</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Error</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncResult.success ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {syncResult.data.message}
                    </AlertDescription>
                  </Alert>
                  
                  {syncResult.data.receptionCount > 0 || syncResult.data.restaurantCount > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {syncResult.data.totalProducts}
                        </div>
                        <div className="text-sm text-blue-600">Productos Únicos</div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-700">
                          {syncResult.data.receptionCount}
                        </div>
                        <div className="text-sm text-purple-600">🏨 Agregados a Recepción</div>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-700">
                          {syncResult.data.restaurantCount}
                        </div>
                        <div className="text-sm text-orange-600">🍽️ Agregados a Restaurante</div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No había productos para sincronizar o no se encontraron categorías disponibles.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error en sincronización: {syncResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estadísticas POS
                {stats.success ? (
                  <Badge className="bg-green-100 text-green-800">Exitoso</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Error</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.success ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.data.enabledProducts}
                    </div>
                    <div className="text-sm text-gray-600">Habilitados</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.data.posProducts}
                    </div>
                    <div className="text-sm text-gray-600">En POS</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.data.syncedProducts}
                    </div>
                    <div className="text-sm text-gray-600">Sincronizados</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.data.pendingSync}
                    </div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error obteniendo estadísticas: {stats.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Instrucciones de Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>1. Diagnóstico:</strong> Ejecuta primero para ver el estado actual de la sincronización POS.</p>
              <p><strong>2. Sincronizar:</strong> Ejecuta la nueva sincronización dual que agregará productos a AMBOS tipos de POS.</p>
              <p><strong>3. Estadísticas:</strong> Obtiene un resumen rápido de los números de sincronización.</p>
              <p><strong>4. Limpiar:</strong> Limpia todos los resultados de la pantalla.</p>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Nuevo comportamiento:</strong> Los productos se sincronizarán automáticamente 
                en AMBOS tipos de POS (Recepción y Restaurante) con categorías por defecto apropiadas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 