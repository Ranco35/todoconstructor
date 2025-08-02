import Link from 'next/link';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import { getConsolidatedPaymentsStats } from '@/actions/accounting/consolidated-payments';
import { formatCurrency } from '@/utils/currency';

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

export default async function AccountingDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Verificar que solo administradores y super usuarios puedan acceder
  if (!['SUPER_USER', 'ADMINISTRADOR'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 text-red-400">⛔</span>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Solo administradores y super usuarios pueden acceder al módulo de contabilidad.</p>
          <p className="text-sm text-gray-500">Tu rol actual: <span className="font-medium">{currentUser.role}</span></p>
        </div>
      </div>
    );
  }

  // Obtener estadísticas financieras reales del mes actual
  const currentMonth = new Date();
  const dateFrom = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
  const dateTo = new Date().toISOString().split('T')[0];
  
  const statsResult = await getConsolidatedPaymentsStats({ dateFrom, dateTo });
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="space-y-8">
      {/* Header del Módulo */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Módulo de Contabilidad</h1>
            <p className="text-emerald-100">
              Gestión financiera y contable completa del sistema
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">💰</div>
            <div className="text-emerald-200">Sistema Contable</div>
          </div>
        </div>
      </div>

      {/* Estadísticas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos del Mes"
          value={stats ? formatCurrency(stats.totalIncome) : "$0"}
          icon="📈"
          color="bg-green-100 text-green-600"
          change={stats ? `${stats.totalPayments} transacciones` : "Sin datos"}
        />
        <StatCard
          title="Gastos del Mes"
          value={stats ? formatCurrency(stats.totalExpense) : "$0"}
          icon="📉"
          color="bg-red-100 text-red-600"
          change={stats ? `${Object.values(stats.bySource).filter(s => s.amount < 0).length} fuentes` : "Sin datos"}
        />
        <StatCard
          title="Utilidad Neta"
          value={stats ? formatCurrency(stats.netAmount) : "$0"}
          icon="💰"
          color={stats && stats.netAmount >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}
          change={stats ? (stats.netAmount >= 0 ? "Balance positivo" : "Balance negativo") : "Sin datos"}
        />
        <StatCard
          title="Transacciones Totales"
          value={stats ? stats.totalPayments.toString() : "0"}
          icon="📋"
          color="bg-blue-100 text-blue-600"
          change={stats ? `${Object.keys(stats.byPaymentMethod).length} métodos de pago` : "Sin datos"}
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
              title="Nueva Factura"
              description="Crear factura para cliente"
              icon="📄"
              href="/dashboard/accounting/invoices/create"
              color="bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            />
            <QuickAction
              title="Registrar Pago"
              description="Registrar pago recibido"
              icon="💳"
              href="/dashboard/accounting/payments/create"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Nuevo Gasto"
              description="Registrar gasto o compra"
              icon="💸"
              href="/dashboard/accounting/expenses/create"
              color="bg-red-50 border-red-200 hover:bg-red-100"
            />
            <QuickAction
              title="Conciliación Bancaria"
              description="Conciliar movimientos bancarios"
              icon="🏦"
              href="/dashboard/accounting/reconciliation"
              color="bg-blue-50 border-blue-200 hover:bg-blue-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Indicadores Financieros
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Margen de utilidad</span>
              <span className="text-sm font-semibold text-emerald-600">48.2%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Rotación de inventario</span>
              <span className="text-sm font-semibold text-blue-600">2.3 veces</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Días de cobro promedio</span>
              <span className="text-sm font-semibold text-orange-600">15 días</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Flujo de caja</span>
              <span className="text-sm font-semibold text-green-600">Positivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos Contables */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">💼</span>
          Módulos Contables
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/accounting/payments" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💳</span>
              <div>
                <p className="font-medium text-gray-900">Pagos Consolidados</p>
                <p className="text-sm text-gray-600">Todos los pagos del sistema</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/accounting/reconciliation" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏦</span>
              <div>
                <p className="font-medium text-gray-900">Conciliaciones Bancarias</p>
                <p className="text-sm text-gray-600">Cartola vs Sistema</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/accounting/reports" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">Reportes Financieros</p>
                <p className="text-sm text-gray-600">Análisis e indicadores</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/sales" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📄</span>
              <div>
                <p className="font-medium text-gray-900">Facturación</p>
                <p className="text-sm text-gray-600">Gestión de facturas</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/pettyCash" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="font-medium text-gray-900">Caja Chica</p>
                <p className="text-sm text-gray-600">Gastos menores</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/purchases" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📦</span>
              <div>
                <p className="font-medium text-gray-900">Compras</p>
                <p className="text-sm text-gray-600">Pagos a proveedores</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 