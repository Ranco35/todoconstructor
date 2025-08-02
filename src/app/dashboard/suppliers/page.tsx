import { getSuppliers } from '@/actions/configuration/suppliers-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, Factory, Building2, Package, Shield, Award, Zap, Globe, Handshake, 
  TrendingUp, Package2, ShoppingCart, Users2, Wrench, Palette, Briefcase, 
  Bed, UserCheck, Coffee, Moon, TreePine, ChefHat, HardHat, 
  Utensils, Sparkles, Clock, House, Car, Edit, Eye 
} from 'lucide-react';

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

// Mapa de iconos para las etiquetas
const iconMap = {
  // Personal de Hotel
  bed: Bed,
  'user-check': UserCheck,
  coffee: Coffee,
  moon: Moon,
  'tree-pine': TreePine,
  'chef-hat': ChefHat,
  'hard-hat': HardHat,
  utensils: Utensils,
  sparkles: Sparkles,
  clock: Clock,
  house: House,
  // Logística
  truck: Truck,
  car: Car,
  // Industria
  factory: Factory,
  package: Package,
  package2: Package2,
  // Corporativo
  building2: Building2,
  briefcase: Briefcase,
  users2: Users2,
  // Comercial
  'shopping-cart': ShoppingCart,
  handshake: Handshake,
  'trending-up': TrendingUp,
  // Técnicos
  wrench: Wrench,
  zap: Zap,
  settings: Wrench,
  // Calidad
  shield: Shield,
  award: Award,
  // Otros
  globe: Globe,
  palette: Palette,
  tag: Package
};

export default async function SuppliersDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Verificar permisos del usuario
  const canCreateSuppliers = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUser.role);
  const canEditSuppliers = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUser.role);

  // Obtener datos reales de proveedores con etiquetas
  const suppliersData = await getSuppliers({ page: 1, pageSize: 100 });
  const allSuppliers = suppliersData.data || [];
  
  // Calcular estadísticas reales
  const totalSuppliers = allSuppliers.length;
  const activeSuppliers = allSuppliers.filter(s => s.isActive).length;
  const partTimeSuppliers = allSuppliers.filter(s => s.rank === 'PART_TIME').length;
  const regularSuppliers = allSuppliers.filter(s => s.rank === 'REGULAR').length;
  const premiumSuppliers = allSuppliers.filter(s => s.rank === 'PREMIUM').length;
  
  // Proveedores recientes (últimos 5) con etiquetas
  const recentSuppliers = allSuppliers
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  // Ciudad con más proveedores
  const cityCounts = allSuppliers.reduce((acc, supplier) => {
    const city = supplier.city || 'Sin ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCity = Object.entries(cityCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="space-y-8">
      {/* Header del Módulo */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Módulo de Proveedores</h1>
            <p className="text-purple-100">
              Gestión completa de proveedores y contactos
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">🏢</div>
            <div className="text-purple-200">Sistema de Proveedores</div>
          </div>
        </div>
      </div>

      {/* Estadísticas del Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Proveedores"
          value={totalSuppliers.toString()}
          icon="🏢"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Proveedores Activos"
          value={activeSuppliers.toString()}
          icon="✅"
          color="bg-green-100 text-green-600"
          change={`${totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0}% del total`}
        />
        <StatCard
          title="Part-Time"
          value={partTimeSuppliers.toString()}
          icon="⏰"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Regulares"
          value={regularSuppliers.toString()}
          icon="👤"
          color="bg-orange-100 text-orange-600"
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
            {canCreateSuppliers && (
              <>
                <QuickAction
                  title="Nuevo Proveedor"
                  description="Registrar un nuevo proveedor"
                  icon="➕"
                  href="/dashboard/suppliers/create"
                  color="bg-purple-50 border-purple-200 hover:bg-purple-100"
                />
              </>
            )}
            <QuickAction
              title="Lista de Proveedores"
              description="Ver todos los proveedores"
              icon="📋"
              href="/dashboard/suppliers/list"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Importar/Exportar"
              description="Importar y exportar proveedores en Excel"
              icon="📤📥"
              href="/dashboard/suppliers/import-export"
              color="bg-blue-50 border-blue-200 hover:bg-blue-100"
            />
            {!canCreateSuppliers && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 text-xl">🔒</span>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Acceso Limitado</p>
                    <p className="text-xs text-gray-500">Solo lectura de proveedores. Contacta a un administrador para crear nuevos proveedores.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Estadísticas del Módulo
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Proveedores Part-Time</span>
              <span className="text-sm font-semibold text-blue-600">{partTimeSuppliers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Proveedores Regulares</span>
              <span className="text-sm font-semibold text-purple-600">{regularSuppliers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Proveedores Premium</span>
              <span className="text-sm font-semibold text-orange-600">{premiumSuppliers}</span>
            </div>
            {topCity && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Ciudad principal</span>
                <span className="text-sm font-semibold text-green-600">{topCity[0]} ({topCity[1]})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proveedores Recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🆕</span>
          Proveedores Recientes
        </h3>
        {recentSuppliers.length > 0 ? (
          <div className="space-y-4">
            {recentSuppliers.map((supplier) => {
              const initials = supplier.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const createdAt = supplier.createdAt ? new Date(supplier.createdAt) : new Date();
              const timeAgo = getTimeAgo(createdAt);
              
              // Obtener la primera etiqueta del proveedor
              const firstTag = supplier.etiquetas && supplier.etiquetas.length > 0 
                ? supplier.etiquetas[0].etiqueta 
                : null;
              
              return (
                <div key={supplier.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    {/* Avatar del proveedor */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {initials}
                    </div>
                    
                    {/* Información del proveedor */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900 text-lg">{supplier.name}</p>
                        {/* Todas las etiquetas en una línea */}
                        {supplier.etiquetas && supplier.etiquetas.length > 0 && (
                          <div className="flex items-center space-x-1 flex-wrap">
                            {supplier.etiquetas.slice(0, 4).map((assignment, index) => {
                              const tag = assignment.etiqueta;
                              if (!tag) return null;
                              const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Truck;
                              return (
                                <div 
                                  key={assignment.id}
                                  className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  <IconComponent size={12} />
                                  <span>{tag.nombre}</span>
                                </div>
                              );
                            })}
                            {supplier.etiquetas.length > 4 && (
                              <span className="text-xs text-gray-500 font-medium">
                                +{supplier.etiquetas.length - 4} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{supplier.email || 'Sin email'}</span>
                        <span>•</span>
                        <span className="capitalize">{supplier.supplierRank?.toLowerCase() || 'Sin tipo'}</span>
                        {supplier.city && (
                          <>
                            <span>•</span>
                            <span>{supplier.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Información de tiempo y acciones */}
                  <div className="flex items-center space-x-4">
                    {/* Información de tiempo */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">Registrado {timeAgo}</p>
                      <p className="text-xs text-gray-500">{createdAt.toLocaleDateString('es-ES')}</p>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center space-x-2">
                      {/* Botón Ver detalle */}
                      <Link href={`/dashboard/suppliers/${supplier.id}`}>
                        <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 shadow-sm">
                          <Eye size={14} />
                          <span>Ver</span>
                        </button>
                      </Link>
                      
                      {/* Botón Editar (solo si tiene permisos) */}
                      {canEditSuppliers && (
                        <Link href={`/dashboard/suppliers/edit/${supplier.id}`}>
                          <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 shadow-sm">
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <p className="text-gray-500 mb-4">No hay proveedores registrados aún</p>
            {canCreateSuppliers && (
              <Link href="/dashboard/suppliers/create" className="text-purple-600 hover:text-purple-700 font-medium">
                Crear el primer proveedor
              </Link>
            )}
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
          <Link href="/dashboard/suppliers/list" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium text-gray-900">Lista de Proveedores</p>
                <p className="text-sm text-gray-600">Ver todos los proveedores</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/suppliers/create" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">➕</span>
              <div>
                <p className="font-medium text-gray-900">Crear Proveedor</p>
                <p className="text-sm text-gray-600">Nuevo registro</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/pettyCash" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="font-medium text-gray-900">Pagos a Proveedores</p>
                <p className="text-sm text-gray-600">Caja chica</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para calcular tiempo transcurrido
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInHours > 0) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInMinutes > 0) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else {
    return 'hace un momento';
  }
} 