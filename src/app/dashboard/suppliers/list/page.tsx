import { getSuppliers } from '@/actions/configuration/suppliers-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getSupplierTags } from '@/actions/suppliers/tags';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DeleteConfirmButton } from '@/components/shared/DeleteConfirmButton';
import { deleteSupplierAction } from '@/actions/suppliers/delete';
import PaginationControls from '@/components/shared/PaginationControls';
import { Package, Truck, Car, Factory, Building, Wrench, Zap, ChefHat, Coffee, Sparkles, Bed, MapPin, Users, Briefcase, DollarSign, Star, Heart, Shield, Award, Target, Leaf, Settings, User, Home, PaintBucket, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    rank?: string;
    isActive?: string;
    tags?: string;
    search?: string;
  }>;
}

// Mapa de iconos para etiquetas
const iconMap: { [key: string]: any } = {
  // Hotel específicos
  'bed': Bed,
  'coffee': Coffee,
  'chef-hat': ChefHat,
  'sparkles': Sparkles,
  // Logística
  'truck': Truck,
  'car': Car,
  // Industria y corporativo
  'factory': Factory,
  'building': Building,
  'briefcase': Briefcase,
  // Técnicos y servicios
  'wrench': Wrench,
  'zap': Zap,
  'settings': Settings,
  // Otros
  'package': Package,
  'map-pin': MapPin,
  'users': Users,
  'dollar-sign': DollarSign,
  'star': Star,
  'heart': Heart,
  'shield': Shield,
  'award': Award,
  'target': Target,
  'leaf': Leaf,
  'user': User,
  'home': Home,
  'paint-bucket': PaintBucket
};

export default async function SuppliersListPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Verificar permisos del usuario
  const canEdit = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUser.role);
  const canDelete = ['SUPER_USER', 'ADMINISTRADOR'].includes(currentUser.role);
  const canCreate = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUser.role);

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || '10');
  const rank = params.rank;
  const isActive = params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined;
  const tags = params.tags ? params.tags.split(',').filter(Boolean) : undefined;
  const search = params.search;

  // Obtener etiquetas disponibles para el filtro
  const tagsResult = await getSupplierTags();
  const availableTags = tagsResult.success ? tagsResult.data : [];

  const suppliersData = await getSuppliers({
    page,
    pageSize,
    rank,
    isActive,
    tags,
    search
  });

  const suppliers = suppliersData.data || [];
  const totalPages = suppliersData.totalPages || 1;
  const currentPage = suppliersData.currentPage || 1;
  const total = suppliersData.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Proveedores</h1>
          <p className="text-gray-600">Total: {total} proveedores</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/suppliers/create"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ➕ Nuevo Proveedor
          </Link>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form method="GET" className="flex gap-4 items-center">
          {/* Hidden fields para mantener los filtros actuales */}
          {page > 1 && <input type="hidden" name="page" value={page} />}
          {pageSize !== 10 && <input type="hidden" name="pageSize" value={pageSize} />}
          {rank && <input type="hidden" name="rank" value={rank} />}
          {isActive !== undefined && <input type="hidden" name="isActive" value={isActive.toString()} />}
          {tags && <input type="hidden" name="tags" value={tags.join(',')} />}
          
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar por nombre, email, RUT, ciudad o categoría..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Buscar
          </button>
          {search && (
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                ...(page > 1 && { page: page.toString() }),
                ...(pageSize !== 10 && { pageSize: pageSize.toString() }),
                ...(rank && { rank }),
                ...(isActive !== undefined && { isActive: isActive.toString() }),
                ...(tags && { tags: tags.join(',') })
              }).toString()}`}
              className="text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* Filtros por tipo de proveedor y estado */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                !rank && !isActive && !tags
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                rank: 'BASICO',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                rank === 'BASICO'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Básico
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                rank: 'REGULAR',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                rank === 'REGULAR'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Regular
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                rank: 'BUENO',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                rank === 'BUENO'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bueno
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                rank: 'EXCELENTE',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                rank === 'EXCELENTE'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Excelente
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                rank: 'PREMIUM',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                rank === 'PREMIUM'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Premium
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                isActive: 'true',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                isActive === true
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activos
            </Link>
            <Link
              href={`/dashboard/suppliers/list?${new URLSearchParams({
                isActive: 'false',
                pageSize: pageSize.toString(),
                ...(search && { search })
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-sm ${
                isActive === false
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactivos
            </Link>
          </div>

          {/* Filtros por etiquetas */}
          {availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Filtrar por etiquetas:</h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const Icon = iconMap[tag.icono] || Package;
                  const isSelected = tags?.includes(tag.id.toString());
                  
                  return (
                    <Link
                      key={tag.id}
                      href={
                        isSelected
                          ? `/dashboard/suppliers/list?${new URLSearchParams({
                              pageSize: pageSize.toString(),
                              ...(rank && { rank }),
                              ...(isActive !== undefined && { isActive: isActive.toString() }),
                              ...(tags && { tags: tags.filter(t => t !== tag.id.toString()).join(',') }),
                              ...(search && { search })
                            }).toString()}`
                          : `/dashboard/suppliers/list?${new URLSearchParams({
                              pageSize: pageSize.toString(),
                              ...(rank && { rank }),
                              ...(isActive !== undefined && { isActive: isActive.toString() }),
                              tags: [...(tags || []), tag.id.toString()].join(','),
                              ...(search && { search })
                            }).toString()}`
                      }
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={isSelected ? { backgroundColor: tag.color } : {}}
                    >
                      <Icon className="w-3 h-3" />
                      {tag.nombre}
                      {isSelected && (
                        <span className="ml-1 text-xs">✕</span>
                      )}
                    </Link>
                  );
                })}
              </div>
              {tags && tags.length > 0 && (
                <div className="mt-2">
                  <Link
                    href={`/dashboard/suppliers/list?${new URLSearchParams({
                      pageSize: pageSize.toString(),
                      ...(search && { search })
                    }).toString()}`}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Limpiar filtros de etiquetas
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Proveedores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {suppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calidad de Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Etiquetas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ciudad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => {
                  const initials = supplier.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                          </div>
                          <div className="ml-4">
                            <Link
                              href={`/dashboard/suppliers/${supplier.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                            >
                              {supplier.name}
                            </Link>
                            {supplier.taxId && (
                              <div className="text-sm text-gray-500">RUT: {supplier.taxId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.email || 'Sin email'}</div>
                        <div className="text-sm text-gray-500">{supplier.phone || 'Sin teléfono'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          supplier.supplierRank === 'BASICO' ? 'bg-gray-100 text-gray-800' :
                          supplier.supplierRank === 'REGULAR' ? 'bg-yellow-100 text-yellow-800' :
                          supplier.supplierRank === 'BUENO' ? 'bg-green-100 text-green-800' :
                          supplier.supplierRank === 'EXCELENTE' ? 'bg-purple-100 text-purple-800' :
                          supplier.supplierRank === 'PREMIUM' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {supplier.supplierRank || 'Sin tipo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {supplier.etiquetas && supplier.etiquetas.length > 0 ? (
                            supplier.etiquetas.slice(0, 3).map((assignment: any) => {
                              const tag = assignment.etiqueta;
                              const Icon = iconMap[tag.icono] || Package;
                              return (
                                <span
                                  key={assignment.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  <Icon className="w-3 h-3" />
                                  {tag.nombre}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 text-xs">Sin etiquetas</span>
                          )}
                          {supplier.etiquetas && supplier.etiquetas.length > 3 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              +{supplier.etiquetas.length - 3} más
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.city || 'Sin ciudad'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 items-center">
                          {canEdit && (
                            <Link
                              href={`/dashboard/suppliers/edit/${supplier.id}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Editar
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/suppliers/${supplier.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver
                          </Link>
                          {canDelete && (
                            <DeleteConfirmButton
                              id={supplier.id.toString()}
                              deleteAction={deleteSupplierAction}
                              confirmMessage={`¿Estás seguro de que deseas eliminar al proveedor "${supplier.name}"?`}
                            />
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-gray-400 text-xs">
                              Solo lectura
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proveedores</h3>
            <p className="text-gray-500 mb-4">
              {rank || isActive !== undefined || (tags && tags.length > 0)
                ? 'No se encontraron proveedores con los filtros aplicados'
                : 'Aún no hay proveedores registrados en el sistema'
              }
            </p>
            {canCreate && (
              <Link
                href="/dashboard/suppliers/create"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crear el primer proveedor
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Paginación */}
      {suppliers.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize.toString()}
          totalCount={total}
          currentCount={suppliers.length}
          basePath="/dashboard/suppliers/list"
          itemName="proveedores"
        />
      )}
    </div>
  );
} 