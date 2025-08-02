'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menus } from '@/constants';
import LogoutButton from '@/components/shared/LogoutButton';

interface UniversalHorizontalMenuProps {
  currentUser?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isCashier: boolean;
  };
}

export default function UniversalHorizontalMenu({ 
  currentUser
}: UniversalHorizontalMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Obtener menús base según el rol
  const userRoles = currentUser?.role ? [currentUser.role] : [];
  // CAMBIO: Todos los usuarios ven todos los menús (usando el menú completo del SUPER_USER)
  const currentMenus = currentUser && menus.SUPER_USER 
    ? menus.SUPER_USER 
    : [];
  
  // Nota: El menú de caja chica ya está incluido en las constantes para los roles correspondientes
  // No es necesario agregarlo dinámicamente aquí

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        if (activeDropdown && event.target && !(event.target as Element).closest('.dropdown-container')) {
          setActiveDropdown(null);
        }
      } catch (error) {
        console.error('Error in handleClickOutside:', error);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const isActiveSection = (sectionHref: string) => {
    try {
      if (sectionHref === '/dashboard') {
        return pathname === '/' || pathname === '/dashboard';
      }
      return pathname.startsWith(sectionHref);
    } catch (error) {
      console.error('Error in isActiveSection:', error);
      return false;
    }
  };

  const getRoleDisplayName = (userRole: string) => {
    switch (userRole) {
      case 'SUPER_USER': return 'Super Usuario';
      case 'ADMINISTRADOR': return 'Administrador Sistema';
      case 'JEFE_SECCION': return 'Jefe de Sección';
      case 'USUARIO_FINAL': return 'Usuario Final';
      default: return userRole;
    }
  };

  const handleDropdownToggle = (sectionLabel: string, hasItems: boolean) => {
    try {
      if (hasItems) {
        setActiveDropdown(activeDropdown === sectionLabel ? null : sectionLabel);
      }
    } catch (error) {
      console.error('Error in handleDropdownToggle:', error);
    }
  };

  const handleMobileMenuClick = () => {
    try {
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error in handleMobileMenuClick:', error);
    }
  };

  const handleUserDropdownClick = () => {
    try {
      setActiveDropdown(activeDropdown === 'user' ? null : 'user');
    } catch (error) {
      console.error('Error in handleUserDropdownClick:', error);
    }
  };

  return (
    <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admintermas</h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </div>
            </Link>
          </div>

          {/* Navegación Principal - Desktop */}
          <nav className="hidden lg:flex space-x-1 flex-1 justify-center max-w-4xl mx-auto">
            {currentMenus.map((section) => {
              const hasItems = section.items && section.items.length > 0;
              
              return (
                <div key={section.label} className="dropdown-container relative">
                  {hasItems ? (
                    <>
                      <button
                        onClick={() => handleDropdownToggle(section.label, hasItems)}
                        className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          isActiveSection(section.href)
                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <span>{getSectionIcon(section.label)}</span>
                        <span>{section.label}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${activeDropdown === section.label ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {activeDropdown === section.label && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999]">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <div className="text-sm font-medium text-gray-900">{section.label}</div>
                          </div>
                          {section.items!.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`block px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                                pathname === item.href
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700'
                              }`}
                              onClick={() => setActiveDropdown(null)}
                            >
                              <span className="text-lg">{getItemIcon(item.label)}</span>
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={section.href}
                      className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isActiveSection(section.href)
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <span>{getSectionIcon(section.label)}</span>
                      <span>{section.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Usuario y Acciones */}
          <div className="flex items-center space-x-4">
            {/* Usuario Info */}
            <div className="hidden md:flex items-center space-x-4">
              {currentUser && (
                <div className="dropdown-container relative">
                  <button
                    onClick={() => handleUserDropdownClick()}
                    className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-gray-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {currentUser.firstName?.charAt(0) || 'U'}{currentUser.lastName?.charAt(0) || 'S'}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.firstName} {currentUser.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {getRoleDisplayName(currentUser.role)}
                      </div>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${activeDropdown === 'user' ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {activeDropdown === 'user' && (
                    <div className="absolute right-0 mt-2 w-64 max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-gray-900">
                          {currentUser.firstName} {currentUser.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{currentUser.email}</p>
                        <p className="text-xs text-gray-500">{getRoleDisplayName(currentUser.role)}</p>
                      </div>
                      <div className="p-2">
                        <LogoutButton />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menú móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil expandido */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            {/* Usuario info móvil */}
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 mb-4">
              {currentUser ? (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {currentUser.firstName?.charAt(0) || 'U'}{currentUser.lastName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {currentUser.firstName} {currentUser.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{getRoleDisplayName(currentUser.role)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">
                    👤
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Sin usuario</div>
                    <div className="text-sm text-gray-500">Cargando...</div>
                  </div>
                </>
              )}
            </div>

            {/* Navegación móvil */}
            {currentMenus.map((section) => {
              const hasItems = section.items && section.items.length > 0;
              
              return (
                <div key={section.label} className="space-y-1">
                  {hasItems ? (
                    <>
                      <button
                        onClick={() => handleDropdownToggle(section.label, hasItems)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                          isActiveSection(section.href)
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getSectionIcon(section.label)}</span>
                          <span className="font-medium">{section.label}</span>
                        </div>
                        <svg 
                          className={`w-4 h-4 transition-transform ${activeDropdown === section.label ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Subelementos móvil */}
                      {activeDropdown === section.label && (
                        <div className="ml-6 space-y-1">
                          {section.items!.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`block p-3 rounded-lg transition-colors ${
                                pathname === item.href
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-600'
                              }`}
                              onClick={() => handleMobileMenuClick()}
                            >
                              <div className="flex items-center space-x-3">
                                <span>{getItemIcon(item.label)}</span>
                                <span>{item.label}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={section.href}
                      className={`block p-3 rounded-lg transition-colors ${
                        isActiveSection(section.href)
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => handleMobileMenuClick()}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getSectionIcon(section.label)}</span>
                        <span className="font-medium">{section.label}</span>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}

            {/* Logout móvil */}
            {currentUser && (
              <div className="pt-4 border-t border-gray-200">
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares para iconos
function getSectionIcon(sectionLabel: string): string {
  const icons: Record<string, string> = {
    'Contabilidad': '📊',
    'Configuración': '⚙️',
    'Clientes': '👥',
    'Inventario': '📦',
    'Caja Chica': '💰',
    'Reservas': '📅',
    'Compras': '🛒',
    'Ventas': '💼',
  };
  return icons[sectionLabel] || '📋';
}

function getItemIcon(itemLabel: string): string {
  const iconMap: { [key: string]: string } = {
    'Dashboard': '📊',
    'Clientes': '👥',
    'Productos': '📦',
    'Inventario': '📋',
    'Reservas': '📅',
    'Compras': '🛒',
    'Contabilidad': '💰',
    'Caja Chica': '💵',
    'Configuración': '⚙️',
    'Usuarios': '👤',
    'Categorías': '🏷️',
    'Centros de Costo': '🏢',
    'Bodegas': '🏭',
    'Administrar Proveedores': '🏢',
    'Proveedor': '🏢',
    // Iconos específicos para el submenú de reservas
    '✨ Reserva Nueva': '✨',
    '📅 Calendario': '📅',
    '📋 Lista Completa': '📋',
    '📊 Reportes': '📊',
    '🔧 Crear Tradicional': '🔧',
    '🛡️ Panel Administrativo': '🛡️',
    'Historial de Sesiones': '📜',
    // Iconos específicos para el submenú de ventas
    '📋 Presupuestos': '📋',
    '📝 Crear Presupuesto': '📝',
    '📄 Facturas': '📄',
    '💰 Pagos': '💰',
  };
  return iconMap[itemLabel] || '•';
} 