"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createMultiProductTransfer } from '@/actions/inventory/movements'
import { ProductTransfer, MultiTransferFormData } from '@/types/inventory'
import { Warehouse, Package, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import BodegaSelector from '@/components/products/BodegaSelector'
import { getProductsByWarehouse } from '@/actions/configuration/warehouse-actions'

interface TransferMovementFormMultiProps {
  warehouses: Array<{ id: number; name: string }>
  products: Array<{ id: number; name: string; sku: string }>
}

export default function TransferMovementFormMulti({ warehouses, products }: TransferMovementFormMultiProps) {
  // Filtrar elementos con id válido para evitar errores
  const validWarehouses = warehouses?.filter(w => w && w.id != null) || []
  const validProducts = products?.filter(p => p && p.id != null) || []

  const [fromWarehouseId, setFromWarehouseId] = useState<string>('')
  const [toWarehouseId, setToWarehouseId] = useState<string>('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [productList, setProductList] = useState<ProductTransfer[]>([])
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [productsInOrigin, setProductsInOrigin] = useState<Array<{ id: number; name: string; sku: string; stock: number }>>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Actualizar productos al cambiar la bodega de origen
  useEffect(() => {
    const fetchProducts = async () => {
      if (!fromWarehouseId) {
        setProductsInOrigin([])
        return
      }
      setLoadingProducts(true)
      try {
        const result = await getProductsByWarehouse(Number(fromWarehouseId), { page: 1, pageSize: 100 })
        const products = (result.data || []).map((wp: any) => ({
          id: wp.Product?.id,
          name: wp.Product?.name,
          sku: wp.Product?.sku,
          stock: wp.quantity
        })).filter(p => p.id && p.stock > 0)
        setProductsInOrigin(products)
      } catch (e) {
        setProductsInOrigin([])
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [fromWarehouseId])

  // Agregar producto a la lista
  const handleAddProduct = () => {
    if (!selectedProductId || !selectedQuantity || selectedQuantity <= 0) {
      setAlert({ type: 'error', message: 'Selecciona un producto y una cantidad válida.' })
      return
    }
    if (productList.some(p => p.productId === Number(selectedProductId))) {
      setAlert({ type: 'error', message: 'Este producto ya está en la lista.' })
      return
    }
    setProductList([...productList, { productId: Number(selectedProductId), quantity: selectedQuantity }])
    setSelectedProductId('')
    setSelectedQuantity(1)
    setAlert({ type: 'success', message: 'Producto agregado correctamente.' })
  }

  // Eliminar producto de la lista
  const handleRemoveProduct = (productId: number) => {
    setProductList(productList.filter(p => p.productId !== productId))
    setAlert({ type: 'success', message: 'Producto eliminado de la transferencia.' })
  }

  // Enviar transferencia
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAlert(null)
    if (!fromWarehouseId || !toWarehouseId || fromWarehouseId === toWarehouseId) {
      setAlert({ type: 'error', message: 'Debes seleccionar bodegas distintas.' })
      return
    }
    if (!reason.trim()) {
      setAlert({ type: 'error', message: 'Debes ingresar la razón de la transferencia.' })
      return
    }
    if (productList.length === 0) {
      setAlert({ type: 'error', message: 'Debes agregar al menos un producto.' })
      return
    }
    setLoading(true)
    const result = await createMultiProductTransfer({
      fromWarehouseId: Number(fromWarehouseId),
      toWarehouseId: Number(toWarehouseId),
      reason,
      notes,
      products: productList
    })
    setLoading(false)
    if (result.success) {
      setAlert({ type: 'success', message: 'Transferencia creada exitosamente.' })
      setProductList([])
      setReason('')
      setNotes('')
      setFromWarehouseId('')
      setToWarehouseId('')
    } else {
      setAlert({ type: 'error', message: result.error || 'Error al crear la transferencia.' })
    }
  }

  // Evitar seleccionar la misma bodega
  const handleFromWarehouseChange = (value: string) => {
    setFromWarehouseId(value)
    if (value === toWarehouseId) setToWarehouseId('')
  }
  const handleToWarehouseChange = (value: string) => {
    setToWarehouseId(value)
    if (value === fromWarehouseId) setFromWarehouseId('')
  }

  return (
    <Card className="max-w-3xl mx-auto mt-8 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl p-6">
        <CardTitle className="flex items-center gap-3 text-white">
          <Warehouse className="h-6 w-6" />
          Transferencia entre Bodegas
        </CardTitle>
        <p className="text-blue-100 mt-2">Transfiere múltiples productos de una bodega a otra</p>
      </CardHeader>
      <CardContent className="p-8 space-y-8 bg-white rounded-b-xl">
        {/* Validaciones de datos disponibles */}
        {validWarehouses.length === 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No hay bodegas disponibles para realizar transferencias.</AlertDescription>
          </Alert>
        )}
        {validProducts.length === 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No hay productos disponibles para transferir.</AlertDescription>
          </Alert>
        )}
        {alert && (
          <Alert variant={alert.type === 'success' ? 'success' : 'destructive'} className="mb-4">
            {alert.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Bodega de Origen <span className="text-red-500">*</span></Label>
              <BodegaSelector
                value={fromWarehouseId ? Number(fromWarehouseId) : undefined}
                onChange={id => setFromWarehouseId(id ? id.toString() : '')}
                placeholder="Seleccionar bodega origen"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Bodega de Destino <span className="text-red-500">*</span></Label>
              <BodegaSelector
                value={toWarehouseId ? Number(toWarehouseId) : undefined}
                onChange={id => setToWarehouseId(id ? id.toString() : '')}
                placeholder="Seleccionar bodega destino"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Razón de la Transferencia <span className="text-red-500">*</span></Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Reabastecimiento, Reorganización, etc." required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>

          {/* Sección de productos a transferir */}
          <div className="products-section bg-slate-50 rounded-xl p-6 mb-6 border">
            <div className="products-header flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Package className="h-5 w-5" /> Productos a Transferir
              </h3>
              <span className="text-sm text-slate-500">{productList.length} producto{productList.length !== 1 ? 's' : ''} seleccionado{productList.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="add-product-form grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4 bg-white p-4 rounded-lg border border-dashed border-slate-200">
              <div className="space-y-1">
                <Label>Producto</Label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  disabled={productsInOrigin.length === 0 || loadingProducts}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">{loadingProducts ? 'Cargando productos...' : 'Seleccionar producto'}</option>
                  {productsInOrigin.length === 0 && !loadingProducts ? (
                    <option value="no-products" disabled>No hay productos disponibles</option>
                  ) : (
                    productsInOrigin.map(p => (
                      <option key={p.id} value={p.id.toString()}>{p.name} ({p.sku}) — Stock: {p.stock}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Cantidad</Label>
                <Input type="number" min={1} value={selectedQuantity} onChange={e => setSelectedQuantity(Number(e.target.value))} placeholder="0" disabled={validProducts.length === 0} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <Button type="button" className="mt-4 w-full" onClick={handleAddProduct} disabled={validProducts.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
            {/* Tabla de productos agregados */}
            <div id="productsTableContainer">
              {productList.length === 0 ? (
                <div className="empty-state text-center text-slate-400 py-8">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay productos seleccionados</p>
                  <small>Agrega productos usando el formulario superior</small>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="products-table min-w-full bg-white rounded-lg shadow-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="py-2 px-4 text-left font-semibold text-slate-700">Producto</th>
                        <th className="py-2 px-4 text-left font-semibold text-slate-700">Cantidad</th>
                        <th className="py-2 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {productList.map(prod => {
                        const prodInfo = validProducts.find(p => p.id === prod.productId)
                        return (
                          <tr key={prod.productId} className="border-b last:border-0">
                            <td className="py-2 px-4">
                              <span className="font-medium text-slate-800">{prodInfo?.name || 'Producto'}</span>
                              <span className="ml-2 text-xs text-slate-500">{prodInfo?.sku}</span>
                            </td>
                            <td className="py-2 px-4">{prod.quantity} unidades</td>
                            <td className="py-2 px-4">
                              <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveProduct(prod.productId)}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label>Notas Adicionales</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Información adicional sobre la transferencia..." rows={3} />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => {
              setFromWarehouseId(''); setToWarehouseId(''); setReason(''); setNotes(''); setProductList([]); setAlert(null)
            }}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading || validProducts.length === 0}>
              {loading ? 'Creando...' : (<><Plus className="h-4 w-4 mr-1" /> Crear Transferencia</>)}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 