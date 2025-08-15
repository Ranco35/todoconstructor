import Link from 'next/link';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
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

export default async function ConfigurationDashboardPage() {
  let currentUser;
  
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }
  } catch (error) {
    // Si hay error en auth, redirigir al login
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      {/* Header del Módulo */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Módulo de Configuración</h1>
            <p className="text-gray-100">
              Administración general del sistema y configuraciones
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">⚙️</div>
            <div className="text-gray-200">Sistema de Configuración</div>
          </div>
        </div>
      </div>

      {/* Estadísticas del Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Usuarios Activos"
          value="12"
          icon="👥"
          color="bg-blue-100 text-blue-600"
          change="+2 este mes"
        />
        <StatCard
          title="Categorías"
          value="8"
          icon="📂"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Categorías POS"
          value="5"
          icon="🏪"
          color="bg-yellow-100 text-yellow-600"
          change="Sistema nuevo"
        />
        <StatCard
          title="Centros de Costo"
          value="15"
          icon="💰"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Bodegas"
          value="8"
          icon="🏭"
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Habitaciones"
          value="6"
          icon="🛏️"
          color="bg-teal-100 text-teal-600"
          change="Sistema optimizado"
        />
        <StatCard
          title="Sistema Modular"
          value="✅"
          icon="⚙️"
          color="bg-cyan-100 text-cyan-600"
          change="Implementado"
        />
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Temporadas"
          value="7"
          icon="📅"
          color="bg-pink-100 text-pink-600"
          change="Configuradas 2025"
        />
        <StatCard
          title="Productos Spa"
          value="45"
          icon="🧘"
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Proveedores Activos"
          value="28"
          icon="🤝"
          color="bg-indigo-100 text-indigo-600"
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
              title="Gestionar Usuarios"
              description="Administrar usuarios del sistema"
              icon="👥"
              href="/dashboard/configuration/users"
              color="bg-blue-50 border-blue-200 hover:bg-blue-100"
            />
            <QuickAction
              title="Categorías"
              description="Gestionar categorías de productos"
              icon="📂"
              href="/dashboard/configuration/category"
              color="bg-purple-50 border-purple-200 hover:bg-purple-100"
            />
            <QuickAction
              title="Centros de Costo"
              description="Administrar centros de costo"
              icon="💰"
              href="/dashboard/configuration/cost-centers"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Bodegas"
              description="Gestionar ubicaciones de almacenamiento"
              icon="🏭"
              href="/dashboard/configuration/inventory/warehouses"
              color="bg-orange-50 border-orange-200 hover:bg-orange-100"
            />
            <QuickAction
              title="Unidades de Medida"
              description="Gestionar unidades y conversiones"
              icon="📏"
              href="/dashboard/configuration/units"
              color="bg-teal-50 border-teal-200 hover:bg-teal-100"
            />
            <QuickAction
              title="Gestión de Etiquetas"
              description="Administrar etiquetas para clientes y proveedores"
              icon="🏷️"
              href="/dashboard/configuration/tags"
              color="bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
            />
            <QuickAction
              title="Habitaciones"
              description="Gestionar habitaciones del hotel"
              icon="🛏️"
              href="/dashboard/configuration/rooms"
              color="bg-teal-50 border-teal-200 hover:bg-teal-100"
            />
            <QuickAction
              title="Temporadas"
              description="Configurar precios por temporadas"
              icon="📅"
              href="/dashboard/configuration/seasons"
              color="bg-pink-50 border-pink-200 hover:bg-pink-100"
            />
            <QuickAction
              title="Categorías POS"
              description="Gestionar categorías para punto de venta"
              icon="🏪"
              href="/dashboard/configuration/pos-categories"
              color="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
            />
            <QuickAction
              title="Sistema Modular"
              description="Panel completo de productos y paquetes modulares"
              icon="⚙️"
              href="/dashboard/admin/productos-modulares"
              color="bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
            />
            <QuickAction
              title="WhatsApp Multi-Usuario"
              description="Atención y chat multi-usuario con clientes"
              icon="🟢"
              href="/dashboard/whatsapp-multi-user"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Vincular WhatsApp"
              description="Vincula el número principal de WhatsApp al sistema"
              icon="🟢"
              href="/dashboard/whatsapp-link"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Backup de Base de Datos"
              description="Sistema de respaldo automático y gestión de backups"
              icon="💾"
              href="/dashboard/configuration/backup"
              color="bg-purple-50 border-purple-200 hover:bg-purple-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Estadísticas del Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Último acceso</span>
              <span className="text-sm font-semibold text-blue-600">Hace 2 horas</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Sesiones activas</span>
              <span className="text-sm font-semibold text-green-600">5 usuarios</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Configuraciones</span>
              <span className="text-sm font-semibold text-purple-600">8 módulos</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Estado del sistema</span>
              <span className="text-sm font-semibold text-green-600">Operativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos de Configuración */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🔧</span>
          Módulos de Configuración
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/configuration/users" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">👥</span>
              <div>
                <p className="font-medium text-gray-900">Usuarios</p>
                <p className="text-sm text-gray-600">Gestionar usuarios del sistema</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/category" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📂</span>
              <div>
                <p className="font-medium text-gray-900">Categorías</p>
                <p className="text-sm text-gray-600">Organizar productos</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/cost-centers" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="font-medium text-gray-900">Centros de Costo</p>
                <p className="text-sm text-gray-600">Administrar costos</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/inventory/warehouses" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏭</span>
              <div>
                <p className="font-medium text-gray-900">Bodegas</p>
                <p className="text-sm text-gray-600">Gestionar almacenamiento</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/units" className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📏</span>
              <div>
                <p className="font-medium text-gray-900">Unidades de Medida</p>
                <p className="text-sm text-gray-600">Gestionar unidades y conversiones</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/products" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📦</span>
              <div>
                <p className="font-medium text-gray-900">Productos</p>
                <p className="text-sm text-gray-600">Administrar productos</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/admin-suppliers" className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏢</span>
              <div>
                <p className="font-medium text-gray-900">Proveedores Admin</p>
                <p className="text-sm text-gray-600">Gestión avanzada</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/tags" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏷️</span>
              <div>
                <p className="font-medium text-gray-900">Gestión de Etiquetas</p>
                <p className="text-sm text-gray-600">Etiquetas para clientes y proveedores</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/rooms" className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🛏️</span>
              <div>
                <p className="font-medium text-gray-900">Habitaciones</p>
                <p className="text-sm text-gray-600">Gestionar habitaciones del hotel</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/seasons" className="p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors border border-pink-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">Temporadas</p>
                <p className="text-sm text-gray-600">Configurar precios por temporadas</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/pos-categories" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏪</span>
              <div>
                <p className="font-medium text-gray-900">Categorías POS</p>
                <p className="text-sm text-gray-600">Organizar productos para TPV</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/admin/productos-modulares" className="p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border border-cyan-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚙️</span>
              <div>
                <p className="font-medium text-gray-900">Sistema Modular</p>
                <p className="text-sm text-gray-600">Panel completo de productos y paquetes</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/email" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="font-medium text-gray-900">Configuración de Emails</p>
                <p className="text-sm text-gray-600">Configurar sistema de correos con Gmail</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/backup" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💾</span>
              <div>
                <p className="font-medium text-gray-900">Backup de Base de Datos</p>
                <p className="text-sm text-gray-600">Sistema de respaldo automático</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Herramientas del Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🛠️</span>
          Herramientas del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/setup-client-tables" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔧</span>
              <div>
                <p className="font-medium text-gray-900">Crear Tablas Clientes</p>
                <p className="text-sm text-gray-600">Configuración inicial</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/verify-client-tables" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-medium text-gray-900">Verificar Tablas</p>
                <p className="text-sm text-gray-600">Validar configuración</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/configuration/users/create" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">➕</span>
              <div>
                <p className="font-medium text-gray-900">Nuevo Usuario</p>
                <p className="text-sm text-gray-600">Crear cuenta</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 