import React from 'react';
import UserForm from '@/components/shared/UserForm';
import Link from 'next/link';


// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default function CreateUserPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard/configuration/users"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
              <p className="text-gray-600 mt-2">
                Registra un nuevo usuario en el sistema con sus roles y permisos
              </p>
            </div>
          </div>
        </div>

        {/* Información importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Información Importante sobre Usuarios
              </h3>
              <div className="text-blue-800 space-y-2">
                <p>• <strong>Username:</strong> Debe ser único en todo el sistema</p>
                <p>• <strong>Email:</strong> Se usará para notificaciones y recuperación de contraseña</p>
                <p>• <strong>Roles:</strong> Determinan los permisos y accesos del usuario</p>
                <p>• <strong>Cajero:</strong> Permite acceso a funciones de caja y manejo de dinero</p>
                <p>• <strong>Departamento:</strong> Organiza los usuarios por áreas de trabajo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Datos del Usuario</h2>
            <p className="text-sm text-gray-600 mt-1">
              Completa todos los campos requeridos para crear el usuario
            </p>
          </div>
          
          <div className="p-6">
            <UserForm />
          </div>
        </div>

        {/* Información sobre roles */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guía de Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-medium text-gray-900">Super Usuario</h4>
                <p className="text-sm text-gray-600">
                  Control total del sistema, gestión de usuarios, configuración avanzada y acceso a todas las funciones.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Administrador</h4>
                <p className="text-sm text-gray-600">
                  Gestión operativa, productos, inventario, reportes y supervisión general sin configuración de sistema.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900">Jefe de Sección</h4>
                <p className="text-sm text-gray-600">
                  Supervisión departamental, aprobación de transacciones, gestión de su equipo y área específica.
                </p>
              </div>
              
              <div className="border-l-4 border-gray-500 pl-4">
                <h4 className="font-medium text-gray-900">Usuario Final</h4>
                <p className="text-sm text-gray-600">
                  Operaciones diarias como ventas, consultas, manejo de caja según permisos asignados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 