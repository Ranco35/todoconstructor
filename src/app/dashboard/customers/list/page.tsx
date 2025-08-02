'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Plus, Building2, User, Phone, Mail, MapPin, Edit, Trash2, Users, Filter, MoreHorizontal, Eye, ChevronDown, Star, Crown, Target, Gift, Factory, BarChart3, Trees, Tag } from 'lucide-react';
import { getClients, deleteClient, assignTagsToMultipleClients } from '@/actions/clients';
import { getClientTags } from '@/actions/clients/tags';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { Client, ClientType, ClientTag } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import PaginationControls from '@/components/shared/PaginationControls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mapeo de iconos para etiquetas
const iconMap = {
  star: Star,
  crown: Crown,
  'map-pin': MapPin,
  building: Building2,
  target: Target,
  gift: Gift,
  factory: Factory,
  'bar-chart-3': BarChart3,
  trees: Trees,
  tag: Tag,
  user: User
};

interface ClientTableProps {
  clients: Client[];
  userRole: string;
  onDelete: (id: number) => void;
  selectedClients: number[];
  onSelectClient: (clientId: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewDetails: (clientId: number) => void;
}

function ClientTable({ clients, userRole, onDelete, selectedClients, onSelectClient, onSelectAll, onViewDetails }: ClientTableProps) {
  const canEdit = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(userRole);
  const canDelete = ['SUPER_USER', 'ADMINISTRADOR'].includes(userRole);

  const getTagIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Tag;
  };

  const getDisplayName = (client: Client) => {
    if (client.tipoCliente === ClientType.EMPRESA) {
      return client.razonSocial || client.nombrePrincipal;
    }
    return `${client.nombrePrincipal} ${client.apellido || ''}`.trim();
  };

  const getClientTypeIcon = (tipo: ClientType) => {
    return tipo === ClientType.EMPRESA ? (
      <Building2 className="h-4 w-4 text-blue-600" />
    ) : (
      <User className="h-4 w-4 text-green-600" />
    );
  };

  const getClientTypeBadge = (tipo: ClientType) => {
    return tipo === ClientType.EMPRESA ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Building2 className="h-3 w-3 mr-1" />
        Empresa
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <User className="h-3 w-3 mr-1" />
        Persona
      </Badge>
    );
  };

  const getStatusBadge = (estado: string) => {
    return estado === 'activo' ? (
      <Badge className="bg-green-100 text-green-800">Activo</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Inactivo</Badge>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Checkbox
                  checked={clients.length > 0 && selectedClients.length === clients.length}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Etiquetas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Compra
              </th>
              {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => onSelectClient(client.id, checked as boolean)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getClientTypeIcon(client.tipoCliente)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div 
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                        onDoubleClick={() => onViewDetails(client.id)}
                        title="Doble click para ver detalles"
                      >
                        {getDisplayName(client)}
                      </div>
                      {client.rut && (
                        <div className="text-sm text-gray-500">{client.rut}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getClientTypeBadge(client.tipoCliente)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {client.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {client.email}
                      </div>
                    )}
                    {client.telefono && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {client.telefono}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(client.estado)}
                </td>
                <td className="px-6 py-4">
                  {client.etiquetas && client.etiquetas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {client.etiquetas.slice(0, 2).map((tagAssignment) => {
                        const IconComponent = getTagIcon(tagAssignment.etiqueta?.icono || 'tag');
                        return (
                          <Badge
                            key={tagAssignment.etiqueta?.id}
                            variant="outline"
                            style={{ 
                              backgroundColor: tagAssignment.etiqueta?.color + '20',
                              borderColor: tagAssignment.etiqueta?.color,
                              color: tagAssignment.etiqueta?.color 
                            }}
                            className="text-xs flex items-center gap-1"
                          >
                            <IconComponent size={10} />
                            {tagAssignment.etiqueta?.nombre}
                          </Badge>
                        );
                      })}
                      {client.etiquetas.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.etiquetas.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sin etiquetas</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.fechaUltimaCompra ? (
                    new Date(client.fechaUltimaCompra).toLocaleDateString('es-CL')
                  ) : (
                    'Sin compras'
                  )}
                </td>
                {(canEdit || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/customers/${client.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/customers/${client.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={async (e) => {
                              e.preventDefault();
                              const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar el cliente ${getDisplayName(client)}?`);
                              if (confirmed) {
                                try {
                                  const result = await deleteClient(client.id);
                                  if (result.success) {
                                    onDelete(client.id);
                                    toast.success('Cliente eliminado correctamente');
                                  } else {
                                    toast.error(result.error || 'Error al eliminar cliente');
                                  }
                                } catch (error) {
                                  toast.error('Error al eliminar cliente');
                                }
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClientListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTag, setFilterTag] = useState('todos');
  const [availableTags, setAvailableTags] = useState<ClientTag[]>([]);
  
  // Estados para asignación masiva
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignTagId, setBulkAssignTagId] = useState<string>('');
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);

  // Leer parámetros de URL para paginación
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 20;

  // Cargar rol del usuario y etiquetas
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role) {
          setUserRole(user.role);
          console.log('🔐 Rol de usuario obtenido:', user.role);
        }
      } catch (error) {
        console.error('Error obteniendo rol:', error);
      }
    };

    const loadTags = async () => {
      try {
        console.log('🔍 Cargando etiquetas de clientes...');
        const result = await getClientTags();
        console.log('📊 Resultado getClientTags:', result);
        if (result && result.success) {
          setAvailableTags(result.data || []);
          console.log(`✅ Etiquetas cargadas: ${result.data?.length || 0} etiquetas`);
        } else {
          console.error('❌ Error en getClientTags:', result?.error || 'Resultado undefined');
          setAvailableTags([]); // Establecer array vacío como fallback
        }
      } catch (error) {
        console.error('💥 Error cargando etiquetas:', error);
        setAvailableTags([]); // Establecer array vacío como fallback
      }
    };

    loadUserRole();
    loadTags();
  }, []);

  // Cargar clientes
  const loadClients = async () => {
    setLoading(true);
    try {
      console.log(`🔍 Consultando clientes - Página: ${currentPage}, Tamaño: ${pageSize}, Rango: ${(currentPage - 1) * pageSize}-${currentPage * pageSize - 1}`);
      
      const result = await getClients({
        page: currentPage,
        pageSize,
        search: debouncedSearchTerm,
        tipoCliente: filterType !== 'todos' ? filterType as ClientType : undefined,
        estado: filterStatus !== 'todos' ? filterStatus as any : undefined,
        etiquetas: filterTag !== 'todos' ? [parseInt(filterTag)] : undefined,
      });

      // Log solo si hay errores
      if (!result || !result.success) {
        console.log('📊 Resultado getClients:', result);
      }

      if (!result) {
        console.error('❌ getClients devolvió undefined');
        toast.error('Error: respuesta indefinida del servidor');
        setClients([]);
        setTotalPages(1);
        setTotalCount(0);
        return;
      }

      if (result.success) {
        setClients(result.data.clients);
        setTotalPages(result.data.pagination.totalPages);
        setTotalCount(result.data.pagination.totalCount || result.data.pagination.total);
        
        console.log(`📊 Resultado consulta - Clientes encontrados: ${result.data.clients.length}, Total en BD: ${result.data.pagination.totalCount || result.data.pagination.total}`);
      } else {
        console.error('❌ Error cargando clientes:', result.error);
        toast.error(result.error || 'Error al cargar clientes');
        setClients([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('💥 Error en loadClients:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms de debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar clientes cuando cambien los filtros o paginación
  useEffect(() => {
    loadClients();
  }, [currentPage, pageSize, debouncedSearchTerm, filterType, filterStatus, filterTag]);

  // Debounce para resetear paginación cuando cambien filtros
  useEffect(() => {
    if (debouncedSearchTerm || filterType !== 'todos' || filterStatus !== 'todos' || filterTag !== 'todos') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', '1');
      const newUrl = url.toString();
      if (newUrl !== window.location.href && currentPage !== 1) {
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [debouncedSearchTerm, filterType, filterStatus, filterTag]);

  // Resetear a página 1 cuando cambien los filtros - ahora se maneja via URL
  // (PaginationControls se encarga de esto automáticamente)

  const handleDelete = (id: number) => {
    setClients(prev => prev.filter(client => client.id !== id));
    setTotalCount(prev => prev - 1);
    setSelectedClients(prev => prev.filter(clientId => clientId !== id));
    toast.success('Cliente eliminado correctamente');
  };

  // Funciones para selección masiva
  const handleSelectClient = (clientId: number, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleBulkAssignTag = async () => {
    if (!bulkAssignTagId || selectedClients.length === 0) {
      toast.error('Selecciona una etiqueta y al menos un cliente');
      return;
    }

    setBulkAssignLoading(true);
    try {
      const result = await assignTagsToMultipleClients(
        selectedClients, 
        parseInt(bulkAssignTagId)
      );

      if (result.success) {
        const { assigned, total, existing } = result.data;
        let message = '';
        
        if (assigned === 0) {
          message = 'Todos los clientes ya tenían esta etiqueta asignada';
        } else if (existing && existing > 0) {
          message = `Etiqueta asignada a ${assigned} cliente(s) nuevos. ${existing} ya la tenían.`;
        } else {
          message = `Etiqueta asignada exitosamente a ${assigned} cliente(s)`;
        }
        
        toast.success(message);
        setShowBulkAssignModal(false);
        setSelectedClients([]);
        setBulkAssignTagId('');
        // Recargar clientes para mostrar las nuevas etiquetas
        loadClients();
      } else {
        toast.error(result.error || 'Error al asignar etiquetas');
      }
    } catch (error) {
      toast.error('Error al asignar etiquetas');
    } finally {
      setBulkAssignLoading(false);
    }
  };

  // Obtener información de compatibilidad de la etiqueta seleccionada
  const getSelectedTagInfo = () => {
    if (!bulkAssignTagId) return null;
    
    const selectedTag = availableTags.find(tag => tag.id.toString() === bulkAssignTagId);
    if (!selectedTag) return null;

    const selectedClientObjects = clients.filter(client => selectedClients.includes(client.id));
    const empresaCount = selectedClientObjects.filter(client => client.tipoCliente === 'EMPRESA').length;
    const personaCount = selectedClientObjects.filter(client => client.tipoCliente === 'PERSONA').length;
    
    return {
      tag: selectedTag,
      empresaCount,
      personaCount,
      isCompatible: selectedTag.tipoAplicacion === 'todos' || 
                   (selectedTag.tipoAplicacion === 'empresa' && personaCount === 0) ||
                   (selectedTag.tipoAplicacion === 'persona' && empresaCount === 0)
    };
  };

  const handleViewDetails = (clientId: number) => {
    router.push(`/dashboard/customers/${clientId}`);
  };

  const canCreate = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(userRole);

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Lista de Clientes</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona todos los clientes del sistema</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lista de Clientes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona todos los clientes del sistema ({totalCount} clientes)
            </p>
          </div>
          {canCreate && (
            <Link href="/dashboard/customers/create">
              <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus size={16} />
                Nuevo Cliente
              </Button>
            </Link>
          )}
        </div>

        {/* Filtros de Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-gray-500" />
            <h3 className="text-base font-medium text-gray-900">Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Nombre, RUT, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cliente
              </label>
              <div className="relative">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    <SelectItem value="empresa">Empresas</SelectItem>
                    <SelectItem value="persona">Personas</SelectItem>
                  </SelectContent>
                </Select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="relative">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="inactivo">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiqueta
              </label>
              <div className="relative">
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="todos">Todas las etiquetas</SelectItem>
                    {availableTags.map(tag => {
                      const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Tag;
                      return (
                        <SelectItem key={tag.id} value={tag.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-5 h-5 rounded flex items-center justify-center text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              <IconComponent size={12} />
                            </div>
                            {tag.nombre}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Clientes */}
        {clients.length > 0 ? (
          <>
            <ClientTable 
              clients={clients} 
              userRole={userRole}
              onDelete={handleDelete}
              selectedClients={selectedClients}
              onSelectClient={handleSelectClient}
              onSelectAll={handleSelectAll}
              onViewDetails={handleViewDetails}
            />
            
            {/* Paginación */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize.toString()}
              totalCount={totalCount}
              currentCount={clients.length}
              basePath="/dashboard/customers/list"
              itemName="clientes"
            />
            
            {/* Botón flotante para asignación masiva */}
            {selectedClients.length > 0 && (
              <div className="fixed bottom-6 right-6 z-50">
                <Button 
                  onClick={() => setShowBulkAssignModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                  size="lg"
                >
                  Asignar Etiqueta a {selectedClients.length} cliente(s)
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <User size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
            <p className="text-gray-500 mb-4">
              {debouncedSearchTerm || filterType !== 'todos' || filterStatus !== 'todos' || filterTag !== 'todos'
                ? 'Intenta ajustar los filtros de búsqueda o agrega un nuevo cliente.'
                : 'Comienza creando tu primer cliente.'
              }
            </p>
            {canCreate && !debouncedSearchTerm && filterType === 'todos' && filterStatus === 'todos' && filterTag === 'todos' && (
              <Link href="/dashboard/customers/create">
                <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </Button>
              </Link>
            )}
          </div>
        )}

      {/* Modal para asignación masiva de etiquetas */}
      <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Asignar Etiqueta a {selectedClients.length} Cliente(s)
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Etiqueta
              </label>
              <Select value={bulkAssignTagId} onValueChange={setBulkAssignTagId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una etiqueta" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availableTags.map(tag => {
                    const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Tag;
                    return (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            <IconComponent size={12} />
                          </div>
                          {tag.nombre}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Información de compatibilidad */}
            {(() => {
              const tagInfo = getSelectedTagInfo();
              if (!tagInfo) return null;

              return (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Clientes seleccionados:</strong> {selectedClients.length} total
                    {tagInfo.empresaCount > 0 && (
                      <div>• {tagInfo.empresaCount} Empresa(s)</div>
                    )}
                    {tagInfo.personaCount > 0 && (
                      <div>• {tagInfo.personaCount} Persona(s)</div>
                    )}
                  </div>

                  <div className="text-sm">
                    <strong>Etiqueta aplicable a:</strong>{' '}
                    <span className={`font-medium ${tagInfo.tag.tipoAplicacion === 'todos' ? 'text-green-600' : 'text-blue-600'}`}>
                      {tagInfo.tag.tipoAplicacion === 'todos' ? 'Todos los tipos' : 
                       tagInfo.tag.tipoAplicacion === 'empresa' ? 'Solo Empresas' : 'Solo Personas'}
                    </span>
                  </div>

                  {!tagInfo.isCompatible && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="text-red-800 text-sm font-medium">
                        ⚠️ Etiqueta incompatible
                      </div>
                      <div className="text-red-700 text-sm">
                        Esta etiqueta solo se puede aplicar a clientes de tipo{' '}
                        {tagInfo.tag.tipoAplicacion === 'empresa' ? 'Empresa' : 'Persona'}.
                        Deselecciona los clientes incompatibles o elige otra etiqueta.
                      </div>
                    </div>
                  )}

                  {tagInfo.isCompatible && (
                    <div className="text-sm text-gray-600">
                      ✅ Esta etiqueta se asignará correctamente a todos los clientes seleccionados.
                      Si un cliente ya tiene esta etiqueta, se mantendrá sin cambios.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBulkAssignModal(false);
                setBulkAssignTagId('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkAssignTag}
              disabled={!bulkAssignTagId || bulkAssignLoading || !getSelectedTagInfo()?.isCompatible}
            >
              {bulkAssignLoading ? 'Asignando...' : 'Asignar Etiqueta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
} 