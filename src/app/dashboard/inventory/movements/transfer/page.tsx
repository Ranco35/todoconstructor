import { getWarehouses } from '@/actions/configuration/warehouse-actions'
import { getProductsForMovement } from '@/actions/inventory/movements'
import TransferMovementFormMulti from '@/components/inventory/TransferMovementFormMulti'

export const dynamic = 'force-dynamic'

export default async function TransferPage() {
  const [warehousesResult, productsResult] = await Promise.all([
    getWarehouses(),
    getProductsForMovement()
  ])

  return (
    <div className="py-8">
      <TransferMovementFormMulti
        warehouses={warehousesResult.data || []}
        products={productsResult.success ? productsResult.data : []}
      />
    </div>
  )
} 