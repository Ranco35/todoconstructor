import { getSuppliers } from '@/actions/suppliers/list';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierFilter from '@/components/suppliers/SupplierFilter';
import Head from '@/components/transversal/seccions/Head';
import PaginationControls from '@/components/shared/PaginationControls';
import { PaginationParams } from '@/interface/actions';
import { SupplierRank } from '@/constants/supplier';
import Link from 'next/link';
import SupplierActions from '@/components/suppliers/SupplierActions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<PaginationParams & {
    search?: string;
    countryCode?: string;
    supplierRank?: SupplierRank;
    active?: string;
    category?: string;
    sortBy?: 'name' | 'createdAt' | 'rankPoints' | 'lastPurchase';
    sortOrder?: 'asc' | 'desc';
  }>
}

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function AdminSuppliersPage(props: PageProps) {
  // Verificar autenticación y permisos
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  
  const {
    page = '1',
    pageSize = '10',
    search,
    countryCode,
    supplierRank,
    active,
    category,
    sortBy = 'name',
    sortOrder = 'asc'
  } = searchParams || {};

  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));

  // Obtener datos de proveedores
  const { data: suppliers, totalCount, currentPage: pageNumber, totalPages } = await getSuppliers({
    page: currentPage,
    pageSize: currentPageSize,
    search,
    countryCode,
    supplierRank,
    active: active === 'true' ? true : active === 'false' ? false : undefined,
    category,
    sortBy,
    sortOrder
  });

  // Asegurar que suppliers sea un arreglo válido
  const validSuppliers = Array.isArray(suppliers) ? suppliers : [];

  const menuItems = [
    {
      label: 'Nuevo Proveedor',
      component: (
        <Link
          href="/dashboard/suppliers/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="mr-2">➕</span>
          Nuevo Proveedor
        </Link>
      )
    },
    {
      label: 'Import/Export',
      component: (
        <Link
          href="/dashboard/suppliers/import-export"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <span className="mr-2">📥📤</span>
          Import/Export
        </Link>
      )
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Head title="Gestión de Proveedores (Admin)" menuItems={menuItems} />

      {/* Dashboard de Estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Lista de Proveedores
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>
                Mostrando {validSuppliers.length} de {totalCount} proveedores
              </span>
            </div>
          </div>
        </div>
        
                    <SupplierTable suppliers={validSuppliers as any} currentUserRole={currentUser.role} />
      </div>

      {/* Filtros */}
      <SupplierFilter
        currentFilters={{
          search,
          countryCode,
          supplierRank,
          active: active === 'true' ? true : active === 'false' ? false : undefined,
          category,
          sortBy,
          sortOrder
        }}
      />

      {/* Paginación usando el componente oficial */}
      {totalPages > 1 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={currentPageSize.toString()}
            totalCount={totalCount}
            currentCount={validSuppliers.length}
            basePath="/dashboard/configuration/admin-suppliers"
            itemName="proveedores"
          />
        </div>
      )}

      {/* Acciones Rápidas */}
      <SupplierActions />
    </div>
  );
}