import { getSuppliers } from '@/actions/configuration/suppliers-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getSupplierTags } from '@/actions/suppliers/tags';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PaginationControls from '@/components/shared/PaginationControls';
import SuppliersImportExportClient from '@/components/suppliers/SuppliersImportExportClient';
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

// Mapa de iconos para etiquetas (reutilizado de la página exitosa)
const iconMap: { [key: string]: any } = {
  'bed': Bed, 'coffee': Coffee, 'chef-hat': ChefHat, 'sparkles': Sparkles,
  'truck': Truck, 'car': Car, 'factory': Factory, 'building': Building,
  'briefcase': Briefcase, 'wrench': Wrench, 'zap': Zap, 'settings': Settings,
  'package': Package, 'map-pin': MapPin, 'users': Users, 'dollar-sign': DollarSign,
  'star': Star, 'heart': Heart, 'shield': Shield, 'award': Award,
  'target': Target, 'leaf': Leaf, 'user': User, 'home': Home, 'paint-bucket': PaintBucket
};

export default async function SuppliersImportExportPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Verificar permisos del usuario
  const canEdit = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUser.role);
  const canDelete = ['SUPER_USER', 'ADMINISTRADOR'].includes(currentUser.role);
  const canCreate = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUser.role);
  const canImportExport = ['SUPER_USER', 'ADMINISTRADOR'].includes(currentUser.role);

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || '20'); // Más elementos por defecto para import/export
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
          <h1 className="text-2xl font-bold text-gray-900">Importar y Exportar Proveedores</h1>
          <p className="text-gray-600">Total: {total} proveedores</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/suppliers/list"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Ver Lista
          </Link>
          {canCreate && (
            <Link
              href="/dashboard/suppliers/create"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ➕ Nuevo Proveedor
            </Link>
          )}
        </div>
      </div>

      {/* Mensaje de permisos si no tiene acceso */}
      {!canImportExport && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Permisos limitados
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Solo puedes ver la lista de proveedores. Las funciones de importar y exportar requieren permisos de administrador.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form method="GET" className="flex gap-4 items-center">
          {/* Hidden fields para mantener los filtros actuales */}
          {page > 1 && <input type="hidden" name="page" value={page} />}
          {pageSize !== 20 && <input type="hidden" name="pageSize" value={pageSize} />}
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
                ...(page > 1 && { page: page.toString() }),
                ...(pageSize !== 20 && { pageSize: pageSize.toString() }),
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

      {/* Filtros - Reutilizados de la página exitosa */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* Filtros por tipo de proveedor y estado */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
              href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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
                          ? `/dashboard/suppliers/import-export?${new URLSearchParams({
                              pageSize: pageSize.toString(),
                              ...(rank && { rank }),
                              ...(isActive !== undefined && { isActive: isActive.toString() }),
                              ...(tags && { tags: tags.filter(t => t !== tag.id.toString()).join(',') }),
                              ...(search && { search })
                            }).toString()}`
                          : `/dashboard/suppliers/import-export?${new URLSearchParams({
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
                    href={`/dashboard/suppliers/import-export?${new URLSearchParams({
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

      {/* Componente Client para Import/Export y tabla */}
      <SuppliersImportExportClient
        suppliers={suppliers}
        canEdit={canEdit}
        canDelete={canDelete}
        canImportExport={canImportExport}
        currentFilters={{
          rank,
          isActive,
          tags,
          pageSize,
          search
        }}
      />

      {/* Paginación */}
      {suppliers.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize.toString()}
          totalCount={total}
          currentCount={suppliers.length}
          basePath="/dashboard/suppliers/import-export"
          itemName="proveedores"
        />
      )}
    </div>
  );
} 