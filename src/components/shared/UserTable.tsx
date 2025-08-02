'use client';

import React, { useState } from 'react';
import { UserData, deleteUser } from '@/actions/configuration/auth-actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserTableProps {
  users: UserData[];
}

export default function UserTable({ users }: UserTableProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      return;
    }

    setLoading(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Error al desactivar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al desactivar usuario');
    } finally {
      setLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_USER':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADMINISTRADOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'JEFE_SECCION':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'USUARIO_FINAL':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_USER':
        return 'Super Usuario';
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'JEFE_SECCION':
        return 'Jefe de Sección';
      case 'USUARIO_FINAL':
        return 'Usuario Final';
      default:
        return role;
    }
  };

  const getDepartmentDisplayName = (department: string) => {
    switch (department) {
      case 'RECEPCION':
        return 'Recepción';
      case 'RESTAURANTE':
        return 'Restaurante';
      case 'COCINA':
        return 'Cocina';
      case 'EXTERIORES':
        return 'Exteriores';
      case 'HABITACIONES':
        return 'Habitaciones';
      case 'SPA':
        return 'Spa';
      case 'GERENCIA':
        return 'Gerencia';
      case 'PARTTIME':
        return 'Parttime';
      default:
        return department;
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios registrados</h3>
        <p className="text-gray-600 mb-6">Comienza creando el primer usuario del sistema</p>
        <Link
          href="/dashboard/configuration/users/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear Primer Usuario
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Información Personal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Departamento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Último Acceso
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      @{user.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {user.id}
                    </div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {user.email}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {getDepartmentDisplayName(user.department)}
                </div>
                {user.isCashier && (
                  <div className="text-xs text-purple-600 font-medium">
                    🏪 Cajero
                  </div>
                )}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.lastLogin 
                  ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nunca'
                }
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/configuration/users/edit/${user.id}`}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Editar usuario"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={loading === user.id}
                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Desactivar usuario"
                  >
                    {loading === user.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 