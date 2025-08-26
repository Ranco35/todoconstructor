import { createWarehouse, getWarehousesForParent } from "@/actions/configuration/warehouse-actions"
import { WAREHOUSE_TYPES } from "@/constants/warehouse"
import Link from "next/link"
import { redirect } from "next/navigation"

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CreateWarehousePage({ searchParams }: PageProps) {
  const parentWarehouses = await getWarehousesForParent();

  async function handleCreateWarehouse(formData: FormData) {
    'use server';
    
    const result = await createWarehouse(formData);
    
    if (result.success) {
      redirect('/dashboard/configuration/inventory/warehouses?message=success&text=' + encodeURIComponent('Bodega creada exitosamente'));
    } else {
      redirect('/dashboard/configuration/inventory/warehouses/create?error=' + encodeURIComponent(result.error));
    }
  }
  
  // Leer parámetros de error si existen
  const sp = await searchParams;
  const errorMessage = typeof sp?.error === 'string' ? sp.error : undefined;
  
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Crear nueva bodega</h1>
          <Link 
            href="/dashboard/configuration/inventory/warehouses"
            className="text-blue-600 hover:text-blue-900"
          >
            ← Volver a bodegas
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {errorMessage && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <form action={handleCreateWarehouse} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la bodega *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin bodega padre</option>
                {parentWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({WAREHOUSE_TYPES.find(t => t.value === warehouse.type)?.label})
                    {warehouse.Parent && ` - Hijo de: ${warehouse.Parent.name}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Las bodegas padre permiten organizar bodegas relacionadas en una jerarquía
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Crear bodega
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
      </div>
    </div>
  )
} 