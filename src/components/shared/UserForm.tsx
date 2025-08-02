'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, updateUser, UserData } from '@/actions/configuration/auth-actions';

interface UserFormProps {
  user?: UserData;
  isEdit?: boolean;
}

interface Role {
  id: number;
  value: string;
  label: string;
  description: string;
}

export default function UserForm({ user, isEdit = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'USUARIO_FINAL',
    department: user?.department || 'RECEPCION',
    isCashier: user?.isCashier || false,
    isActive: user?.isActive ?? true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const router = useRouter();

  // Cargar roles al montar el componente
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        // Usando roles por defecto (getAllRoles no implementado aún)
        setRoles([
          { id: 1, value: 'USUARIO_FINAL', label: 'Usuario Final', description: 'Acceso básico al sistema' },
          { id: 2, value: 'JEFE_SECCION', label: 'Jefe de Sección', description: 'Supervisión departamental' },
          { id: 3, value: 'ADMINISTRADOR', label: 'Administrador', description: 'Gestión general del sistema' },
          { id: 4, value: 'SUPER_USER', label: 'Super Usuario', description: 'Acceso completo al sistema' },
          { id: 5, value: 'GARZONES', label: 'Garzones', description: 'Personal de servicio restaurante' },
          { id: 6, value: 'COCINA', label: 'Cocina', description: 'Personal de cocina y preparación' }
        ]);
      } catch (error) {
        console.error('Error cargando roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const departments = [
    { value: 'RECEPCION', label: 'Recepción' },
    { value: 'RESTAURANTE', label: 'Restaurante' },
    { value: 'COCINA', label: 'Cocina' },
    { value: 'EXTERIORES', label: 'Exteriores' },
    { value: 'HABITACIONES', label: 'Habitaciones' },
    { value: 'SPA', label: 'Spa' },
    { value: 'GERENCIA', label: 'Gerencia' },
    { value: 'PARTTIME', label: 'Parttime' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🚀 UserForm: Iniciando envío del formulario');
    console.log('📝 UserForm: Datos del formulario:', formData);

    // Validaciones
    if (!isEdit && formData.password !== formData.confirmPassword) {
      console.error('❌ UserForm: Las contraseñas no coinciden');
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (!isEdit && formData.password.length < 6) {
      console.error('❌ UserForm: Contraseña muy corta');
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      
      if (!isEdit) {
        formDataObj.append('username', formData.username);
        formDataObj.append('password', formData.password);
      }
      
      formDataObj.append('email', formData.email);
      formDataObj.append('firstName', formData.firstName);
      formDataObj.append('lastName', formData.lastName);
      formDataObj.append('role', formData.role);
      formDataObj.append('department', formData.department);
      formDataObj.append('isCashier', formData.isCashier.toString());
      
      if (isEdit) {
        formDataObj.append('isActive', formData.isActive.toString());
        if (formData.password) {
          formDataObj.append('newPassword', formData.password);
        }
      }

      console.log('📤 UserForm: Enviando FormData:', Object.fromEntries(formDataObj.entries()));

      const result = isEdit && user 
        ? await updateUser(user.id, formDataObj)
        : await createUser(formDataObj);

      console.log('📥 UserForm: Resultado recibido:', result);

      if (result.success) {
        console.log('✅ UserForm: Usuario creado/actualizado exitosamente');
        router.push('/dashboard/configuration/users');
        router.refresh();
      } else {
        console.error('❌ UserForm: Error en la respuesta:', result.error);
        setError(result.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('❌ UserForm: Error en catch:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información de Acceso */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Información de Acceso
          </h3>
          
          {!isEdit && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: jperez"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Debe ser único y sin espacios
              </p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="usuario@empresa.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {isEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required={!isEdit}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder={isEdit ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Repite la contraseña"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Información Personal
          </h3>
          
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Pérez"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Departamento *
            </label>
            <select
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rol del Sistema *
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || loadingRoles}
            >
              {loadingRoles ? (
                <option value="">Cargando roles...</option>
              ) : (
                roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))
              )}
            </select>
            {loadingRoles && (
              <p className="text-sm text-gray-500 mt-1">
                Cargando roles del sistema...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Opciones adicionales */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuraciones Adicionales</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="isCashier"
              name="isCashier"
              type="checkbox"
              checked={formData.isCashier}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="isCashier" className="ml-3 block text-sm text-gray-700">
              <span className="font-medium">Funciones de Cajero</span>
              <span className="block text-gray-500 text-xs">
                Permite acceso a caja chica, manejo de dinero y operaciones de caja
              </span>
            </label>
          </div>

          {isEdit && (
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="isActive" className="ml-3 block text-sm text-gray-700">
                <span className="font-medium">Usuario Activo</span>
                <span className="block text-gray-500 text-xs">
                  Desmarcar para desactivar el acceso del usuario al sistema
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEdit ? 'Actualizando...' : 'Creando...'}
            </div>
          ) : (
            isEdit ? 'Actualizar Usuario' : 'Crear Usuario'
          )}
        </button>
      </div>
    </form>
  );
} 