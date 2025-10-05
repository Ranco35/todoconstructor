import { deleteWarehouseAction, getWarehouses } from "@/actions/configuration/warehouse-actions"
import { WarehouseTable } from "@/components/shared/WarehouseTable"
import PaginationControls from '@/components/shared/PaginationControls'
import { PaginationParams } from "@/interface/actions"
import Link from "next/link"

interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<PaginationParams>
}


// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams

  const { page = '1', pageSize = '10' } = searchParams || {};

  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));

  const { data: warehouses, totalCount } = await getWarehouses({ 
    page: currentPage, 
    pageSize: currentPageSize 
  })

  const totalPages = Math.ceil(totalCount / currentPageSize);

  return (
    <div className="container mx-auto p-4">
      {/* Header con título */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestión de bodegas</h1>
        
        {/* Botones de acción directos */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Link href="/dashboard/configuration/inventory/warehouses/create">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
              <span>+</span> Crear nueva bodega
            </button>
          </Link>
          
          <Link href="/dashboard/configuration/products">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
              <span>⚙️</span> Gestionar productos
            </button>
          </Link>
          
          <Link href="/dashboard/inventory/movements">
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2">
              <span>📊</span> Reportes de inventario
            </button>
          </Link>
        </div>
      </div>

      <WarehouseTable
        data={warehouses}
        deleteAction={deleteWarehouseAction}
      />

      {/* Paginación usando el componente oficial */}
      <div className="mt-6">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={Array.isArray(pageSize) ? pageSize[0] : pageSize}
          totalCount={totalCount}
          currentCount={warehouses.length}
          basePath="/dashboard/configuration/inventory/warehouses"
          itemName="bodegas"
        />
      </div>
    </div>
  );
} 