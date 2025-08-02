import Link from 'next/link';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getDashboardStats } from '@/actions/configuration/category-actions';
import { redirect } from 'next/navigation';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function ProductsDashboard() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Obtener estadísticas reales
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* Header del Dashboard de Productos */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Productos</h1>
            <p className="text-indigo-100">
              Gestión completa del catálogo de productos
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">🏷️</div>
            <div className="text-indigo-200">Productos</div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productos Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📂</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCategories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🚀</span>
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            href="/dashboard/configuration/products/create"
            className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <span className="text-xl mr-4">➕</span>
            <div>
              <p className="font-medium text-gray-900">Crear Producto</p>
              <p className="text-sm text-gray-600">Nuevo producto</p>
            </div>
          </Link>

          <Link
            href="/dashboard/configuration/products"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <span className="text-xl mr-4">📋</span>
            <div>
              <p className="font-medium text-gray-900">Ver Catálogo</p>
              <p className="text-sm text-gray-600">Lista completa</p>
            </div>
          </Link>

          <Link
            href="/dashboard/configuration/category"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <span className="text-xl mr-4">📂</span>
            <div>
              <p className="font-medium text-gray-900">Categorías</p>
              <p className="text-sm text-gray-600">Gestionar categorías</p>
            </div>
          </Link>

          <Link
            href="/dashboard/inventory"
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
          >
            <span className="text-xl mr-4">📦</span>
            <div>
              <p className="font-medium text-gray-900">Inventario</p>
              <p className="text-sm text-gray-600">Control de stock</p>
            </div>
          </Link>

          <Link
            href="/dashboard/configuration/products/odoo"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <span className="text-xl mr-4">🔗</span>
            <div>
              <p className="font-medium text-gray-900">Sincronizar Odoo</p>
              <p className="text-sm text-gray-600">Importar desde Odoo</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Módulos de Gestión de Productos */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Módulos de Gestión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Gestión de Productos */}
          <Link href="/dashboard/configuration/products" className="block">
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-indigo-100 text-indigo-600">
                      <span className="text-2xl">🏷️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Catálogo de Productos</h3>
                    <p className="text-sm text-gray-600 mb-4">Gestión completa del catálogo</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Total:</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.totalProducts} productos</span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Gestión de Categorías */}
          <Link href="/dashboard/configuration/category" className="block">
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-purple-100 text-purple-600">
                      <span className="text-2xl">📂</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Categorías</h3>
                    <p className="text-sm text-gray-600 mb-4">Organizar productos por categorías</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Total:</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.totalCategories} categorías</span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Importar/Exportar */}
          <Link href="/dashboard/configuration/products" className="block">
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-green-100 text-green-600">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Importar/Exportar</h3>
                    <p className="text-sm text-gray-600 mb-4">Gestión masiva de productos</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Estado:</span>
                      <span className="text-sm font-semibold text-green-600">Disponible</span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Integración con Odoo */}
          <Link href="/dashboard/configuration/products/odoo" className="block">
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-100 text-blue-600">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Integración Odoo</h3>
                    <p className="text-sm text-gray-600 mb-4">Sincronizar productos desde Odoo</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Estado:</span>
                      <span className="text-sm font-semibold text-blue-600">Disponible</span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* Productos con Stock Bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            Productos con Stock Bajo
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-gray-900">Producto A</p>
                <p className="text-sm text-gray-600">Stock: 2 unidades</p>
              </div>
              <span className="text-sm font-semibold text-red-600">Crítico</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">Producto B</p>
                <p className="text-sm text-gray-600">Stock: 5 unidades</p>
              </div>
              <span className="text-sm font-semibold text-yellow-600">Bajo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">Producto C</p>
                <p className="text-sm text-gray-600">Stock: 8 unidades</p>
              </div>
              <span className="text-sm font-semibold text-yellow-600">Bajo</span>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/inventory" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Ver todos los productos con stock bajo →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Estadísticas de Productos
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Productos más vendidos</span>
              <span className="text-sm font-semibold text-blue-600">Ver reporte</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Productos sin movimiento</span>
              <span className="text-sm font-semibold text-gray-900">15 productos</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Valor total inventario</span>
              <span className="text-sm font-semibold text-green-600">$45,780</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Productos agregados hoy</span>
              <span className="text-sm font-semibold text-indigo-600">3 productos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 