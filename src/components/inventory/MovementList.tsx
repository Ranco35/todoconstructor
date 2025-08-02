'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PaginationControls from '@/components/shared/PaginationControls'
import { MovementWithDetails } from '@/types/inventory'
import { MOVEMENT_TYPE_ICONS, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/types/inventory'
import { Package, Eye, Calendar, User, ArrowRight, ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'

interface MovementListProps {
  movements: MovementWithDetails[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentPage: number
}

export default function MovementList({ movements, pagination, currentPage }: MovementListProps) {
  const [selectedMovement, setSelectedMovement] = useState<MovementWithDetails | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'ENTRADA': return <ArrowDown className="h-4 w-4" />
      case 'SALIDA': return <ArrowUp className="h-4 w-4" />
      case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'ENTRADA': return 'text-green-600 bg-green-50 border-green-200'
      case 'SALIDA': return 'text-red-600 bg-red-50 border-red-200'
      case 'TRANSFER': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No hay movimientos registrados
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Comienza registrando tu primer movimiento de inventario para mantener un control completo de tu stock
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Link href="/dashboard/inventory/movements/entry">
            <Button className="bg-green-600 hover:bg-green-700">
              <ArrowDown className="h-4 w-4 mr-2" />
              Primera Entrada
            </Button>
          </Link>
          <Link href="/dashboard/inventory/movements/transfer">
            <Button variant="outline">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Primera Transferencia
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Vista de Tarjetas para Móvil */}
      <div className="md:hidden space-y-4">
        {movements.map((movement) => (
          <Card key={movement.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getMovementColor(movement.movementType)}`}>
                    {getMovementIcon(movement.movementType)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {movement.Product?.name || 'Producto eliminado'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {movement.Product?.sku || 'Sin SKU'}
                    </p>
                  </div>
                </div>
                <Badge className={getMovementColor(movement.movementType)}>
                  {MOVEMENT_TYPE_LABELS[movement.movementType]}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Cantidad:</span>
                  <p className="font-semibold text-gray-900">{movement.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <p className="font-medium text-gray-900">{formatDate(movement.createdAt || '')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Origen:</span>
                  <p className="font-medium text-gray-900">
                    {movement.FromWarehouse?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Destino:</span>
                  <p className="font-medium text-gray-900">
                    {movement.ToWarehouse?.name || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {movement.User?.name || 'Sistema'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMovement(movement)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla para Desktop */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Producto</TableHead>
                <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                <TableHead className="font-semibold text-gray-700">Cantidad</TableHead>
                <TableHead className="font-semibold text-gray-700">Origen</TableHead>
                <TableHead className="font-semibold text-gray-700">Destino</TableHead>
                <TableHead className="font-semibold text-gray-700">Razón</TableHead>
                <TableHead className="font-semibold text-gray-700">Usuario</TableHead>
                <TableHead className="font-semibold text-gray-700">Fecha</TableHead>
                <TableHead className="font-semibold text-gray-700 w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement, index) => (
                <TableRow 
                  key={movement.id} 
                  className={`hover:bg-gray-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getMovementColor(movement.movementType)}`}>
                        {getMovementIcon(movement.movementType)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {movement.Product?.name || 'Producto eliminado'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {movement.Product?.sku || 'Sin SKU'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getMovementColor(movement.movementType)}>
                      {MOVEMENT_TYPE_LABELS[movement.movementType]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {movement.quantity.toLocaleString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm font-medium text-gray-700">
                      {movement.FromWarehouse?.name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm font-medium text-gray-700">
                      {movement.ToWarehouse?.name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-gray-700">
                      {movement.reason || (
                        <span className="text-gray-400">Sin razón especificada</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {movement.User?.name || 'Sistema'}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm font-medium text-gray-700">
                        {formatDate(movement.createdAt || '')}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMovement(movement)}
                      className="hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls
            basePath="/dashboard/inventory/movements"
            itemName="movimientos"
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            totalCount={pagination.total}
            currentCount={movements.length}
          />
        </div>
      )}

      {/* Modal de Detalle Mejorado */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getMovementColor(selectedMovement.movementType)}`}>
                    {getMovementIcon(selectedMovement.movementType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Detalle del Movimiento</h3>
                    <p className="text-sm text-gray-600">Información completa de la operación</p>
                  </div>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMovement(null)}
                  className="hover:bg-gray-100"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información del Producto</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Package className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedMovement.Product?.name || 'Producto eliminado'}
                          </p>
                          <p className="text-sm text-gray-600">
                            SKU: {selectedMovement.Product?.sku || 'Sin SKU'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        {selectedMovement.Product?.description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Detalles del Movimiento</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <Badge className={getMovementColor(selectedMovement.movementType)}>
                          {MOVEMENT_TYPE_LABELS[selectedMovement.movementType]}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cantidad:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedMovement.quantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Razón:</span>
                        <span className="font-medium text-gray-900">
                          {selectedMovement.reason || 'Sin razón especificada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Ubicaciones</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-gray-600 text-sm">Bodega Origen:</span>
                        <p className="font-medium text-gray-900">
                          {selectedMovement.FromWarehouse?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Bodega Destino:</span>
                        <p className="font-medium text-gray-900">
                          {selectedMovement.ToWarehouse?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información Adicional</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <div>
                          <span className="text-gray-600 text-sm">Usuario:</span>
                          <p className="font-medium text-gray-900">
                            {selectedMovement.User?.name || 'Sistema'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <div>
                          <span className="text-gray-600 text-sm">Fecha:</span>
                          <p className="font-medium text-gray-900">
                            {formatDate(selectedMovement.createdAt || '')}
                          </p>
                        </div>
                      </div>
                      {selectedMovement.notes && (
                        <div>
                          <span className="text-gray-600 text-sm">Notas:</span>
                          <p className="font-medium text-gray-900 mt-1">
                            {selectedMovement.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 