'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/utils/currency';

// Importación dinámica para el componente de ChatGPT
const ChatGPTAdminCard = dynamic(() => import('@/components/configuration/ChatGPTAdminCard'), {
  loading: () => (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  stats?: {
    label: string;
    value: string;
  };
  isActive?: boolean;
  isSpecial?: boolean;
  currentUser?: any;
}

function ModuleCard({ title, description, icon, href, color, stats, isActive = false, isSpecial = false, currentUser }: ModuleCardProps) {
  // Si es la tarjeta especial de ChatGPT, renderizar el componente especializado
  if (isSpecial && title === 'ChatGPT Admin') {
    return <ChatGPTAdminCard currentUser={currentUser} />;
  }

  return (
    <Link href={href} className="block">
      <div className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        isActive ? 'border-blue-500 shadow-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                <span className="text-2xl">{icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 mb-4">{description}</p>
              {stats && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{stats.label}:</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.value}</span>
                </div>
              )}
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
  );
}

interface DashboardModulesProps {
  currentUser: any;
  stats: any;
  salesStats: any;
  posStats: any;
  purchaseStats: any;
  websiteStats: any;
}

export default function DashboardModules({
  currentUser,
  stats,
  salesStats,
  posStats,
  purchaseStats,
  websiteStats
}: DashboardModulesProps) {
  // Definir módulos según el rol del usuario
  const getModules = () => {
    const baseModules = [
      {
        title: 'Reservas',
        description: 'Gestionar reservas y citas de clientes',
        icon: '📅',
        href: '/dashboard/reservations',
        color: 'bg-blue-100 text-blue-600',
        stats: { label: 'Hoy', value: '12 reservas' }
      },
      {
        title: 'Clientes',
        description: 'Administrar base de datos de clientes',
        icon: '👥',
        href: '/dashboard/customers',
        color: 'bg-green-100 text-green-600',
        stats: { label: 'Total', value: '486 clientes' }
      },
      {
        title: 'Proveedores',
        description: 'Gestionar proveedores y contactos',
        icon: '🏢',
        href: '/dashboard/suppliers',
        color: 'bg-purple-100 text-purple-600',
        stats: { label: 'Activos', value: '24 proveedores' }
      },
      {
        title: 'Productos',
        description: 'Gestión completa de productos',
        icon: '🏷️',
        href: '/dashboard/products',
        color: 'bg-indigo-100 text-indigo-600',
        stats: { label: 'Total', value: `${stats.totalProducts} productos` }
      },
      {
        title: 'Inventario',
        description: 'Control de stock y bodegas',
        icon: '📦',
        href: '/dashboard/inventory',
        color: 'bg-orange-100 text-orange-600',
        stats: { label: 'En stock', value: '89 items' }
      },
      {
        title: 'Contabilidad',
        description: 'Gestión financiera y contable',
        icon: '💰',
        href: '/dashboard/accounting',
        color: 'bg-emerald-100 text-emerald-600',
        stats: { label: 'Utilidad', value: '$21,780' }
      },
      {
        title: 'Ventas',
        description: 'Presupuestos, facturas y pagos',
        icon: '💳',
        href: '/dashboard/sales',
        color: 'bg-rose-100 text-rose-600',
        stats: { 
          label: 'Facturas', 
          value: `${salesStats.totalInvoices} total (${salesStats.pendingInvoices} pendientes)` 
        }
      },
      {
        title: 'Compras',
        description: 'Órdenes, facturas y pagos a proveedores',
        icon: '📦',
        href: '/dashboard/purchases',
        color: 'bg-teal-100 text-teal-600',
        stats: { 
          label: 'Órdenes', 
          value: `${purchaseStats.totalOrders} total (${purchaseStats.pendingOrders} pendientes)` 
        }
      },
      {
        title: '🤖 Procesador IA Facturas',
        description: 'Extrae datos de PDFs y vincula productos automáticamente',
        icon: '🤖',
        href: '/dashboard/purchases/ai-invoice-processor',
        color: 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600',
        stats: { 
          label: 'IA + Matching', 
          value: 'Inteligente' 
        }
      },
      {
        title: 'POS Ventas',
        description: 'Punto de venta recepción y restaurante',
        icon: '🛒',
        href: '/dashboard/pos',
        color: 'bg-cyan-100 text-cyan-600',
        stats: { 
          label: 'Ventas hoy', 
          value: `${posStats.totalSalesToday} (${formatCurrency(posStats.revenueToday)})` 
        }
      },
      {
        title: 'Website',
        description: 'Gestionar página web y contenido público',
        icon: '🌐',
        href: '/admin/website',
        color: 'bg-gradient-to-r from-green-100 to-blue-100 text-green-600',
        stats: { 
          label: 'Mensajes', 
          value: `${websiteStats.newMessages} nuevos` 
        }
      },
      {
        title: 'Vincular WhatsApp',
        description: 'Conectar número principal de WhatsApp al sistema',
        icon: '🟢',
        href: '/dashboard/whatsapp-link',
        color: 'bg-green-100 text-green-600',
        stats: { 
          label: 'Estado', 
          value: 'Conectar' 
        }
      },
      {
        title: 'Emails',
        description: 'Sistema de envío de correos electrónicos',
        icon: '📧',
        href: '/dashboard/emails',
        color: 'bg-blue-100 text-blue-600',
        stats: { 
          label: 'Sistema', 
          value: 'Gmail SMTP' 
        }
      }
    ];

    // Agregar módulos de configuración para roles administrativos
    if (currentUser.role === 'SUPER_USER' || currentUser.role === 'ADMINISTRADOR') {
      baseModules.push({
        title: 'Gestión de Usuarios',
        description: 'Crear y administrar usuarios del sistema',
        icon: '👤',
        href: '/dashboard/configuration/users',
        color: 'bg-red-100 text-red-600',
        stats: { label: 'Usuarios', value: 'Activos' }
      });
      
      baseModules.push({
        title: 'Configuración',
        description: 'Configuración general del sistema',
        icon: '⚙️',
        href: '/dashboard/configuration',
        color: 'bg-gray-100 text-gray-600',
        stats: { label: 'Módulos', value: '8 configurados' }
      });

      baseModules.push({
        title: 'ChatGPT Admin',
        description: 'Administración y monitoreo de API ChatGPT',
        icon: '🤖',
        href: '/dashboard/chatgpt-admin',
        color: 'bg-purple-100 text-purple-600',
        stats: { label: 'Estado', value: 'Operativa' },
        isSpecial: true // Marcar como especial para renderizado personalizado
      });
    }

    // Agregar caja chica para roles que la necesiten
    if (currentUser.isCashier || currentUser.role === 'SUPER_USER' || currentUser.role === 'ADMINISTRADOR') {
      baseModules.push({
        title: 'Caja Chica',
        description: 'Gestión de gastos menores y compras',
        icon: '💰',
        href: '/dashboard/pettyCash',
        color: 'bg-yellow-100 text-yellow-600',
        stats: { label: 'Sesión', value: 'Activa' }
      });
    }

    return baseModules;
  };

  const modules = getModules();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Módulos del Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <ModuleCard key={index} {...module} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
} 