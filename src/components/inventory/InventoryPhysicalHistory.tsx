"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { History, Filter, Calendar, User, Warehouse, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import BodegaSelector from '@/components/products/BodegaSelector'
import PaginationControls from '@/components/shared/PaginationControls'


interface InventoryPhysicalHistory {
  id: number;
  warehouseId: number;
  warehouseName: string;
  userId: string;
  userName: string;
  fecha: string;
  comentarios: string;
  diferencias: Array<{
    sku: string;
    nombre: string;
    stockAnterior: number;
    stockContado: number;
    diferencia: number;
    comentario?: string;
  }>;
  totalActualizados: number;
  totalErrores: number;
}

export default function InventoryPhysicalHistory() {
  const [history, setHistory] = useState<InventoryPhysicalHistory[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({
    warehouseId: null as number | null,
    startDate: '',
    endDate: '',
    userId: ''
  })

  const pageSize = 10

  const loadHistory = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString()
      })
      
      if (filters.warehouseId) params.append('warehouseId', filters.warehouseId.toString())
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.userId) params.append('userId', filters.userId)

      const response = await fetch(`/api/inventory/physical/history?${params}`)
      if (!response.ok) throw new Error('Error cargando historial')
      
      const result = await response.json()
      setHistory(result.data)
      setTotalCount(result.total)
      setTotalPages(Math.ceil(result.total / pageSize))
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/inventory/physical/stats')
      if (!response.ok) throw new Error('Error cargando estadísticas')
      
      const statsData = await response.json()
      setStats(statsData)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  useEffect(() => {
    loadHistory()
    loadStats()
  }, [currentPage, filters])

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estadísticas de Inventario Físico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalTomas}</div>
                <div className="text-sm text-muted-foreground">Total Tomas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalProductosActualizados}</div>
                <div className="text-sm text-muted-foreground">Productos Actualizados</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.totalErrores}</div>
                <div className="text-sm text-muted-foreground">Total Errores</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.promedioDiferencias}</div>
                <div className="text-sm text-muted-foreground">Promedio Diferencias</div>
              </div>
            </div>
            
            {stats.bodegasMasActivas.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Bodegas Más Activas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {stats.bodegasMasActivas.map((bodega: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {bodega.name} ({bodega.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Bodega</Label>
              <BodegaSelector
                selectedWarehouseId={filters.warehouseId}
                onWarehouseChange={(id) => handleFilterChange('warehouseId', id)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input
                placeholder="Buscar por usuario..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Tomas de Inventario
          </CardTitle>
          <CardDescription>
            {totalCount} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.warehouseName}</span>
                        <Badge variant={item.totalErrores > 0 ? "destructive" : "default"}>
                          {item.totalActualizados} actualizados
                        </Badge>
                        {item.totalErrores > 0 && (
                          <Badge variant="destructive">
                            {item.totalErrores} errores
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.fecha)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.userName}
                        </div>
                      </div>
                    </div>
                    
                    {item.diferencias.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ver Diferencias ({item.diferencias.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Diferencias de Stock</DialogTitle>
                            <DialogDescription>
                              Toma de inventario en {item.warehouseName} - {formatDate(item.fecha)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            {item.diferencias.map((diff, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium">{diff.nombre}</div>
                                    <div className="text-sm text-muted-foreground">SKU: {diff.sku}</div>
                                  </div>
                                  <Badge variant={diff.diferencia > 0 ? "default" : "destructive"}>
                                    {diff.diferencia > 0 ? '+' : ''}{diff.diferencia}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Stock Anterior:</span>
                                    <span className="ml-2 font-medium">{diff.stockAnterior}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Stock Contado:</span>
                                    <span className="ml-2 font-medium">{diff.stockContado}</span>
                                  </div>
                                </div>
                                {diff.comentario && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    <span className="font-medium">Comentario:</span> {diff.comentario}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {item.comentarios && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <div className="font-medium mb-1">Comentarios Generales:</div>
                              <div className="text-sm">{item.comentarios}</div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {item.comentarios && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Comentarios:</span> {item.comentarios}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                basePath="/dashboard/inventory/physical/history"
                itemName="registros"
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalCount}
                currentCount={history.length}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 