'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, User, Phone, Mail, MapPin, Edit, Trash2, Users, Eye } from 'lucide-react';
import { getClients, deleteClient, getClientStats } from '@/actions/clients';
import { Client, ClientType } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import ClientImportExport from '@/components/clients/ClientImportExport';

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

export default function CustomersClientComponent() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [clientes, setClientes] = useState<Client[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    empresas: 0,
    personas: 0,
    frecuentes: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Client | null>(null);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      console.log('=== CARGANDO ESTADÍSTICAS DE CLIENTES ===');
      const result = await getClientStats();
      if (result.success) {
        console.log('Estadísticas obtenidas:', result.data);
        setStats(result.data);
      } else {
        console.error('Error obteniendo estadísticas:', result.error);
        toast.error(result.error || 'Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error en cargarEstadisticas:', error);
      toast.error('Error al cargar estadísticas');
    }
  };

  // Cargar clientes
  const cargarClientes = async () => {
    setIsLoading(true);
    try {
      console.log('=== CARGANDO CLIENTES ===');
      const result = await getClients({ page: 1, pageSize: 100 });
      if (result.success) {
        console.log('✅ Clientes obtenidos:', result.data.clients.length);
        console.log('📋 Total en BD:', result.data.pagination.totalCount);
        console.log('👥 Lista de clientes:', result.data.clients.map(c => ({
          id: c.id,
          nombre: c.nombrePrincipal,
          tipo: c.tipoCliente,
          email: c.email
        })));
        setClientes(result.data.clients);
      } else {
        console.error('❌ Error obteniendo clientes:', result.error);
        toast.error(result.error || 'Error al cargar clientes');
      }
    } catch (error) {
      console.error('💥 Error en cargarClientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    console.log('Inicializando CustomersClientComponent...');
    Promise.all([
      cargarEstadisticas(),
      cargarClientes()
    ]).then(() => {
      console.log('Datos iniciales cargados');
    });
  }, []);

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const nombreCompleto = cliente.tipoCliente === ClientType.EMPRESA 
      ? cliente.razonSocial || cliente.nombrePrincipal
      : `${cliente.nombrePrincipal} ${cliente.apellido || ''}`.trim();
    
    const coincideBusqueda = nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
                            cliente.rut?.includes(busqueda) ||
                            cliente.email?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideTipo = filtroTipo === 'todos' || cliente.tipoCliente === filtroTipo;
    
    return coincideBusqueda && coincideTipo;
  });

  // Obtener contacto principal
  const getContactoPrincipal = (cliente: Client) => {
    const contactoPrincipal = cliente.contactos?.find(c => c.esContactoPrincipal);
    if (contactoPrincipal) {
      return `${contactoPrincipal.nombre} ${contactoPrincipal.apellido || ''}`.trim();
    }
    return '';
  };

  // Obtener dirección completa
  const getDireccionCompleta = (cliente: Client) => {
    const partes = [
      cliente.calle,
      cliente.calle2,
      cliente.ciudad,
      cliente.region
    ].filter(Boolean);
    return partes.join(', ');
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      const result = await deleteClient(clienteToDelete.id);
      if (result.success) {
        toast.success('Cliente eliminado correctamente');
        // Recargar tanto clientes como estadísticas
        await Promise.all([
          cargarEstadisticas(),
          cargarClientes()
        ]);
      } else {
        toast.error(result.error || 'Error al eliminar el cliente');
      }
    } catch (error) {
      toast.error('Error al eliminar el cliente');
    } finally {
      setIsDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  // Función para recargar datos después de crear un cliente
  const recargarDatos = async () => {
    console.log('=== RECARGANDO DATOS DESPUÉS DE CAMBIOS ===');
    console.log('🔄 Recargando estadísticas y clientes...');
    await Promise.all([
      cargarEstadisticas(),
      cargarClientes()
    ]);
    console.log('✅ Recarga completada');
  };

  // Exponer función para uso externo (ej: después de crear cliente)
  useEffect(() => {
    (window as any).recargarDatosClientes = recargarDatos;
    return () => {
      delete (window as any).recargarDatosClientes;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header del Módulo */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Módulo de Clientes</h1>
            <p className="text-green-100">
              Gestión completa de la base de datos de clientes
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">👥</div>
            <div className="text-green-200">Sistema de Clientes</div>
          </div>
        </div>
      </div>

      {/* Estadísticas REALES del Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clientes"
          value={stats.total.toString()}
          icon="👥"
          color="bg-green-100 text-green-600"
          change={`${stats.activos} activos`}
        />
        <StatCard
          title="Empresas"
          value={stats.empresas.toString()}
          icon="🏢"
          color="bg-blue-100 text-blue-600"
          change={`${Math.round((stats.empresas / Math.max(stats.total, 1)) * 100)}% del total`}
        />
        <StatCard
          title="Personas"
          value={stats.personas.toString()}
          icon="👤"
          color="bg-purple-100 text-purple-600"
          change={`${Math.round((stats.personas / Math.max(stats.total, 1)) * 100)}% del total`}
        />
        <StatCard
          title="Clientes Frecuentes"
          value={stats.frecuentes.toString()}
          icon="⭐"
          color="bg-yellow-100 text-yellow-600"
          change={`${Math.round((stats.frecuentes / Math.max(stats.total, 1)) * 100)}% premium`}
        />
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4 text-sm">
        <h3 className="font-semibold mb-2">🔍 Información de Debug:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Estadísticas BD:</strong>
            <div>Total: {stats.total}</div>
            <div>Activos: {stats.activos}</div>
            <div>Empresas: {stats.empresas}</div>
            <div>Personas: {stats.personas}</div>
          </div>
          <div>
            <strong>Clientes Cargados:</strong>
            <div>En memoria: {clientes.length}</div>
            <div>Filtrados: {clientesFiltrados.length}</div>
            <div>Última actualización: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
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
              title="Nuevo Cliente"
              description="Registrar un nuevo cliente en el sistema"
              icon="➕"
              href="/dashboard/customers/create"
              color="bg-green-50 border-green-200 hover:bg-green-100"
            />
            <QuickAction
              title="Ver Lista Completa"
              description="Ver y gestionar todos los clientes"
              icon="📋"
              href="/dashboard/customers/list"
              color="bg-blue-50 border-blue-200 hover:bg-blue-100"
            />
            <QuickAction
              title="Reporte de Etiquetas"
              description="Generar reportes y analytics por etiquetas"
              icon="📊"
              href="/dashboard/customers/reports/tags"
              color="bg-purple-50 border-purple-200 hover:bg-purple-100"
            />
            <QuickAction
              title="Importar/Exportar"
              description="Gestión avanzada de importación y exportación"
              icon="📁"
              href="/dashboard/customers/import-export"
              color="bg-orange-50 border-orange-200 hover:bg-orange-100"
            />
          </div>
          
          {/* Importación/Exportación de Excel */}
          {/* BLOQUE ELIMINADO: Ya no se muestra el bloque Excel Import/Export aquí, todo está en la nueva página avanzada. */}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Estadísticas del Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Total Clientes</span>
              <span className="text-sm font-semibold text-blue-600">{clientes.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Clientes Empresa</span>
              <span className="text-sm font-semibold text-green-600">{stats.empresas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Clientes Persona</span>
              <span className="text-sm font-semibold text-purple-600">{stats.personas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Total Contactos</span>
              <span className="text-sm font-semibold text-orange-600">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clientes Recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🆕</span>
          Últimos Clientes Registrados
        </h3>
        <div className="space-y-3">
          {clientes.slice(0, 3).map((cliente, index) => {
            const nombreCompleto = cliente.tipoCliente === ClientType.EMPRESA 
              ? cliente.razonSocial || cliente.nombrePrincipal
              : `${cliente.nombrePrincipal} ${cliente.apellido || ''}`.trim();
            
            const iniciales = nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            
            const colors = [
              'bg-green-600',
              'bg-blue-600', 
              'bg-purple-600'
            ];

            return (
              <div key={cliente.id} className={`flex items-center justify-between p-4 bg-${colors[index] === 'bg-green-600' ? 'green' : colors[index] === 'bg-blue-600' ? 'blue' : 'purple'}-50 rounded-lg border border-${colors[index] === 'bg-green-600' ? 'green' : colors[index] === 'bg-blue-600' ? 'blue' : 'purple'}-200`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${colors[index]} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {iniciales}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{nombreCompleto}</p>
                    <p className="text-sm text-gray-600">{cliente.email || 'Sin email'}</p>
                    
                    {/* Etiquetas del cliente */}
                    {cliente.etiquetas && cliente.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cliente.etiquetas.slice(0, 2).map((tagAssignment) => (
                          <Badge
                            key={tagAssignment.etiqueta?.id}
                            variant="outline"
                            style={{ 
                              borderColor: tagAssignment.etiqueta?.color,
                              color: tagAssignment.etiqueta?.color,
                              fontSize: '10px'
                            }}
                            className="text-xs px-1 py-0"
                          >
                            {tagAssignment.etiqueta?.nombre}
                          </Badge>
                        ))}
                        {cliente.etiquetas.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0" style={{ fontSize: '10px' }}>
                            +{cliente.etiquetas.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {cliente.tipoCliente === ClientType.EMPRESA ? 'Empresa' : 'Persona'}
                  </p>
                  <p className="text-xs text-gray-500">{cliente.rut || 'Sin RUT'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enlaces a Funcionalidades Existentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-3">🔗</span>
          Funcionalidades del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/customers" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium text-gray-900">Lista de Clientes</p>
                <p className="text-sm text-gray-600">Ver todos los clientes</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/customers/create" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">➕</span>
              <div>
                <p className="font-medium text-gray-900">Crear Cliente</p>
                <p className="text-sm text-gray-600">Nuevo registro</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/customers/import-export" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📁</span>
              <div>
                <p className="font-medium text-gray-900">Importar/Exportar</p>
                <p className="text-sm text-gray-600">Gestión avanzada</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 