import { deleteCategoryAction, getCategories } from "@/actions/configuration/category-actions"
import { CategoryTable } from "@/components/shared/CategoryTable"
import { CategoryFilter } from "@/components/shared/CategoryFilter"
import PaginationControls from '@/components/shared/PaginationControls'
import { PaginationParams } from "@/interface/actions"
import Link from "next/link"
import CategoryImportExport from "@/components/shared/CategoryImportExport"

interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<PaginationParams & { search?: string }>
}


// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams

  const { page = '1', pageSize = '10', search = '' } = searchParams || {};

  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));
  const searchTerm = String(search || '');

  const { categories, totalCount } = await getCategories({ 
    page: currentPage, 
    pageSize: currentPageSize,
    search: searchTerm 
  });

  const totalPages = Math.ceil(totalCount / currentPageSize);

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header y acciones principales */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestión de Categorías</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/configuration/category/create">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
              <span>+</span> Crear Nueva Categoría
            </button>
          </Link>
          <Link href="/dashboard/configuration/products">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2">
              <span>📦</span> Gestionar Productos
            </button>
          </Link>

        </div>
      </div>



      {/* Importar / Exportar */}
      <CategoryImportExport />

      {/* Filtro de búsqueda */}
      <CategoryFilter basePath="/dashboard/configuration/category" />

      {/* Tabla de Categorías */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CategoryTable
          data={categories}
          deleteAction={deleteCategoryAction}
          searchTerm={searchTerm}
        />

        {/* Paginación usando el componente oficial */}
        <div className="p-4 border-t border-gray-200">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={Array.isArray(pageSize) ? pageSize[0] : pageSize}
            totalCount={totalCount}
            currentCount={categories.length}
            basePath="/dashboard/configuration/category"
            itemName="categorías"
          />
        </div>
      </div>
    </div>
  );
}