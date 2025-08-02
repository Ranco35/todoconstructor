'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createInventoryMovement } from '@/actions/inventory/movements'
import { ProductForMovement } from '@/types/inventory'
import { ArrowUpFromLine, AlertTriangle, CheckCircle, Package } from 'lucide-react'

interface ExitMovementFormProps {
  warehouses: Array<{ id: number; name: string }>
  products: ProductForMovement[]
}

export default function ExitMovementForm({ warehouses, products }: ExitMovementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    productId: '',
    fromWarehouseId: '',
    quantity: '',
    reason: '',
    notes: ''
  })

  const [selectedProduct, setSelectedProduct] = useState<ProductForMovement | null>(null)
  const [availableStock, setAvailableStock] = useState(0)

  // Filtrar productos disponibles en la bodega seleccionada
  const getAvailableProducts = (warehouseId: number) => {
    return products.filter(p => p.quantity > 0)
  }

  // Actualizar stock disponible cuando cambia la bodega
  useEffect(() => {
    if (formData.fromWarehouseId && formData.productId) {
      const product = products.find(p => 
        p.Product.id === parseInt(formData.productId) && 
        p.quantity > 0
      )
      setSelectedProduct(product || null)
      setAvailableStock(product?.quantity || 0)
    } else {
      setSelectedProduct(null)
      setAvailableStock(0)
    }
  }, [formData.fromWarehouseId, formData.productId, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createInventoryMovement({
        productId: parseInt(formData.productId),
        fromWarehouseId: parseInt(formData.fromWarehouseId),
        movementType: 'SALIDA',
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || undefined
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/inventory/movements')
        }, 2000)
      } else {
        setError(result.error || 'Error al crear la salida')
      }
    } catch (err) {
      setError('Error interno del servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Resetear producto cuando cambia la bodega
    if (field === 'fromWarehouseId') {
      setFormData(prev => ({ ...prev, productId: '', quantity: '' }))
    }
  }

  const isFormValid = () => {
    return (
      formData.productId &&
      formData.fromWarehouseId &&
      formData.quantity &&
      formData.reason &&
      parseInt(formData.quantity) > 0 &&
      parseInt(formData.quantity) <= availableStock
    )
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Salida registrada exitosamente. Redirigiendo...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bodega de Origen */}
        <div className="space-y-2">
          <Label htmlFor="fromWarehouseId">Bodega de Origen *</Label>
          <Select
            value={formData.fromWarehouseId}
            onValueChange={(value) => handleInputChange('fromWarehouseId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar bodega" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Producto */}
        <div className="space-y-2">
          <Label htmlFor="productId">Producto *</Label>
          <Select
            value={formData.productId}
            onValueChange={(value) => handleInputChange('productId', value)}
            disabled={!formData.fromWarehouseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar producto" />
            </SelectTrigger>
            <SelectContent>
              {formData.fromWarehouseId ? (
                getAvailableProducts(parseInt(formData.fromWarehouseId)).map((product) => (
                  <SelectItem key={product.Product.id} value={product.Product.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{product.Product.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        Stock: {product.quantity}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              ) : (
                                 <SelectItem value="none" disabled>
                   Primero selecciona una bodega
                 </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Información del Producto Seleccionado */}
      {selectedProduct && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-900">
              Información del Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-red-800">Nombre:</span>
                <p className="text-red-700">{selectedProduct.Product.name}</p>
              </div>
              <div>
                <span className="font-medium text-red-800">SKU:</span>
                <p className="text-red-700">{selectedProduct.Product.sku}</p>
              </div>
              <div>
                <span className="font-medium text-red-800">Stock Disponible:</span>
                <p className="text-red-700 font-bold">{selectedProduct.quantity.toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-red-800">Descripción:</span>
                <p className="text-red-700">{selectedProduct.Product.description || 'Sin descripción'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cantidad */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad a Egresar *</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          max={availableStock}
          value={formData.quantity}
          onChange={(e) => handleInputChange('quantity', e.target.value)}
          placeholder="Ingresa la cantidad"
          disabled={!selectedProduct}
        />
        {selectedProduct && (
          <p className="text-sm text-muted-foreground">
            Stock disponible: {availableStock.toLocaleString()} unidades
          </p>
        )}
      </div>

      {/* Razón */}
      <div className="space-y-2">
        <Label htmlFor="reason">Razón de la Salida *</Label>
        <Select
          value={formData.reason}
          onValueChange={(value) => handleInputChange('reason', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar razón" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Venta">Venta a cliente</SelectItem>
            <SelectItem value="Consumo">Consumo interno</SelectItem>
            <SelectItem value="Dañado">Producto dañado</SelectItem>
            <SelectItem value="Vencido">Producto vencido</SelectItem>
            <SelectItem value="Donación">Donación realizada</SelectItem>
            <SelectItem value="Transferencia">Transferencia a otra bodega</SelectItem>
            <SelectItem value="Ajuste">Ajuste de inventario</SelectItem>
            <SelectItem value="Otro">Otro motivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Información adicional sobre la salida (cliente, motivo específico, etc.)"
          rows={3}
        />
      </div>

      {/* Resumen */}
      {isFormValid() && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumen de la Salida
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Producto:</span>
                <span className="text-red-700">{selectedProduct?.Product.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-800">Cantidad:</span>
                <span className="text-red-700 font-bold">{parseInt(formData.quantity).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Origen:</span>
                <span className="text-red-700">
                  {warehouses.find(w => w.id.toString() === formData.fromWarehouseId)?.name}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={!isFormValid() || loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Registrando...
            </>
          ) : (
            <>
              <ArrowUpFromLine className="h-4 w-4" />
              Registrar Salida
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/inventory/movements')}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
} 