import { Suspense } from 'react';
import Link from 'next/link';
import { getUnitMeasures, deleteUnitMeasureAction } from '@/actions/configuration/unit-measure-actions';
import UnitMeasureTable from '@/components/configuration/units/UnitMeasureTable';
import UnitConversionDemo from '@/components/configuration/units/UnitConversionDemo';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { Plus, Calculator, Search, Filter } from 'lucide-react';
import { UNIT_CATEGORIES } from '@/types/unit-measure';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    category?: string;
    includeInactive?: string;
  }>;
}

// Componente de filtros
function UnitFilters({ 
  search = '', 
  category = '', 
  includeInactive = false,
  basePath 
}: {
  search: string;
  category: string;
  includeInactive: boolean;
  basePath: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Búsqueda */}
        <div className="flex-1">
          <form method="GET" className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar por nombre, abreviatura o descripción..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Mantener otros parámetros */}
            {category && <input type="hidden" name="category" value={category} />}
            {includeInactive && <input type="hidden" name="includeInactive" value="true" />}
          </form>
        </div>

        {/* Filtro por categoría */}
        <div className="w-full lg:w-64">
          <form method="GET">
            <select
              name="category"
              defaultValue={category}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las categorías</option>
              {UNIT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            {/* Mantener otros parámetros */}
            {search && <input type="hidden" name="search" value={search} />}
            {includeInactive && <input type="hidden" name="includeInactive" value="true" />}
            <button type="submit" className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Filtrar
            </button>
          </form>
        </div>

        {/* Checkbox para incluir inactivos */}
        <div className="flex items-center">
          <form method="GET">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="includeInactive"
                defaultChecked={includeInactive}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Incluir inactivos</span>
            </label>
            {/* Mantener otros parámetros */}
            {search && <input type="hidden" name="search" value={search} />}
            {category && <input type="hidden" name="category" value={category} />}
            <button type="submit" className="ml-2 px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
              Aplicar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente de estadísticas
function UnitStatistics({ totalCount, categoryCounts }: { 
  totalCount: number;
  categoryCounts: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      
      {UNIT_CATEGORIES.map(category => (
        <div key={category.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {categoryCounts[category.value] || 0}
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function UnitsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const {
    page = '1',
    pageSize = '10',
    search = '',
    category = '',
    includeInactive = ''
  } = params;

  const currentPage = parseInt(page);
  const currentPageSize = parseInt(pageSize);
  const includeInactiveBool = includeInactive === 'true';

  // Obtener unidades con filtros
  const { data: units, totalCount, totalPages } = await getUnitMeasures({
    page: currentPage,
    pageSize: currentPageSize,
    search,
    category,
    includeInactive: includeInactiveBool
  });

  // Obtener estadísticas por categoría
  const allUnits = await getUnitMeasures({ pageSize: 1000, includeInactive: includeInactiveBool });
  const categoryCounts = allUnits.data.reduce((acc, unit) => {
    acc[unit.category] = (acc[unit.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const basePath = '/dashboard/configuration/units';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de Unidades de Medida
          </h1>
          <p className="text-gray-600 mt-2">
            Administra las unidades de medida del sistema y define conversiones personalizadas
          </p>
        </div>

        <div className="flex space-x-3">
          <Link href={`${basePath}/create`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Nueva Unidad</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <UnitStatistics 
        totalCount={allUnits.totalCount} 
        categoryCounts={categoryCounts} 
      />

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Sistema de Unidades de Medida</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Unidades del Sistema:</strong> Unidades predefinidas que no se pueden editar (UND, KG, LT, etc.)</p>
          <p>• <strong>Unidades Personalizadas:</strong> Crea unidades específicas como "Jaba de 24" con conversiones automáticas</p>
          <p>• <strong>Conversiones:</strong> Define factores de conversión entre unidades (ej: 1 JAB24 = 24 UND)</p>
          <p>• <strong>Categorías:</strong> Organiza las unidades por tipo (peso, volumen, empaque, etc.)</p>
        </div>
      </div>

      {/* Filtros */}
      <UnitFilters
        search={search}
        category={category}
        includeInactive={includeInactiveBool}
        basePath={basePath}
      />

      {/* Demostración de Conversiones */}
      <UnitConversionDemo />

      {/* Tabla de Unidades */}
      <Suspense fallback={
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Cargando unidades de medida...</span>
          </div>
        </div>
      }>
        <UnitMeasureTable
          data={units}
          deleteAction={deleteUnitMeasureAction}
        />
      </Suspense>

      {/* Paginación */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={currentPageSize.toString()}
          totalCount={totalCount}
          currentCount={units.length}
          basePath={basePath}
          itemName="unidades de medida"
          searchParams={{
            ...(search && { search }),
            ...(category && { category }),
            ...(includeInactiveBool && { includeInactive: 'true' })
          }}
        />
      )}

      {/* Información adicional */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">📚 Casos de Uso Comunes</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Bebidas:</strong> Se compran por "Jaba de 24" pero se venden por unidad individual</p>
          <p>• <strong>Alimentos:</strong> Se compran por kilogramo pero se venden por gramo o porción</p>
          <p>• <strong>Productos empacados:</strong> Se compran por caja pero se venden por unidad</p>
          <p>• <strong>Materiales:</strong> Se compran por metro pero se usan por centímetro</p>
        </div>
      </div>
    </div>
  );
} 