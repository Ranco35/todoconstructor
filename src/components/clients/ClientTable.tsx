'use client';

import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ClientType, 
  ClientStatus, 
  ClientContact,
  ClientTag 
} from '@/types/client';
import { 
  getClients, 
  deleteClient, 
  softDeleteClient,
  updateClientStatus,
  updateClientFrequent,
  updateClientRanking
} from '@/actions/clients';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  User, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Tag as TagIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ClientTableProps {
  initialClients?: Client[];
  onClientUpdate?: () => void;
}

interface ClientTableRowProps {
  client: Client;
  onUpdate: () => void;
}

const ClientTableRow: React.FC<ClientTableRowProps> = ({ client, onUpdate }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteClient(client.id);
      if (result.success) {
        toast.success('Cliente eliminado correctamente');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al eliminar el cliente');
      }
    } catch (error) {
      toast.error('Error al eliminar el cliente');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSoftDelete = async () => {
    setIsLoading(true);
    try {
      const result = await softDeleteClient(client.id);
      if (result.success) {
        toast.success('Cliente desactivado correctamente');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al desactivar el cliente');
      }
    } catch (error) {
      toast.error('Error al desactivar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFrequent = async () => {
    try {
      const result = await updateClientFrequent(client.id, !client.esClienteFrecuente);
      if (result.success) {
        toast.success(`Cliente ${client.esClienteFrecuente ? 'removido de' : 'marcado como'} frecuente`);
        onUpdate();
      } else {
        toast.error(result.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleUpdateRanking = async (newRanking: number) => {
    try {
      const result = await updateClientRanking(client.id, newRanking);
      if (result.success) {
        toast.success('Ranking actualizado correctamente');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al actualizar el ranking');
      }
    } catch (error) {
      toast.error('Error al actualizar el ranking');
    }
  };

  const getClientName = () => {
    if (client.tipoCliente === ClientType.EMPRESA) {
      return client.razonSocial || client.nombrePrincipal;
    }
    return `${client.nombrePrincipal} ${client.apellido || ''}`.trim();
  };

  const getContactInfo = () => {
    const mainContact = client.contactos?.find(c => c.esContactoPrincipal);
    if (mainContact) {
      return {
        name: `${mainContact.nombre} ${mainContact.apellido || ''}`.trim(),
        email: mainContact.email,
        phone: mainContact.telefono || mainContact.telefonoMovil
      };
    }
    return {
      name: '',
      email: client.email,
      phone: client.telefono || client.telefonoMovil
    };
  };

  const contactInfo = getContactInfo();

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {client.tipoCliente === ClientType.EMPRESA ? (
                <Building2 className="h-5 w-5 text-blue-600" />
              ) : (
                <User className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <div className="font-medium">{getClientName()}</div>
              <div className="text-sm text-gray-500">
                {client.tipoCliente === ClientType.EMPRESA ? 'Empresa' : 'Persona'}
                {client.rut && ` • ${client.rut}`}
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="space-y-1">
            {contactInfo.name && (
              <div className="text-sm font-medium">{contactInfo.name}</div>
            )}
            {contactInfo.email && (
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="h-3 w-3 mr-1" />
                {contactInfo.email}
              </div>
            )}
            {contactInfo.phone && (
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="h-3 w-3 mr-1" />
                {contactInfo.phone}
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          {client.ciudad && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              {client.ciudad}
              {client.region && `, ${client.region}`}
            </div>
          )}
        </TableCell>

        <TableCell>
          <div className="flex items-center space-x-2">
            <Badge variant={client.estado === ClientStatus.ACTIVO ? 'default' : 'secondary'}>
              {client.estado === ClientStatus.ACTIVO ? 'Activo' : 'Inactivo'}
            </Badge>
            {client.esClienteFrecuente && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Frecuente
              </Badge>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 cursor-pointer ${
                  star <= client.rankingCliente
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
                onClick={() => handleUpdateRanking(star)}
              />
            ))}
          </div>
        </TableCell>

        <TableCell>
          {client.etiquetas && client.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {client.etiquetas.slice(0, 3).map((tagAssignment) => (
                <Badge
                  key={tagAssignment.etiqueta?.id}
                  variant="outline"
                  style={{ 
                    borderColor: tagAssignment.etiqueta?.color,
                    color: tagAssignment.etiqueta?.color 
                  }}
                  className="text-xs"
                >
                  {tagAssignment.etiqueta?.nombre}
                </Badge>
              ))}
              {client.etiquetas.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{client.etiquetas.length - 3}
                </Badge>
              )}
            </div>
          )}
        </TableCell>

        <TableCell>
          <div className="text-sm">
            {client.totalCompras > 0 ? (
              <span className="font-medium">
                ${client.totalCompras.toLocaleString('es-CL')}
              </span>
            ) : (
              <span className="text-gray-500">Sin compras</span>
            )}
          </div>
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${client.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${client.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFrequent}>
                <TagIcon className="mr-2 h-4 w-4" />
                {client.esClienteFrecuente ? 'Quitar frecuente' : 'Marcar frecuente'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSoftDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Desactivar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar permanentemente al cliente "{getClientName()}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ClientTable: React.FC<ClientTableProps> = ({ initialClients = [], onClientUpdate }) => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tipoCliente: '' as string,
    estado: '' as string,
    esClienteFrecuente: '' as string
  });

  const loadClients = async () => {
    setLoading(true);
    try {
      const result = await getClients({
        search: searchTerm || undefined,
        tipoCliente: filters.tipoCliente as ClientType || undefined,
        estado: filters.estado as ClientStatus || undefined,
        esClienteFrecuente: filters.esClienteFrecuente === 'true' ? true : 
                           filters.esClienteFrecuente === 'false' ? false : undefined
      });

      if (result.success) {
        setClients(result.data.clients);
      } else {
        toast.error(result.error || 'Error al cargar los clientes');
      }
    } catch (error) {
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [searchTerm, filters]);

  const handleClientUpdate = () => {
    loadClients();
    onClientUpdate?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.tipoCliente}
              onChange={(e) => setFilters(prev => ({ ...prev, tipoCliente: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todos los tipos</option>
              <option value="empresa">Empresa</option>
              <option value="persona">Persona</option>
            </select>
            <select
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <select
              value={filters.esClienteFrecuente}
              onChange={(e) => setFilters(prev => ({ ...prev, esClienteFrecuente: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todos</option>
              <option value="true">Frecuentes</option>
              <option value="false">No frecuentes</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ranking</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead>Total Compras</TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando clientes...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <ClientTableRow
                  key={client.id}
                  client={client}
                  onUpdate={handleClientUpdate}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClientTable; 