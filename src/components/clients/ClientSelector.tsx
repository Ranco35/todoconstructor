'use client';

import React, { useState, useEffect } from 'react';
import { Client, ClientType } from '@/types/client';
import { searchClients, getClient } from '@/actions/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  ChevronsUpDown, 
  User, 
  Building2,
  X
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ClientSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showClientInfo?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Seleccionar cliente...",
  disabled = false,
  className,
  showClientInfo = false
}) => {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isLoadingInitialClient, setIsLoadingInitialClient] = useState(false);

  // Función para obtener el nombre del cliente
  const getClientName = (client: Client) => {
    if (client.tipoCliente === ClientType.EMPRESA) {
      return client.razonSocial || client.nombrePrincipal;
    }
    return `${client.nombrePrincipal} ${client.apellido || ''}`.trim();
  };

  const getClientInfo = (client: Client) => {
    const info = [];
    if (client.rut) info.push(client.rut);
    if (client.email) info.push(client.email);
    if (client.ciudad) info.push(client.ciudad);
    return info.join(' • ');
  };

  // Cargar cliente inicial cuando se pasa value
  useEffect(() => {
    const loadInitialClient = async () => {
              if (value && !selectedClient && !isLoadingInitialClient) {
          setIsLoadingInitialClient(true);
          try {
            const result = await getClient(value);
            if (result.success && result.data) {
              setSelectedClient(result.data);
            }
          } catch (error) {
            console.error('Error cargando cliente inicial:', error);
          } finally {
            setIsLoadingInitialClient(false);
          }
        }
    };

    loadInitialClient();
  }, [value, selectedClient, isLoadingInitialClient]);

  // Limpiar cliente seleccionado cuando se remueve el value
  useEffect(() => {
    if (!value && selectedClient) {
      setSelectedClient(null);
    }
  }, [value, selectedClient]);

  // Buscar clientes con debounce (igual que en reservas)
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (clientSearchTerm.length >= 1) {
        setIsSearching(true);
        try {
          console.log(`🔍 ClientSelector: Buscando clientes con término "${clientSearchTerm}"`);
          const result = await searchClients(clientSearchTerm);
          console.log(`📥 ClientSelector: Resultado recibido:`, result);
          
          if (result.success) {
            // Filtrar solo clientes completos (misma lógica que reservas)
            const validClients = (result.data || []).filter((c: any): c is Client =>
              c && typeof c.id === 'number' && typeof c.nombrePrincipal === 'string' && typeof c.tipoCliente === 'string'
            ).map((c: any) => ({
              ...c,
              fechaCreacion: typeof c.fechaCreacion === 'string' ? new Date(c.fechaCreacion) : c.fechaCreacion,
              fechaModificacion: typeof c.fechaModificacion === 'string' ? new Date(c.fechaModificacion) : c.fechaModificacion
            }));
            setSearchResults(Array.isArray(validClients) && validClients.length > 0 ? validClients : []);
            console.log(`✅ ClientSelector: ${validClients.length} clientes establecidos en estado:`, validClients);
          }
        } catch (error) {
          console.error('💥 Error buscando clientes:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [clientSearchTerm]);

  // Función para seleccionar cliente
  const handleSelectClient = (client: Client) => {
    console.log(`🎯 Cliente seleccionado:`, client);
    setSelectedClient(client);
    onValueChange(client.id);
    setOpen(false);
    setClientSearchTerm('');
    setSearchResults([]);
  };

  // Función para limpiar selección
  const clearSelection = () => {
    setSelectedClient(null);
    onValueChange(undefined);
    setClientSearchTerm('');
    setSearchResults([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {isLoadingInitialClient ? (
            <span className="text-muted-foreground">Cargando cliente...</span>
          ) : selectedClient ? (
            <div className="flex items-center space-x-2">
              {selectedClient.tipoCliente === ClientType.EMPRESA ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="truncate">{getClientName(selectedClient)}</span>
              {selectedClient.rut && (
                <Badge variant="outline" className="text-xs">
                  {selectedClient.rut}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white border border-gray-200 shadow-lg">
        <div className="p-4 space-y-4">
          {/* Campo de búsqueda */}
          <div>
            <Input
              placeholder="Buscar por nombre, email o RUT..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg bg-white max-h-64 overflow-y-auto">
              {searchResults.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {client.tipoCliente === 'EMPRESA' 
                          ? client.razonSocial || client.nombrePrincipal
                          : `${client.nombrePrincipal} ${client.apellido || ''}`.trim()
                        }
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {client.rut && <span>RUT: {client.rut}</span>}
                        {client.email && <span> • {client.email}</span>}
                      </div>
                      {(client.telefono || client.telefonoMovil) && (
                        <div className="text-xs text-gray-500">
                          📞 {client.telefono || client.telefonoMovil}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.tipoCliente === 'EMPRESA' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {client.tipoCliente === 'EMPRESA' ? '🏢 Empresa' : '👤 Persona'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Estado de búsqueda */}
          {clientSearchTerm.length >= 1 && searchResults.length === 0 && !isSearching && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center border border-gray-200 rounded-lg bg-gray-50">
              No se encontraron clientes con "{clientSearchTerm}"
            </div>
          )}

          {isSearching && (
            <div className="px-4 py-3 text-sm text-blue-600 text-center border border-blue-200 rounded-lg bg-blue-50">
              🔍 Buscando clientes...
            </div>
          )}

          {/* Cliente seleccionado */}
          {selectedClient && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900 text-sm">
                    {getClientName(selectedClient)}
                  </p>
                  <p className="text-xs text-green-700">
                    {selectedClient.rut && `RUT: ${selectedClient.rut}`}
                    {selectedClient.email && ` • ${selectedClient.email}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-green-600 hover:text-green-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientSelector; 