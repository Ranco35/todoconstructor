'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, User, MapPin, Calendar, DollarSign, CreditCard, Receipt, Package } from 'lucide-react'
import Link from 'next/link'

interface POSSaleDetail {
  id: number
  saleNumber: string
  sessionId: number
  customerName?: string
  customerDocument?: string
  tableNumber?: string
  roomNumber?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  discountReason?: string
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    total: number
    notes?: string
  }>
}

export default function POSSaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<POSSaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const saleId = params.id as string

  useEffect(() => {
    loadSaleDetail()
  }, [saleId])

  const loadSaleDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Crear función getPOSSaleById en pos-actions.ts
      const response = await fetch(`/api/pos/sales/${saleId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la venta')
      }
      
      const data = await response.json()
      setSale(data)
    } catch (err) {
      console.error('Error loading sale detail:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la venta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH': return 'Efectivo'
      case 'CARD': return 'Tarjeta'
      case 'TRANSFER': return 'Transferencia'
      default: return method || 'Desconocido'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETADO':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/pos/sales" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error al cargar la venta
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'No se pudo encontrar la venta solicitada'}
              </p>
              <Button onClick={() => router.back()}>
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/pos/sales" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Venta {sale.saleNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Detalles completos de la venta del POS
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(sale.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha y Hora</p>
                      <p className="text-gray-900">
                        {new Date(sale.createdAt).toLocaleDateString('es-CL')} - {' '}
                        {new Date(sale.createdAt).toLocaleTimeString('es-CL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cliente</p>
                      <p className="text-gray-900">
                        {sale.customerName || 'Cliente sin nombre'}
                      </p>
                      {sale.customerDocument && (
                        <p className="text-sm text-gray-500">{sale.customerDocument}</p>
                      )}
                    </div>
                  </div>

                  {(sale.tableNumber || sale.roomNumber) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          {sale.tableNumber ? 'Mesa' : 'Habitación'}
                        </p>
                        <p className="text-gray-900">
                          {sale.tableNumber || sale.roomNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                      <p className="text-gray-900">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </p>
                      {sale.paymentMethod?.toUpperCase() === 'CASH' && sale.cashReceived && (
                        <div className="text-sm text-gray-500">
                          <p>Recibido: ${sale.cashReceived.toLocaleString()}</p>
                          {sale.change && sale.change > 0 && (
                            <p>Cambio: ${sale.change.toLocaleString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {sale.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Notas</p>
                    <p className="text-gray-900">{sale.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items de la Venta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos ({sale.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Producto</th>
                        <th className="text-center p-3">Cantidad</th>
                        <th className="text-right p-3">Precio Unit.</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items?.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              {item.notes && (
                                <p className="text-sm text-gray-500">{item.notes}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="text-right p-3 text-gray-600">
                            ${item.unitPrice.toLocaleString()}
                          </td>
                          <td className="text-right p-3 font-semibold">
                            ${item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen Financiero */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${sale.subtotal.toLocaleString()}</span>
                </div>

                {sale.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Descuento</span>
                    <span>-${sale.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {sale.discountReason && (
                  <div className="text-sm text-gray-500">
                    <p>Motivo: {sale.discountReason}</p>
                  </div>
                )}

                {sale.taxAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">IVA (19%)</span>
                    <span className="font-medium">${sale.taxAmount.toLocaleString()}</span>
                  </div>
                )}

                <hr />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">${sale.total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Información de Sesión */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Sesión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de Sesión</span>
                    <span className="font-mono text-sm">{sale.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creado</span>
                    <span className="text-sm">
                      {new Date(sale.createdAt).toLocaleString('es-CL')}
                    </span>
                  </div>
                  {sale.updatedAt !== sale.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actualizado</span>
                      <span className="text-sm">
                        {new Date(sale.updatedAt).toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 