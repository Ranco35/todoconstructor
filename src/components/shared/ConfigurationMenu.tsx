'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ConfigurationMenuItem {
  title: string;
  description: string;
  icon: string;
  href: string;
  isActive?: boolean;
}

const configurationMenuItems: ConfigurationMenuItem[] = [
  {
    title: 'Categorías',
    description: 'Gestionar categorías de productos',
    icon: '📂',
    href: '/configuration/category'
  },
  {
    title: 'Inventario',
    description: 'Control de stock y productos',
    icon: '📦',
    href: '/configuration/inventory'
  },
  {
    title: 'Bodegas',
    description: 'Gestión de bodegas y ubicaciones',
    icon: '🏭',
    href: '/configuration/inventory/warehouses'
  },
  {
    title: 'Productos',
    description: 'Catálogo de productos',
    icon: '🛍️',
    href: '/configuration/products'
  },
  {
    title: 'Proveedores',
    description: 'Gestión de proveedores',
    icon: '🏪',
    href: '/configuration/admin-suppliers'
  },
  {
    title: 'Etiquetas',
    description: 'Gestión de etiquetas para clientes y proveedores',
    icon: '🏷️',
    href: '/configuration/tags'
  },
  {
    title: 'Usuarios',
    description: 'Administración de usuarios',
    icon: '👥',
    href: '/configuration/users'
  }
];

interface ConfigurationMenuProps {
  variant?: 'grid' | 'list';
  showHeader?: boolean;
  className?: string;
}

export function ConfigurationMenu({ 
  variant = 'grid', 
  showHeader = true, 
  className = '' 
}: ConfigurationMenuProps) {
  const pathname = usePathname();

  const isComingSoon = (href: string) => {
    return href.includes('products') || href.includes('admin-suppliers');
  };

  if (variant === 'list') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        {showHeader && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
            <p className="text-sm text-gray-600">Gestión de categorías, productos e inventario</p>
          </div>
        )}
        <div className="p-2">
          {configurationMenuItems.map((item, index) => (
            <div key={index} className="mb-1">
              {isComingSoon(item.href) ? (
                <div className="flex items-center px-3 py-2 text-gray-400 cursor-not-allowed">
                  <span className="text-lg mr-3">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs">Próximamente</div>
                  </div>
                </div>
              ) : (
                <Link 
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    pathname === item.href 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración
          </h1>
          <p className="text-gray-600">
            Gestión de categorías, productos e inventario
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configurationMenuItems.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{item.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            </div>
            <p className="text-gray-600 mb-4">{item.description}</p>
            {isComingSoon(item.href) ? (
              <span className="text-gray-400">Próximamente</span>
            ) : (
              <Link 
                href={item.href}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Ir a {item.title} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 