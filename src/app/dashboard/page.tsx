'use client';

import Link from 'next/link';

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-blue-600 rounded-xl p-6 text-white mb-8">
        <h1 className="text-3xl font-bold">🔨 Dashboard TC Constructor - SISTEMA DE FERRETERÍA</h1>
        <p>Bienvenido al sistema de gestión integral para construcción</p>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Módulos del Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* NUEVAS TARJETAS - DESTACADAS */}
        {/* MÓDULOS COMENTADOS - NO RELEVANTES PARA FERRETERÍA
        <Link href="/dashboard/garzones">
          <div className="bg-orange-300 border-4 border-orange-500 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">👨‍🍳</div>
            <h3 className="text-lg font-bold text-gray-900">🟠 NUEVO: Panel Garzones</h3>
            <p className="text-sm text-gray-600">Dashboard para garzones del restaurante</p>
          </div>
        </Link>

        <Link href="/dashboard/cocina">
          <div className="bg-red-300 border-4 border-red-500 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🧑‍🍳</div>
            <h3 className="text-lg font-bold text-gray-900">🔴 NUEVO: Panel Cocina</h3>
            <p className="text-sm text-gray-600">Dashboard para personal de cocina</p>
          </div>
        </Link>
        */}

        <Link href="/dashboard/configuration/users">
          <div className="bg-indigo-300 border-4 border-indigo-500 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-lg font-bold text-gray-900">🔵 ACTUALIZADO: Gestión Usuarios</h3>
            <p className="text-sm text-gray-600">Gestión completa de usuarios</p>
          </div>
        </Link>

        {/* MÓDULOS PRINCIPALES */}
        {/* MÓDULO COMENTADO - NO RELEVANTE PARA FERRETERÍA
        <Link href="/dashboard/reservations">
          <div className="bg-blue-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">📅</div>
            <h3 className="text-lg font-bold text-gray-900">Reservas</h3>
            <p className="text-sm text-gray-600">Gestionar reservas de clientes</p>
          </div>
        </Link>
        */}

        <Link href="/dashboard/customers">
          <div className="bg-green-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🏢</div>
            <h3 className="text-lg font-bold text-gray-900">Clientes</h3>
            <p className="text-sm text-gray-600">Constructoras y empresas</p>
          </div>
        </Link>

        <Link href="/dashboard/products">
          <div className="bg-purple-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="text-lg font-bold text-gray-900">Productos</h3>
            <p className="text-sm text-gray-600">Herramientas y materiales</p>
          </div>
        </Link>

        <Link href="/dashboard/pos">
          <div className="bg-cyan-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🏪</div>
            <h3 className="text-lg font-bold text-gray-900">POS Ventas</h3>
            <p className="text-sm text-gray-600">Punto de venta ferretería</p>
          </div>
        </Link>

        <Link href="/dashboard/inventory">
          <div className="bg-yellow-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🏗️</div>
            <h3 className="text-lg font-bold text-gray-900">Inventario</h3>
            <p className="text-sm text-gray-600">Stock de materiales</p>
          </div>
        </Link>

        <Link href="/dashboard/accounting">
          <div className="bg-emerald-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="text-lg font-bold text-gray-900">Contabilidad</h3>
            <p className="text-sm text-gray-600">Gestión financiera</p>
          </div>
        </Link>

        <Link href="/dashboard/suppliers">
          <div className="bg-teal-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🏭</div>
            <h3 className="text-lg font-bold text-gray-900">Proveedores</h3>
            <p className="text-sm text-gray-600">Distribuidores y fabricantes</p>
          </div>
        </Link>

        <Link href="/dashboard/purchases">
          <div className="bg-rose-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="text-lg font-bold text-gray-900">Compras</h3>
            <p className="text-sm text-gray-600">Gestión de compras</p>
          </div>
        </Link>

        <Link href="/dashboard/sales">
          <div className="bg-lime-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-bold text-gray-900">Ventas</h3>
            <p className="text-sm text-gray-600">Análisis de ventas</p>
          </div>
        </Link>

        <Link href="/dashboard/pettyCash">
          <div className="bg-amber-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">💵</div>
            <h3 className="text-lg font-bold text-gray-900">Caja Chica</h3>
            <p className="text-sm text-gray-600">Gestión de caja chica</p>
          </div>
        </Link>

        <Link href="/dashboard/emails">
          <div className="bg-slate-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">📧</div>
            <h3 className="text-lg font-bold text-gray-900">Emails</h3>
            <p className="text-sm text-gray-600">Gestión de correos</p>
          </div>
        </Link>

        <Link href="/dashboard/whatsapp-bot">
          <div className="bg-green-200 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="text-lg font-bold text-gray-900">WhatsApp Bot</h3>
            <p className="text-sm text-gray-600">Bot de WhatsApp</p>
          </div>
        </Link>

        <Link href="/dashboard/ai-assistant">
          <div className="bg-violet-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="text-lg font-bold text-gray-900">Asistente AI</h3>
            <p className="text-sm text-gray-600">Asistente inteligente</p>
          </div>
        </Link>

        <Link href="/dashboard/configuration">
          <div className="bg-gray-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="text-lg font-bold text-gray-900">Configuración</h3>
            <p className="text-sm text-gray-600">Configuración del sistema</p>
          </div>
        </Link>

        <Link href="/dashboard/admin">
          <div className="bg-red-100 rounded-xl p-6 hover:shadow-lg">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="text-lg font-bold text-gray-900">Administración</h3>
            <p className="text-sm text-gray-600">Panel de administración</p>
          </div>
        </Link>

      </div>

      <div className="mt-8 bg-orange-50 border-l-4 border-orange-400 p-4">
        <h3 className="text-lg font-bold text-orange-800">🔨 SISTEMA DE FERRETERÍA COMPLETO</h3>
        <ul className="mt-2 text-sm text-orange-700 list-disc list-inside">
          <li><strong>Gestión de Inventario:</strong> Control completo de herramientas y materiales</li>
          <li><strong>POS Especializado:</strong> Punto de venta optimizado para ferretería</li>
          <li><strong>Gestión de Clientes:</strong> Administración de constructoras y contratistas</li>
          <li><strong>Control de Proveedores:</strong> Gestión de distribuidores y fabricantes</li>
        </ul>
      </div>
    </div>
  );
}

export default DashboardPage; 