'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchSuppliersByName, getAllActiveSuppliers } from '@/actions/suppliers/list';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Search, 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Plus,
  Crown,
  Star,
  Shield,
  User,
  Check
} from 'lucide-react';

interface SupplierSearchSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  className?: string;
  showCreateOption?: boolean;
  onCreateNew?: () => void;
}

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  supplierRank?: string;
  displayName?: string;
  companyType?: string;
  taxId?: string;
}

export default function SupplierSearchSelector({
  value,
  onValueChange,
  placeholder = "Buscar proveedor...",
  disabled = false,
  required = false,
  label = "Proveedor",
  error,
  className,
  showCreateOption = false,
  onCreateNew
}: SupplierSearchSelectorProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar proveedores
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        console.log('[SupplierSearchSelector] Cargando proveedores...');
        
        // Usar la nueva función para obtener TODOS los proveedores
        const results = await getAllActiveSuppliers();
        console.log('[SupplierSearchSelector] Proveedores cargados:', results);
        console.log('[SupplierSearchSelector] Total de proveedores:', results.length);
        
        // Verificar si Kunstmann está en los resultados
        const kunstmann = results.find(s => 
          s.name?.toLowerCase().includes('kunstmann') || 
          s.name?.toLowerCase().includes('kun')
        );
        if (kunstmann) {
          console.log('[SupplierSearchSelector] Kunstmann encontrado en carga:', kunstmann.name);
        } else {
          console.log('[SupplierSearchSelector] Kunstmann NO encontrado en carga');
          
          // Mostrar algunos proveedores para debug
          console.log('[SupplierSearchSelector] Primeros 10 proveedores:', results.slice(0, 10).map(s => s.name));
        }
        
        setSuppliers(results);
        setFilteredSuppliers(results);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  // Filtrar proveedores basado en búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuppliers(suppliers);
      return;
    }

    console.log('[SupplierSearchSelector] Filtrando proveedores con término:', searchTerm);
    console.log('[SupplierSearchSelector] Proveedores disponibles:', suppliers.length);

    const filtered = suppliers.filter(supplier => {
      const searchLower = searchTerm.toLowerCase();
      
      // Búsqueda simple primero
      const simpleMatch = 
        supplier.name.toLowerCase().includes(searchLower) ||
        (supplier.displayName && supplier.displayName.toLowerCase().includes(searchLower)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchLower)) ||
        (supplier.city && supplier.city.toLowerCase().includes(searchLower)) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(searchLower));

      if (simpleMatch) {
        console.log('[SupplierSearchSelector] Proveedor encontrado (simple):', supplier.name);
        return true;
      }

      // Búsqueda multi-término si no hay match simple
      const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
      if (searchTerms.length > 1) {
        const multiMatch = searchTerms.every(term => 
          supplier.name.toLowerCase().includes(term) ||
          (supplier.displayName && supplier.displayName.toLowerCase().includes(term)) ||
          (supplier.email && supplier.email.toLowerCase().includes(term)) ||
          (supplier.city && supplier.city.toLowerCase().includes(term)) ||
          (supplier.phone && supplier.phone.toLowerCase().includes(term))
        );

        if (multiMatch) {
          console.log('[SupplierSearchSelector] Proveedor encontrado (multi):', supplier.name);
          return true;
        }
      }

      return false;
    });

    console.log('[SupplierSearchSelector] Proveedores filtrados:', filtered.length);
    
    // Verificar específicamente Kunstmann
    const kunstmannInFiltered = filtered.find(s => 
      s.name?.toLowerCase().includes('kunstmann') || 
      s.name?.toLowerCase().includes('kun')
    );
    if (kunstmannInFiltered) {
      console.log('[SupplierSearchSelector] Kunstmann encontrado en filtrado:', kunstmannInFiltered.name);
    } else {
      console.log('[SupplierSearchSelector] Kunstmann NO encontrado en filtrado');
    }
    
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  // Establecer proveedor seleccionado cuando cambia el value
  useEffect(() => {
    if (value && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.id === value);
      setSelectedSupplier(supplier || null);
    } else {
      setSelectedSupplier(null);
    }
  }, [value, suppliers]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    onValueChange(supplier.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedSupplier(null);
    onValueChange(undefined);
    setSearchTerm('');
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew?.();
  };

  const getRankIcon = (rank?: string) => {
    switch (rank) {
      case 'PLATINUM':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'GOLD':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'SILVER':
        return <Shield className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRankColor = (rank?: string) => {
    switch (rank) {
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'GOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SILVER':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <Label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        {/* Campo de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={selectedSupplier ? selectedSupplier.name : searchTerm}
            onChange={(e) => {
              if (selectedSupplier) {
                handleClearSelection();
              } else {
                setSearchTerm(e.target.value);
              }
            }}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            className={cn(
              "pl-10 pr-10 bg-white",
              selectedSupplier && "bg-blue-50 border-blue-300",
              loading && "bg-gray-100"
            )}
          />
          
          {/* Botón de limpiar */}
          {selectedSupplier && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 max-h-80 overflow-hidden shadow-lg border border-gray-200 bg-white rounded-lg" style={{ backgroundColor: 'white' }}>
            {/* Opción de crear nuevo */}
            {showCreateOption && (
              <div className="p-3 border-b border-gray-100 bg-white">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={handleCreateNew}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear nuevo proveedor
                </Button>
              </div>
            )}

            {/* Lista de proveedores */}
            <div className="max-h-64 overflow-y-auto bg-white" style={{ backgroundColor: 'white' }}>
              {loading ? (
                <div className="p-4 text-center text-gray-500 bg-white" style={{ backgroundColor: 'white' }}>
                  Cargando proveedores...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-white" style={{ backgroundColor: 'white' }}>
                  {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores disponibles'}
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={cn(
                      "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 bg-white",
                      selectedSupplier?.id === supplier.id && "bg-blue-50"
                    )}
                    style={{ backgroundColor: selectedSupplier?.id === supplier.id ? '#eff6ff' : 'white' }}
                    onClick={() => handleSelectSupplier(supplier)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {supplier.name}
                          </span>
                          {selectedSupplier?.id === supplier.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {supplier.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{supplier.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {supplier.supplierRank && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getRankColor(supplier.supplierRank))}
                          >
                            {getRankIcon(supplier.supplierRank)}
                            <span className="ml-1">{supplier.supplierRank}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
} 