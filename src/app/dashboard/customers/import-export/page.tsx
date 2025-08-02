'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, Building2, User, Phone, Mail, MapPin, Edit, Trash2, Users, Filter, MoreHorizontal, Eye, ChevronDown, Star, Crown, Target, Gift, Factory, BarChart3, Trees, Tag, FileDown, FileUp, Download, Upload, CheckSquare, Square } from 'lucide-react';
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
import ClientImportExport from '@/components/clients/ClientImportExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleCrudError } from '@/utils/errorHandler';
import { ErrorAlert } from '@/components/ui/error-alert';

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
  onDelete: (id: number) => Promise<void>;
  selectedClients: number[];
  onSelectClient: (clientId: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  showCheckboxes: boolean;
}

function ClientTable({ clients, userRole, onDelete, selectedClients, onSelectClient, onSelectAll, showCheckboxes }: ClientTableProps) {
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
              {showCheckboxes && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    checked={clients.length > 0 && selectedClients.length === clients.length}
                    onCheckedChange={onSelectAll}
                  />
                </th>
              )}
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
                {showCheckboxes && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={(checked) => onSelectClient(client.id, checked as boolean)}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getClientTypeIcon(client.tipoCliente)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
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
                    <span className="text-gray-400 text-sm">Sin etiquetas</span>
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/customers/${client.id}`} className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/customers/${client.id}/edit`} className="flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem 
                            onClick={async () => await onDelete(client.id)}
                            className="flex items-center text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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

export default function ClientImportExportPage() {
  const searchParams = useSearchParams();
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
  
  // Estados para selección y acciones masivas
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignTagId, setBulkAssignTagId] = useState<string>('');
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leer parámetros de URL para paginación
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 20;
  const pageSizeStr = searchParams.get('pageSize') || '20';

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
        const result = await getClientTags();
        if (result.success) {
          setAvailableTags(result.data);
        }
      } catch (error) {
        console.error('Error cargando etiquetas:', error);
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

      if (result.success) {
        setClients(result.data.clients);
        setTotalPages(result.data.pagination.totalPages);
        setTotalCount(result.data.pagination.totalCount);
        
        console.log(`📊 Resultado consulta - Clientes encontrados: ${result.data.clients.length}, Total en BD: ${result.data.pagination.totalCount}`);
      } else {
        console.error('❌ Error cargando clientes:', result.error);
        toast.error(result.error || 'Error al cargar clientes');
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
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar clientes cuando cambien los filtros o paginación
  useEffect(() => {
    loadClients();
  }, [currentPage, pageSize, debouncedSearchTerm, filterType, filterStatus, filterTag]);

  // Resetear a página 1 cuando cambien filtros
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

  const handleDelete = async (id: number) => {
    try {
      console.log('🗑️ Iniciando eliminación de cliente ID:', id);
      setErrorMessage(null); // Limpiar errores previos
      
      const result = await deleteClient(id);
      
      if (result && result.success) {
        console.log('✅ Eliminación exitosa, actualizando estado local...');
        setClients(prev => prev.filter(client => client.id !== id));
        setTotalCount(prev => prev - 1);
        setSelectedClients(prev => prev.filter(clientId => clientId !== id));
        toast.success('Cliente eliminado correctamente');
      } else {
        // Mostrar el mensaje de error específico que viene del backend
        const errorMessage = result?.error || 'Error al eliminar el cliente';
        setErrorMessage(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      // En caso de error de red u otro error
      const networkError = 'Error de conexión al eliminar el cliente';
      setErrorMessage(networkError);
      toast.error(networkError);
    }
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

  const handleExportFiltered = async () => {
    setLoading(true);
    try {
      const filters = {
        search: debouncedSearchTerm,
        tipoCliente: filterType !== 'todos' ? filterType : undefined,
        estado: filterStatus !== 'todos' ? filterStatus : undefined,
        etiquetas: filterTag !== 'todos' ? [parseInt(filterTag)] : undefined,
      };

      const response = await fetch('/api/clients/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Error al exportar clientes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_filtrados_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Exportación completada exitosamente');
    } catch (error) {
      console.error('Error exportando clientes:', error);
      toast.error('Error al exportar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedClients.length === 0) {
      toast.error('Selecciona al menos un cliente para exportar');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/clients/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedIds: selectedClients }),
      });

      if (!response.ok) {
        throw new Error('Error al exportar clientes seleccionados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_seleccionados_${selectedClients.length}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exportación completada: ${selectedClients.length} cliente(s)`);
    } catch (error) {
      console.error('Error exportando clientes:', error);
      toast.error('Error al exportar clientes');
    } finally {
      setLoading(false);
    }
  };

  const canCreate = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(userRole);

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
            <h1 className="text-2xl font-semibold text-gray-900">Importar / Exportar Clientes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona la importación y exportación de clientes (Total registrados: {totalCount} clientes)
            </p>
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <Link href="/dashboard/customers/create">
                <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus size={16} />
                  Nuevo Cliente
                </Button>
              </Link>
            )}
            <Link href="/dashboard/customers/list">
              <Button variant="outline" className="px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <Users size={16} />
                Ver Lista Completa
              </Button>
            </Link>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {errorMessage && (
          <div className="mb-6">
            <ErrorAlert
              title="Error al Eliminar Cliente"
              message={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          </div>
        )}

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
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Cliente
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="PERSONA">Persona</SelectItem>
                  <SelectItem value="EMPRESA">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiqueta
              </label>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las etiquetas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las etiquetas</SelectItem>
                  {availableTags
                    .filter(tag => tag.activo)
                    .map(tag => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Acciones de Import/Export */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileDown size={16} className="text-gray-500" />
            <h3 className="text-base font-medium text-gray-900">Acciones de Importación y Exportación</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exportación */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                📤 Exportar Clientes
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Descarga los clientes filtrados en formato Excel (.xlsx)
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={handleExportFiltered}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Filtrados
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setShowCheckboxes(true)}
                  variant="outline"
                  className="w-full"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Seleccionar para Exportar
                </Button>
              </div>
            </div>

            {/* Importación */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                📥 Importar Clientes
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Importa clientes desde un archivo Excel (.xlsx)
              </p>
              
              <div className="space-y-2">
                <ClientImportExport onImportComplete={loadClients} />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones masivas cuando hay selección */}
        {showCheckboxes && selectedClients.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedClients.length} cliente(s) seleccionado(s)
                </span>
                <Button
                  onClick={handleExportSelected}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4" />
                      Exportar Seleccionados
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowBulkAssignModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Asignar Etiqueta
                </Button>
              </div>
              <Button
                onClick={() => {
                  setSelectedClients([]);
                  setShowCheckboxes(false);
                }}
                variant="ghost"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Tabla de Clientes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Clientes</h3>
            <div className="flex items-center gap-2">
              {showCheckboxes && (
                <span className="text-sm text-gray-500">
                  {selectedClients.length} de {clients.length} seleccionados
                </span>
              )}
            </div>
          </div>

          <ClientTable
            clients={clients}
            userRole={userRole}
            onDelete={handleDelete}
            selectedClients={selectedClients}
            onSelectClient={handleSelectClient}
            onSelectAll={handleSelectAll}
            showCheckboxes={showCheckboxes}
          />

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                currentCount={clients.length}
                pageSize={pageSizeStr}
                basePath="/dashboard/customers/import-export"
                itemName="clientes"
              />
            </div>
          )}
        </div>

        {/* Modal para asignación masiva de etiquetas */}
        <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Etiqueta a {selectedClients.length} Cliente(s)</DialogTitle>
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
                  <SelectContent>
                    {availableTags
                      .filter(tag => tag.activo)
                      .map(tag => (
                        <SelectItem key={tag.id} value={tag.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.nombre}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBulkAssignModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkAssignTag}
                disabled={!bulkAssignTagId || bulkAssignLoading}
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