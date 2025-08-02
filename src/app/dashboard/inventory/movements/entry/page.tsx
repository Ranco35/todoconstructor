import { getWarehouses } from '@/actions/configuration/warehouse-actions'
import { getProducts } from '@/actions/products/list'
import EntryMovementForm from '@/components/inventory/EntryMovementForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownToLine } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EntryPage() {
  const [warehousesResult, productsResult] = await Promise.all([
    getWarehouses(),
    getProducts({ page: 1, pageSize: 1000 })
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory/movements">
          <ArrowDownToLine className="h-6 w-6 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entrada de Productos</h1>
          <p className="text-muted-foreground">
            Registra el ingreso de productos a una bodega
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Nueva Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EntryMovementForm 
            warehouses={warehousesResult.data || []}
            products={productsResult.products || []}
          />
        </CardContent>
      </Card>
    </div>
  )
} 