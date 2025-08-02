'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, User, Users, Search, Database, Clock } from 'lucide-react'

export default function DebugPOSCustomerNames() {
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isCheckingLatest, setIsCheckingLatest] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [checkResult, setCheckResult] = useState<any>(null)
  const [latestResult, setLatestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixCustomerNames = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/pos/fix-customer-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error corrigiendo nombres de clientes')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckCustomerNames = async () => {
    setIsChecking(true)
    setError(null)
    setCheckResult(null)

    try {
      const response = await fetch('/api/pos/check-customer-names', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error revisando nombres de clientes')
      }

      setCheckResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsChecking(false)
    }
  }

  const handleCheckLatestSales = async () => {
    setIsCheckingLatest(true)
    setError(null)
    setLatestResult(null)

    try {
      const response = await fetch('/api/pos/check-latest-sales', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error revisando últimas ventas')
      }

      setLatestResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsCheckingLatest(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Debug: Nombres de Clientes POS</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Revisar Registros
            </CardTitle>
            <CardDescription>
              Revisa los registros actuales para ver cuáles tienen problemas de nombres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCheckCustomerNames} 
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Revisando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Revisar Registros
                </>
              )}
            </Button>

            {checkResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">Total Ventas</div>
                    <div className="text-2xl font-bold text-blue-900">{checkResult.data.statistics.totalVentas}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-red-800">Sin Nombre</div>
                    <div className="text-2xl font-bold text-red-900">
                      {checkResult.data.statistics.sinNombreNull + checkResult.data.statistics.sinNombreVacio + checkResult.data.statistics.clienteSinNombre}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Estadísticas Detalladas:</h4>
                  <div className="text-sm space-y-1">
                    <div>• Sin nombre (NULL): {checkResult.data.statistics.sinNombreNull}</div>
                    <div>• Sin nombre (vacío): {checkResult.data.statistics.sinNombreVacio}</div>
                    <div>• "Cliente sin nombre": {checkResult.data.statistics.clienteSinNombre}</div>
                    <div>• Con cliente asociado: {checkResult.data.statistics.conClienteAsociado}</div>
                    <div>• Sin cliente asociado: {checkResult.data.statistics.sinClienteAsociado}</div>
                  </div>
                </div>

                {checkResult.data.problematicSales.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Ventas con Problemas:</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {checkResult.data.problematicSales.map((sale: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                          <Badge variant="outline">{sale.saleNumber}</Badge>
                          <span className="font-medium">{sale.customerName || 'NULL'}</span>
                          {sale.clientId && (
                            <Badge variant="secondary">ID: {sale.clientId}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Últimas Ventas
            </CardTitle>
            <CardDescription>
              Revisa las últimas ventas y el cliente recién creado "119224357"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCheckLatestSales} 
              disabled={isCheckingLatest}
              className="flex items-center gap-2"
            >
              {isCheckingLatest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Revisando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Revisar Últimas Ventas
                </>
              )}
            </Button>

            {latestResult && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Últimas 10 Ventas:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {latestResult.data.latestSales.map((sale: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        <Badge variant="outline">{sale.saleNumber}</Badge>
                        <span className="font-medium">{sale.customerName || 'NULL'}</span>
                        {sale.clientId && (
                          <Badge variant="secondary">ID: {sale.clientId}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {latestResult.data.recentClient.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Cliente Recién Creado:</h4>
                    <div className="space-y-1">
                      {latestResult.data.recentClient.map((client: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Badge variant="outline">ID: {client.id}</Badge>
                          <span className="font-medium">{client.nombrePrincipal || client.razonSocial}</span>
                          <Badge variant="secondary">{client.tipoCliente}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {latestResult.data.lastSale && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Última Venta:</h4>
                    <div className="p-2 bg-yellow-50 rounded text-sm">
                      <div><strong>Venta:</strong> {latestResult.data.lastSale.saleNumber}</div>
                      <div><strong>Cliente:</strong> {latestResult.data.lastSale.customerName || 'NULL'}</div>
                      <div><strong>Cliente ID:</strong> {latestResult.data.lastSale.clientId || 'NULL'}</div>
                      {latestResult.data.lastSale.client && (
                        <div><strong>Datos Cliente:</strong> {latestResult.data.lastSale.client.nombrePrincipal || latestResult.data.lastSale.client.razonSocial}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Corregir Nombres
            </CardTitle>
            <CardDescription>
              Corrige los nombres de clientes en las ventas POS que aparecen como "Cliente sin nombre"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleFixCustomerNames} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Corrigiendo...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Corregir Nombres de Clientes
                </>
              )}
            </Button>

            {result && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">{result.message}</p>
                    {result.data?.sampleData && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Datos de ejemplo:</p>
                        <div className="space-y-1">
                          {result.data.sampleData.map((sale: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{sale.saleNumber}</Badge>
                              <span className="font-medium">{sale.customerName}</span>
                              {sale.clientId && (
                                <Badge variant="secondary">ID: {sale.clientId}</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Scripts SQL Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Scripts para ejecutar directamente en la base de datos:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><strong>revisar_ultimos_registros.sql</strong> - Revisión de últimas ventas y cliente recién creado</li>
              <li><strong>ver_registros_sin_nombre_simple.sql</strong> - Revisión rápida de registros</li>
              <li><strong>revisar_registros_sin_nombre.sql</strong> - Diagnóstico completo</li>
              <li><strong>corregir_ventas_pos.sql</strong> - Corrección automática</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Comandos SQL principales:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>-- Ver últimas 10 ventas</div>
              <div>SELECT id, "saleNumber", "customerName", "clientId", "createdAt"</div>
              <div>FROM "POSSale" ORDER BY "createdAt" DESC LIMIT 10;</div>
              <br/>
              <div>-- Buscar cliente recién creado</div>
              <div>SELECT * FROM "Client" WHERE "nombrePrincipal" LIKE '%119224357%';</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 