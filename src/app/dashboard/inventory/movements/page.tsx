import { Suspense } from 'react'
import { getInventoryMovements, getMovementStats } from '@/actions/inventory/movements'
import { getWarehouses } from '@/actions/configuration/warehouse-actions'
import { getProducts } from '@/actions/products/list'
import MovementList from '@/components/inventory/MovementList'
import MovementStats from '@/components/inventory/MovementStats'
import MovementFilters from '@/components/inventory/MovementFilters'
import CreateMovementButton from '@/components/inventory/CreateMovementButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, TrendingUp, Activity, Warehouse, ArrowRightLeft, Plus, Minus } from 'lucide-react'

interface MovementsPageProps {
  searchParams: {
    page?: string
    productId?: string
    fromWarehouseId?: string
    toWarehouseId?: string
    movementType?: string
    startDate?: string
    endDate?: string
  }
}

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const page = parseInt(searchParams.page || '1')
  const filters = {
    productId: searchParams.productId ? parseInt(searchParams.productId) : undefined,
    fromWarehouseId: searchParams.fromWarehouseId ? parseInt(searchParams.fromWarehouseId) : undefined,
    toWarehouseId: searchParams.toWarehouseId ? parseInt(searchParams.toWarehouseId) : undefined,
    movementType: searchParams.movementType,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate
  }

  // Cargar datos en paralelo
  const [movementsResult, statsResult, warehousesResult, productsResult] = await Promise.all([
    getInventoryMovements(filters, page),
    getMovementStats(),
    getWarehouses(),
    getProducts({ page: 1, pageSize: 1000 })
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Warehouse className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Gestión de Inventario</h1>
                  <p className="text-blue-100 text-lg">
                    Control total de movimientos, transferencias y stock
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {movementsResult.success ? movementsResult.pagination?.total || 0 : 0}
                </div>
                <div className="text-blue-200 text-sm">Movimientos totales</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Botones de Acción Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-5 w-5" />
                    <h3 className="font-semibold">Nueva Entrada</h3>
                  </div>
                  <p className="text-green-100 text-sm">Registrar ingreso de productos</p>
                </div>
                <div className="text-3xl font-bold">📥</div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-r from-red-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Minus className="h-5 w-5" />
                    <h3 className="font-semibold">Nueva Salida</h3>
                  </div>
                  <p className="text-red-100 text-sm">Registrar egreso de productos</p>
                </div>
                <div className="text-3xl font-bold">📤</div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    <h3 className="font-semibold">Transferencia</h3>
                  </div>
                  <p className="text-blue-100 text-sm">Mover entre bodegas</p>
                </div>
                <div className="text-3xl font-bold">🔄</div>
              </div>
              <div className="mt-4">
                <Link href="/dashboard/inventory/movements/transfers">
                  <Button variant="secondary" size="sm" className="gap-2">
                    Ver transferencias
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas Mejoradas */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
                  {statsResult.success && statsResult.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
                      <p className="text-3xl font-bold text-gray-900">{statsResult.data.totalMovements || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cantidad Movida</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {(statsResult.data.totalQuantity || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Entradas</p>
                      <p className="text-3xl font-bold text-green-600">{statsResult.data.entriesCount || 0}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Salidas</p>
                      <p className="text-3xl font-bold text-red-600">{statsResult.data.exitsCount || 0}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <Minus className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Suspense>

        {/* Filtros Mejorados */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Filtros Avanzados</h2>
                <p className="text-sm text-gray-600">Busca y filtra movimientos específicos</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <MovementFilters 
              warehouses={warehousesResult.success ? warehousesResult.data : []}
              products={productsResult.products || []}
              currentFilters={filters}
            />
          </CardContent>
        </Card>

        {/* Lista de Movimientos Mejorada */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Historial de Movimientos</h2>
                  <p className="text-sm text-gray-600">Registro completo de todas las operaciones</p>
                </div>
              </CardTitle>
              {movementsResult.success && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {movementsResult.pagination?.total || 0} movimientos
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando movimientos...</p>
              </div>
            }>
              {movementsResult.success ? (
                <>
                  <div className="p-4 flex justify-end">
                    <a
                      href={`/api/inventory/movements/export?${new URLSearchParams(searchParams as any).toString()}`}
                      className="text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                    >
                      Descargar Excel
                    </a>
                  </div>
                  <MovementList 
                    movements={movementsResult.data}
                    pagination={movementsResult.pagination}
                    currentPage={page}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se pudieron cargar los movimientos</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {movementsResult.error || 'Error al cargar los movimientos. Intenta refrescar la página.'}
                  </p>
                </div>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 