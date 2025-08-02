'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContactType } from '@/types/database';
import { 
  deleteSupplierContact
} from '@/actions/suppliers/contacts';
import { 
  updateContactStatus, 
  setPrimaryContact,
  bulkDeleteContacts,
  bulkActivateContacts,
  bulkDeactivateContacts
} from '@/actions/suppliers/contacts/actions';
import { CONTACT_TYPES } from '@/constants/supplier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Phone, 
  Mail, 
  User, 
  Star, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Crown,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import ContactForm from './ContactForm';
import Modal from '@/components/shared/Modal';

interface Contact {
  id: number;
  name: string;
  position?: string | null;
  type: ContactType;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  notes?: string | null;
  isPrimary: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  Supplier: {
    id: number;
    name: string;
    businessName?: string | null;
    reference?: string | null;
  };
}

interface ContactTableProps {
  supplierId: number;
  contacts: Contact[];
}

export default function ContactTable({ supplierId, contacts }: ContactTableProps) {
  const router = useRouter();
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función helper para refresh
  const refreshData = () => {
    router.refresh();
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    contact.mobile?.includes(searchTerm)
  );

  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredContacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) return;

    setIsLoading(true);
    try {
      await deleteSupplierContact(contactId);
      toast.success('Contacto eliminado correctamente');
      refreshData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Error al eliminar el contacto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (contactId: number, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await updateContactStatus(contactId, !currentStatus);
      toast.success(`Contacto ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      refreshData();
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast.error('Error al actualizar el estado del contacto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (contactId: number) => {
    setIsLoading(true);
    try {
      await setPrimaryContact(contactId);
      toast.success('Contacto principal actualizado');
      refreshData();
    } catch (error) {
      console.error('Error setting primary contact:', error);
      toast.error('Error al establecer el contacto principal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedContacts.length === 0) {
      toast.error('Selecciona al menos un contacto');
      return;
    }

    const confirmMessages = {
      delete: '¿Estás seguro de que quieres eliminar los contactos seleccionados?',
      activate: '¿Estás seguro de que quieres activar los contactos seleccionados?',
      deactivate: '¿Estás seguro de que quieres desactivar los contactos seleccionados?'
    };

    if (!confirm(confirmMessages[action])) return;

    setIsLoading(true);
    try {
      switch (action) {
        case 'delete':
          await bulkDeleteContacts(selectedContacts);
          break;
        case 'activate':
          await bulkActivateContacts(selectedContacts);
          break;
        case 'deactivate':
          await bulkDeactivateContacts(selectedContacts);
          break;
      }
      
      setSelectedContacts([]);
      refreshData();
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Error al ejecutar la acción');
    } finally {
      setIsLoading(false);
    }
  };

  const getContactTypeInfo = (type: ContactType) => {
    return CONTACT_TYPES.find(t => t.value === type) || CONTACT_TYPES[0];
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingContact(null);
    refreshData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <div className="space-y-6">
      {/* Controles modernos */}
      <div className="space-y-4">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contactos..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedContacts.length} seleccionado(s)
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Acciones
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Desactivar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

        {/* Tabla moderna */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={isLoading}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Información de Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <User className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-900 mb-1">No hay contactos</p>
                        <p className="text-sm text-gray-500">Agrega el primer contacto para este proveedor</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => {
                    const typeInfo = getContactTypeInfo(contact.type);
                    return (
                      <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={(checked: boolean) => handleSelectContact(contact.id, checked)}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                                {contact.isPrimary && (
                                  <Crown className="h-4 w-4 text-yellow-500" title="Contacto Principal" />
                                )}
                              </div>
                              {contact.position && (
                                <p className="text-sm text-gray-500">{contact.position}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {typeInfo.icon}
                            {typeInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-900">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-900">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.mobile && (
                              <div className="flex items-center gap-2 text-sm text-gray-900">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{contact.mobile}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={contact.active ? "default" : "secondary"}
                            className={contact.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {contact.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {!contact.isPrimary && (
                                <DropdownMenuItem onClick={() => handleSetPrimary(contact.id)}>
                                  <Crown className="h-4 w-4 mr-2" />
                                  Hacer principal
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleToggleStatus(contact.id, contact.active)}>
                                {contact.active ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal del formulario */}
      <Modal
        open={showForm}
        onClose={handleFormCancel}
      >
        <ContactForm
          supplierId={supplierId}
          contact={editingContact || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
} 