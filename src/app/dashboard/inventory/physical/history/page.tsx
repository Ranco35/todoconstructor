import InventoryPhysicalHistory from '@/components/inventory/InventoryPhysicalHistory'

export default function InventoryPhysicalHistoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Historial de Inventario Físico</h1>
        <p className="text-muted-foreground">
          Revisa todas las tomas de inventario físico realizadas
        </p>
      </div>
      
      <InventoryPhysicalHistory />
    </div>
  )
} 