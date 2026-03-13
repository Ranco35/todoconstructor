'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

interface CleanupResult {
  success: boolean
  message: string
  deletedCount: number
  deletedProducts?: Array<{
    id: number
    name: string
    sku: string
  }>
}

export default function CleanExamplesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCleanup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/products/clean-examples', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (error) {
      setError('Error de conexión: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-600" />
            🧹 Limpiar Productos de Ejemplo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Descripción */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Información Importante</h3>
            <p className="text-yellow-700 text-sm">
              Esta acción eliminará permanentemente todos los productos de ejemplo de la base de datos. 
              Los productos que contengan palabras como "test", "ejemplo", "simulado", "demo", etc. serán eliminados.
            </p>
          </div>

          {/* Patrones de búsqueda */}
          <div>
            <h3 className="font-semibold mb-2">🔍 Patrones de Búsqueda:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'producto test',
                'producto simulado', 
                'servicio simulado',
                'ejemplo',
                'test',
                'sample',
                'demo',
                'simulado'
              ].map((pattern) => (
                <Badge key={pattern} variant="outline" className="text-xs">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex justify-center">
            <Button 
              onClick={handleCleanup}
              disabled={loading}
              variant="destructive"
              size="lg"
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Limpiando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Eliminar Productos de Ejemplo
                </>
              )}
            </Button>
          </div>

          {/* Resultado */}
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-2">{result.message}</div>
                {result.deletedCount > 0 && (
                  <div className="mt-3">
                    <div className="font-medium">Productos eliminados ({result.deletedCount}):</div>
                    <div className="mt-2 space-y-1">
                      {result.deletedProducts?.map((product) => (
                        <div key={product.id} className="text-sm bg-white p-2 rounded border">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-gray-600">SKU: {product.sku}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Después de la limpieza:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• El sistema solo procesará productos reales</li>
              <li>• Mejorará la precisión de búsqueda de productos</li>
              <li>• Eliminará confusión con datos de ejemplo</li>
              <li>• Optimizará el rendimiento del sistema</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  )
} 