import Link from 'next/link';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getInventoryStats, getLowStockProducts } from '@/actions/configuration/inventory-stats-actions';
import { redirect } from 'next/navigation';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: string;
}

function StatCard({ title, value, icon, color, change }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">{change}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

function QuickAction({ title, description, icon, href, color }: QuickActionProps) {
  return (
    <Link href={href} className="block">
      <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${color}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface LowStockItemProps {
  product: {
    id: number;
    name: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    category?: string;
    supplier?: string;
  };
}

function LowStockItem({ product }: LowStockItemProps) {
  const getStockLevel = (current: number, min: number) => {
    if (current === 0) return { level: 'Sin Stock', color: 'bg-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-600' };
    if (current < min * 0.5) return { level: 'Crítico', color: 'bg-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-600' };
    if (current < min) return { level: 'Bajo', color: 'bg-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-600' };
    return { level: 'Normal', color: 'bg-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-600' };
  };

  const stockLevel = getStockLevel(product.currentStock, product.minStock);
  const initials = product.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`flex items-center justify-between p-4 ${stockLevel.bgColor} rounded-lg border ${stockLevel.borderColor}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${stockLevel.color} rounded-full flex items-center justify-center text-white font-semibold`}>
          {initials}
        </div>
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-600">
            Stock: {product.currentStock} unidades
            {product.category && ` • ${product.category}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${stockLevel.textColor}`}>{stockLevel.level}</p>
        <p className="text-xs text-gray-500">Mínimo: {product.minStock}</p>
      </div>
    </div>
  );
}

export default async function InventoryDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Obtener datos reales del inventario
  const [inventoryStats, lowStockProducts] = await Promise.all([
    getInventoryStats(),
    getLowStockProducts(5) // Obtener los 5 productos con stock más bajo
  ]);

  // Formatear valores para mostrar
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CL').format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header del Módulo */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Módulo de Inventario</h1>
            <p className="text-orange-100">
              Control completo de stock y gestión de bodegas
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">📦</div>
            <div className="text-orange-200">Sistema de Inventario</div>
          </div>
        </div>
      </div>

      {/* Estadísticas del Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Productos"
          value={formatNumber(inventoryStats.totalProducts)}
          icon="📦"
          color="bg-orange-100 text-orange-600"
          change={`${inventoryStats.productsWithStock} con stock`}
        />
        <StatCard
          title="Bodegas Activas"
          value={formatNumber(inventoryStats.activeWarehouses)}
          icon="🏭"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Stock Bajo"
          value={formatNumber(inventoryStats.lowStockProducts)}
          icon="⚠️"
          color="bg-red-100 text-red-600"
          change={inventoryStats.lowStockProducts > 0 ? "Requiere atención" : "Todo en orden"}
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(inventoryStats.totalValue)}
          icon="💰"
          color="bg-green-100 text-green-600"
          change={`${inventoryStats.productsWithoutStock} sin stock`}
        />
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            <QuickAction
              title="Nuevo Producto"
              description="Agregar producto al inventario"
              icon="➕"
              href="/dashboard/configuration/products/create"
              color="bg-orange-50 border-orange-200 hover:bg-orange-100"
            />
            <QuickAction
              title="Gestionar Bodegas"
              description="Administrar ubicaciones de almacenamiento"
              icon="🏭"
              href="/dashboard/configuration/inventory/warehouses"
              color="bg-blue-50 border-blue-200 hover:bg-blue-100"
            />
            <QuickAction
              title="Movimientos"
              description="Registrar entradas y salidas"
              icon="📊"
              href="/dashboard/inventory/movements"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Reportes"
              description="Generar reportes de inventario"
              icon="📈"
              href="/dashboard/inventory/reports"
              color="bg-purple-50 border-purple-200 hover:bg-purple-100"
            />
            <QuickAction
              title="Ajuste de Inventario"
              description="Toma de inventario físico"
              icon="📋"
              href="/dashboard/inventory/physical"
              color="bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Estadísticas del Módulo
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Producto más vendido</span>
              <span className="text-sm font-semibold text-orange-600">
                {inventoryStats.topSellingProduct?.name || 'Sin datos'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Bodega principal</span>
              <span className="text-sm font-semibold text-blue-600">
                {inventoryStats.mainWarehouse?.name || 'Sin datos'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Productos con stock</span>
              <span className="text-sm font-semibold text-green-600">
                {formatNumber(inventoryStats.productsWithStock)} productos
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Productos sin stock</span>
              <span className="text-sm font-semibold text-red-600">
                {formatNumber(inventoryStats.productsWithoutStock)} productos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Productos con Stock Bajo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          Productos con Stock Bajo
        </h3>
        <div className="space-y-3">
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map((product) => (
              <LowStockItem key={product.id} product={product} />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-600">No hay productos con stock bajo</p>
              <p className="text-sm text-gray-500">Todos los productos tienen stock suficiente</p>
            </div>
          )}
            </div>
        {lowStockProducts.length > 0 && (
          <div className="mt-4">
            <Link href="/dashboard/configuration/products" className="text-sm text-orange-600 hover:text-orange-800 font-medium">
              Ver todos los productos →
            </Link>
          </div>
        )}
      </div>

      {/* Enlaces a Funcionalidades Existentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🔗</span>
          Funcionalidades del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/configuration/products" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium text-gray-900">Lista de Productos</p>
                <p className="text-sm text-gray-600">Ver todos los productos</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/inventory/warehouses" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏭</span>
              <div>
                <p className="font-medium text-gray-900">Gestionar Bodegas</p>
                <p className="text-sm text-gray-600">Administrar ubicaciones</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/inventory/movements" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">Movimientos</p>
                <p className="text-sm text-gray-600">Entradas y salidas</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/products/create" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">➕</span>
              <div>
                <p className="font-medium text-gray-900">Nuevo Producto</p>
                <p className="text-sm text-gray-600">Agregar al inventario</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/inventory/reports" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📈</span>
              <div>
                <p className="font-medium text-gray-900">Reportes</p>
                <p className="text-sm text-gray-600">Análisis de inventario</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/category" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📂</span>
              <div>
                <p className="font-medium text-gray-900">Categorías</p>
                <p className="text-sm text-gray-600">Organizar productos</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/inventory/physical" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium text-gray-900">Ajuste de Inventario</p>
                <p className="text-sm text-gray-600">Toma de inventario físico</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 