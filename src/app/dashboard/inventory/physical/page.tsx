import InventoryPhysicalForm from '@/components/inventory/InventoryPhysicalForm'

export default function InventoryPhysicalPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Toma de Inventario Físico</h1>
        <p className="text-muted-foreground">
          Gestiona el conteo físico de productos en bodegas
        </p>
      </div>
      
      <InventoryPhysicalForm />
    </div>
  )
} 