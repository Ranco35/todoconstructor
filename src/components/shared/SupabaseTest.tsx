'use client'

import { useState, useEffect } from 'react'
import { testConnection } from '@/lib/supabase-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Database } from 'lucide-react'

interface SupabaseTestProps {
  className?: string
}

export default function SupabaseTest({ className }: SupabaseTestProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testSupabaseConnection = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const connected = await testConnection()
      setIsConnected(connected)
      if (!connected) {
        setError('No se pudo conectar a Supabase')
      }
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />
    if (isConnected === true) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (isConnected === false) return <XCircle className="h-4 w-4 text-red-500" />
    return <Database className="h-4 w-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (isLoading) return 'Probando conexión...'
    if (isConnected === true) return 'Conectado'
    if (isConnected === false) return 'Desconectado'
    return 'Estado desconocido'
  }

  const getStatusBadge = () => {
    if (isConnected === true) return <Badge variant="default" className="bg-green-500">Conectado</Badge>
    if (isConnected === false) return <Badge variant="destructive">Desconectado</Badge>
    return <Badge variant="secondary">Desconocido</Badge>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Estado de Supabase
        </CardTitle>
        <CardDescription>
          Verificación de conexión a la base de datos Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado:</span>
          {getStatusBadge()}
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>URL:</strong> https://bvzfuibqlprrfbudnauc.supabase.co</p>
          <p><strong>Estado:</strong> {getStatusText()}</p>
        </div>
        
        <Button 
          onClick={testSupabaseConnection} 
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Probando...
            </>
          ) : (
            'Probar Conexión'
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 