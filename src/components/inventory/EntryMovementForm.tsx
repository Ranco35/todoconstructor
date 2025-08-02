'use client'

import { useState } from 'react'
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
import { ArrowDownToLine, AlertTriangle, CheckCircle, Package } from 'lucide-react'

interface EntryMovementFormProps {
  warehouses: Array<{ id: number; name: string }>
  products: Array<{ id: number; name: string; sku: string; description?: string; stock?: number }>
}

export default function EntryMovementForm({ warehouses, products }: EntryMovementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    productId: '',
    toWarehouseId: '',
    quantity: '',
    reason: '',
    notes: ''
  })

  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null)
  const [productSearch, setProductSearch] = useState('')

  // Filtrar productos por nombre
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createInventoryMovement({
        productId: parseInt(formData.productId),
        toWarehouseId: parseInt(formData.toWarehouseId),
        movementType: 'ENTRADA',
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
        setError(result.error || 'Error al crear la entrada')
      }
    } catch (err) {
      setError('Error interno del servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Actualizar producto seleccionado
    if (field === 'productId') {
      const product = products.find(p => p.id.toString() === value)
      setSelectedProduct(product || null)
    }
  }

  const isFormValid = () => {
    return (
      formData.productId &&
      formData.toWarehouseId &&
      formData.quantity &&
      formData.reason &&
      parseInt(formData.quantity) > 0
    )
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Entrada registrada exitosamente. Redirigiendo...
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
        {/* Producto */}
        <div className="space-y-2">
          <Label htmlFor="productId">Producto *</Label>
          <Input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            className="mb-2"
          />
          <select
            id="productId"
            value={formData.productId}
            onChange={e => handleInputChange('productId', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Seleccionar producto</option>
            {filteredProducts.length === 0 ? (
              <option value="no-products" disabled>No hay productos disponibles</option>
            ) : (
              filteredProducts.map(product => (
                <option key={product.id} value={product.id.toString()}>
                  {product.name} {product.sku ? `(${product.sku})` : ''}{product.stock !== undefined ? ` — Stock: ${product.stock}` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Bodega de Destino */}
        <div className="space-y-2">
          <Label htmlFor="toWarehouseId">Bodega de Destino *</Label>
          <select
            id="toWarehouseId"
            value={formData.toWarehouseId}
            onChange={e => handleInputChange('toWarehouseId', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Seleccionar bodega</option>
            {warehouses.length === 0 ? (
              <option value="no-warehouses" disabled>No hay bodegas disponibles</option>
            ) : (
              warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Información del Producto Seleccionado */}
      {selectedProduct && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">
              Información del Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Nombre:</span>
                <p className="text-green-700">{selectedProduct.name}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">SKU:</span>
                <p className="text-green-700">{selectedProduct.sku}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-green-800">Descripción:</span>
                <p className="text-green-700">{selectedProduct.description || 'Sin descripción'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cantidad */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad a Ingresar *</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={formData.quantity}
          onChange={(e) => handleInputChange('quantity', e.target.value)}
          placeholder="Ingresa la cantidad"
        />
        <p className="text-sm text-muted-foreground">
          Cantidad de unidades que ingresan a la bodega
        </p>
      </div>

      {/* Razón */}
      <div className="space-y-2">
        <Label htmlFor="reason">Razón de la Entrada *</Label>
        <select
          id="reason"
          value={formData.reason}
          onChange={e => handleInputChange('reason', e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        >
          <option value="">Seleccionar razón</option>
          <option value="Compra a proveedor">Compra a proveedor</option>
          <option value="Devolución de cliente">Devolución de cliente</option>
          <option value="Producción interna">Producción interna</option>
          <option value="Transferencia desde otra bodega">Transferencia desde otra bodega</option>
          <option value="Ajuste de inventario">Ajuste de inventario</option>
          <option value="Otro motivo">Otro motivo</option>
        </select>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Información adicional sobre la entrada (número de factura, proveedor, etc.)"
          rows={3}
        />
      </div>

      {/* Resumen */}
      {isFormValid() && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumen de la Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Producto:</span>
                <span className="text-green-700">{selectedProduct?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-800">Cantidad:</span>
                <span className="text-green-700 font-bold">{parseInt(formData.quantity).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Destino:</span>
                <span className="text-green-700">
                  {warehouses.find(w => w.id.toString() === formData.toWarehouseId)?.name}
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
              <ArrowDownToLine className="h-4 w-4" />
              Registrar Entrada
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