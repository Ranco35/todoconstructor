'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Definir el tipo Cost_Center localmente
interface Cost_Center {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
  level?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CostCenterSelectorProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

interface CostCenterWithChildren extends Cost_Center {
  children?: CostCenterWithChildren[];
  _count?: {
    children: number;
  };
}

export default function CostCenterSelector({
  value,
  onChange,
  required = false,
  placeholder = 'Seleccionar centro de costo',
  className = '',
  error
}: CostCenterSelectorProps) {
  const [costCenters, setCostCenters] = useState<CostCenterWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando centros de costo...');
      
      const response = await fetch('/api/cost-centers?hierarchical=true');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Centros de costo cargados:', data.length);
        setCostCenters(data);
      } else {
        console.error('❌ Error response:', response.status, response.statusText);
        console.log('🔄 Usando centros de costo por defecto');
        // Agregar centros de costo por defecto si no se pueden cargar
        setCostCenters([
          { id: 1, name: 'Administración', code: 'ADM', description: 'Centro administrativo general', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: 2, name: 'Operaciones', code: 'OPE', description: 'Centro operativo principal', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: 3, name: 'Ventas', code: 'VEN', description: 'Centro de ventas y comercial', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: 4, name: 'Marketing', code: 'MKT', description: 'Centro de marketing y publicidad', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: 5, name: 'Recursos Humanos', code: 'RH', description: 'Centro de recursos humanos', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: 6, name: 'Mantenimiento', code: 'MNT', description: 'Centro de mantenimiento', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
        ]);
      }
    } catch (err) {
      console.error('❌ Error cargando centros de costo:', err);
      console.log('🔄 Usando centros de costo por defecto');
      // Agregar centros de costo por defecto en caso de error
      setCostCenters([
        { id: 1, name: 'Administración', code: 'ADM', description: 'Centro administrativo general', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Operaciones', code: 'OPE', description: 'Centro operativo principal', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: 'Ventas', code: 'VEN', description: 'Centro de ventas y comercial', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: 'Marketing', code: 'MKT', description: 'Centro de marketing y publicidad', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 5, name: 'Recursos Humanos', code: 'RH', description: 'Centro de recursos humanos', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 6, name: 'Mantenimiento', code: 'MNT', description: 'Centro de mantenimiento', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCostCenter = () => {
    if (!value) return null;
    return findCostCenterById(costCenters, value);
  };

  const findCostCenterById = (centers: CostCenterWithChildren[], id: number): CostCenterWithChildren | null => {
    for (const center of centers) {
      if (Number(center.id) === Number(id)) return center;
      if (center.children) {
        const found = findCostCenterById(center.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const filteredCostCenters = costCenters.filter(center => 
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCostCenterOption = (center: CostCenterWithChildren, level: number = 0) => {
    const isSelected = Number(value) === Number(center.id);
    const hasChildren = center.children && center.children.length > 0;
    
    return (
      <div key={center.id}>
        <div
          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            onChange(Number(center.id));
            setIsOpen(false);
            setSearchTerm('');
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {hasChildren && (
                <span className="text-gray-400 text-sm">📁</span>
              )}
              <span className="font-medium">{center.name}</span>
              {center.code && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {center.code}
                </span>
              )}
            </div>
          </div>
          {isSelected && (
            <span className="text-blue-600">✓</span>
          )}
        </div>
        {hasChildren && center.children!.map(child => 
          renderCostCenterOption(child, level + 1)
        )}
      </div>
    );
  };

  const selectedCenter = getSelectedCostCenter();

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Centro de Costo {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 border rounded-lg bg-white text-left transition-colors ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
        >
          <div className="flex items-center space-x-3">
            {selectedCenter ? (
              <>
                <span className="text-lg">🏢</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedCenter.name}
                  </div>
                  {selectedCenter.code && (
                    <div className="text-sm text-gray-500">
                      Código: {selectedCenter.code}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="text-lg text-gray-400">🏢</span>
                <span className="text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
            {/* Barra de búsqueda */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar centro de costo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Lista de opciones */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Cargando centros de costo...</p>
                </div>
              ) : filteredCostCenters.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron centros de costo' : 'No hay centros de costo disponibles'}
                </div>
              ) : (
                <div>
                  {filteredCostCenters.map(center => renderCostCenterOption(center))}
                </div>
              )}
            </div>

            {/* Botón para limpiar selección */}
            {selectedCenter && (
              <div className="p-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full text-center text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {selectedCenter && selectedCenter.description && (
        <p className="mt-1 text-sm text-gray-600">
          {selectedCenter.description}
        </p>
      )}
    </div>
  );
} 