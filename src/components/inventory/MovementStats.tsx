'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MovementStats as MovementStatsType } from '@/types/inventory'
import { MOVEMENT_TYPE_ICONS, MOVEMENT_TYPE_COLORS } from '@/types/inventory'
import { TrendingUp, Package, Activity } from 'lucide-react'

interface MovementStatsProps {
  stats: MovementStatsType
}

export default function MovementStats({ stats }: MovementStatsProps) {
  const totalMovements = Object.values(stats.typeStats || {}).reduce((sum, count) => sum + (count || 0), 0)
  const totalQuantity = (stats.recentMovements || []).reduce((sum, movement) => sum + (movement.quantity || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Movimientos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMovements}</div>
          <p className="text-xs text-muted-foreground">
            Todos los tipos de movimientos
          </p>
        </CardContent>
      </Card>

      {/* Cantidad Total Movida */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad Total</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Último mes
          </p>
        </CardContent>
      </Card>

      {/* Movimientos por Tipo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.typeStats || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MOVEMENT_TYPE_ICONS[type as keyof typeof MOVEMENT_TYPE_ICONS]}</span>
                  <span className="text-sm font-medium">{type}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productos Más Movidos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(stats.topProducts || []).slice(0, 3).map((product) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium truncate max-w-20">
                    {product.name}
                  </span>
                </div>
                <Badge variant="outline">{product.totalQuantity}</Badge>
              </div>
            ))}
          </div>
          {(stats.topProducts || []).length > 3 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{(stats.topProducts || []).length - 3} más productos
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 