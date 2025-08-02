'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface POSPriceUpdaterProps {
  onUpdateComplete?: () => void
}

export default function POSPriceUpdater({ onUpdateComplete }: POSPriceUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const { toast } = useToast()

  const handleUpdatePrices = async () => {
    setIsUpdating(true)
    setUpdateResult(null)
    
    try {
      const response = await fetch('/api/pos/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setUpdateResult(result.data)
        toast({
          title: "✅ Precios actualizados",
          description: result.message || "Los precios de productos POS han sido actualizados correctamente",
        })
        
        if (onUpdateComplete) {
          onUpdateComplete()
        }
      } else {
        toast({
          title: "❌ Error al actualizar precios",
          description: result.error || "Error al actualizar precios de productos POS",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating POS prices:', error)
      toast({
        title: "❌ Error de conexión",
        description: "Error al conectar con el servidor para actualizar precios",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Actualizar Precios POS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta función sincroniza los precios de productos POS con los precios finales congelados 
            de los productos. Útil cuando los precios se muestran correctamente en productos pero 
            no se reflejan en las ventas del POS.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sincroniza precios congelados de productos con el sistema POS
            </p>
            {updateResult && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  {updateResult.totalUpdated || 0} productos actualizados
                </span>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleUpdatePrices}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Actualizando...' : 'Actualizar Precios'}
          </Button>
        </div>

        {updateResult && updateResult.updatedProducts && updateResult.updatedProducts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Productos actualizados:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {updateResult.updatedProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">${product.oldPrice}</span>
                    <span>→</span>
                    <span className="text-green-600 font-bold">${product.newPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 