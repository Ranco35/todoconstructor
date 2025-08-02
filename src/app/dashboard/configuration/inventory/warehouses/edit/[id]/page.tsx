import { getWarehouseById, updateWarehouse, getWarehousesForParent } from "@/actions/configuration/warehouse-actions"
import { WAREHOUSE_TYPES } from "@/constants/warehouse"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}


// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default async function EditWarehousePage(props: PageProps) {
  const params = await props.params
  const warehouseId = parseInt(params.id)
  
  if (isNaN(warehouseId)) {
    notFound()
  }

  const [warehouse, parentWarehouses] = await Promise.all([
    getWarehouseById(warehouseId),
    getWarehousesForParent(warehouseId)
  ]);
  
  if (!warehouse) {
    notFound()
  }

  const updateWarehouseWithId = updateWarehouse.bind(null, warehouseId)

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Editar bodega: {warehouse.name}</h1>
          <Link 
            href="/dashboard/configuration/inventory/warehouses"
            className="text-blue-600 hover:text-blue-900"
          >
            ← Volver a bodegas
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <form action={updateWarehouseWithId} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la bodega *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={warehouse.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese el nombre de la bodega"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={warehouse.description}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción opcional de la bodega"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                defaultValue={warehouse.location}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ubicación física de la bodega"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de bodega *
              </label>
              <select
                id="type"
                name="type"
                required
                defaultValue={warehouse.type}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un tipo</option>
                {WAREHOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
                Bodega padre (opcional)
              </label>
              <select
                id="parentId"
                name="parentId"
                defaultValue={warehouse.parentId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin bodega padre</option>
                {parentWarehouses.map((parentWarehouse) => (
                  <option key={parentWarehouse.id} value={parentWarehouse.id}>
                    {parentWarehouse.name} ({WAREHOUSE_TYPES.find(t => t.value === parentWarehouse.type)?.label})
                    {parentWarehouse.Parent && ` - Hijo de: ${parentWarehouse.Parent.name}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Las bodegas padre permiten organizar bodegas relacionadas en una jerarquía
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Información adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Productos asignados:</span> {warehouse.Warehouse_Product?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Inventarios activos:</span> {warehouse.Inventory?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Tipo de bodega:</span> {WAREHOUSE_TYPES.find(t => t.value === warehouse.type)?.label}
                </div>
              </div>
              
              {/* Mostrar información de jerarquía */}
              {warehouse.Parent && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-sm text-blue-800">
                    <strong>Bodega padre actual:</strong> {warehouse.Parent.name}
                  </span>
                </div>
              )}
              
              {warehouse.Children && warehouse.Children.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm text-green-800">
                    <strong>Bodegas hijas:</strong> {warehouse.Children.map(child => child.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Actualizar bodega
              </button>
              <Link
                href="/dashboard/configuration/inventory/warehouses"
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        {/* Enlaces adicionales */}
        <div className="mt-6 flex gap-4">
          <Link
            href={`/dashboard/configuration/inventory/warehouses/${warehouseId}/products`}
            className="text-blue-600 hover:text-blue-900 underline"
          >
            Ver productos de esta bodega
          </Link>
        </div>
      </div>
    </div>
  )
} 