import { getWarehouses } from '@/actions/configuration/warehouse-actions'
import { getProductsForMovement } from '@/actions/inventory/movements'
import ExitMovementForm from '@/components/inventory/ExitMovementForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpFromLine } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ExitPage() {
  const [warehousesResult, productsResult] = await Promise.all([
    getWarehouses(),
    getProductsForMovement()
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory/movements">
          <ArrowUpFromLine className="h-6 w-6 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salida de Productos</h1>
          <p className="text-muted-foreground">
            Registra el egreso de productos de una bodega
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            Nueva Salida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExitMovementForm 
            warehouses={warehousesResult.success ? warehousesResult.data : []}
            products={productsResult.success ? productsResult.data : []}
          />
        </CardContent>
      </Card>
    </div>
  )
} 