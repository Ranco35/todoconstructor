'use client';

import React, { useState } from 'react';
import { ColumnDef, Table } from '@/components/shared/Table';
import { Supplier } from '@/types/database';
import { SupplierRank, RANK_BADGES, COMPANY_TYPE_LABELS } from '@/constants/supplier';
import { formatVAT, formatPhone, getCountryFlag, getCountryName } from '@/lib/supplier-utils';
import { deleteSupplierAction } from '@/actions/suppliers/delete';
import { Badge } from '@/components/ui/badge';
import SupplierRowActions from './SupplierRowActions';
import Image from 'next/image';

interface SupplierTableProps {
  suppliers: (Supplier & {
    CreatedByUser?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    ModifiedByUser?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    Product: {
      id: number;
      name: string;
    }[];
    SupplierContact: {
      id: number;
      name: string;
      type: any;
      email: string | null;
      phone: string | null;
      isPrimary: boolean;
    }[];
    etiquetas?: {
      id: number;
      etiquetaId: number;
      etiqueta: {
        id: number;
        nombre: string;
        color: string;
      };
    }[];
  })[] | Supplier[];
  currentUserRole: string;
  // Props opcionales para selección
  selectedSuppliers?: number[];
  onSelectSupplier?: (supplierId: number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  showCheckboxes?: boolean;
}

export default function SupplierTable({ 
  suppliers, 
  currentUserRole,
  selectedSuppliers = [],
  onSelectSupplier,
  onSelectAll,
  showCheckboxes = false
}: SupplierTableProps) {
  // Definición de columnas para la tabla de proveedores
  const supplierColumns: ColumnDef<Supplier & any>[] = [
    // Columna de checkbox (opcional)
    ...(showCheckboxes ? [{
      header: ({ table }: any) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
            onChange={(e) => onSelectAll?.(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      cell: ({ row }: any) => {
        if (!row || !row.original) return null;
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedSuppliers.includes(row.original.id)}
              onChange={(e) => onSelectSupplier?.(row.original.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        );
      },
    }] : []),
    {
      header: 'Acciones',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        return (
          <SupplierRowActions 
            supplierId={row.original.id} 
            deleteAction={deleteSupplierAction}
            currentUserRole={currentUserRole}
          />
        );
      },
    },
    {
      header: 'Proveedor',
      accessorKey: 'name',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        
        return (
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="flex-shrink-0">
              {supplier.logo ? (
                <Image 
                  src={supplier.logo} 
                  alt={supplier.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm font-medium">
                    {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Información */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {supplier.name || 'Sin nombre'}
                </p>
                {supplier.active ? (
                  <Badge variant="success" className="text-xs">Activo</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                )}
              </div>
              
              {supplier.displayName && (
                <p className="text-sm text-gray-500 truncate">
                  {supplier.displayName}
                </p>
              )}
              
              {supplier.internalRef && (
                <p className="text-xs text-gray-400">
                  Ref: {supplier.internalRef}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Tipo',
      accessorKey: 'companyType',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const companyType = row.original.companyType as keyof typeof COMPANY_TYPE_LABELS;
        const config = COMPANY_TYPE_LABELS[companyType] || COMPANY_TYPE_LABELS.EMPRESA;
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <span className="text-sm text-gray-700">{config.label}</span>
          </div>
        );
      },
    },
    {
      header: 'Etiquetas',
      accessorKey: 'etiquetas',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        const etiquetas = supplier.etiquetas || [];
        
        if (etiquetas.length === 0) {
          return (
            <div className="text-sm text-gray-400 italic">
              Sin etiquetas
            </div>
          );
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {etiquetas.slice(0, 3).map((assignment: any) => (
              <Badge
                key={assignment.etiquetaId}
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: assignment.etiqueta.color + '20',
                  color: assignment.etiqueta.color,
                  borderColor: assignment.etiqueta.color
                }}
              >
                {assignment.etiqueta.nombre}
              </Badge>
            ))}
            {etiquetas.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                +{etiquetas.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Identificación',
      accessorKey: 'vat',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        
        return (
          <div className="space-y-1">
            {supplier.vat && (
              <p className="text-sm text-gray-900">
                {formatVAT(supplier.vat, supplier.countryCode)}
              </p>
            )}
            {supplier.taxId && (
              <p className="text-xs text-gray-500">
                ID: {supplier.taxId}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Ubicación',
      accessorKey: 'countryCode',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        const countryCode = supplier.countryCode || 'Unknown';
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getCountryFlag(countryCode)}</span>
            <div>
              <p className="text-sm text-gray-900">
                {getCountryName(countryCode)}
              </p>
              {supplier.city && (
                <p className="text-xs text-gray-500">
                  {supplier.city}
                  {supplier.state && `, ${supplier.state}`}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contacto',
      accessorKey: 'email',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        
        return (
          <div className="space-y-1">
            {supplier.email && (
              <p className="text-sm text-gray-900 truncate">
                {supplier.email}
              </p>
            )}
            {supplier.phone && (
              <p className="text-sm text-gray-700">
                {formatPhone(supplier.phone, supplier.countryCode)}
              </p>
            )}
          </div>
        );
      },
    },
    {
              header: 'Tipo de proveedor',
      accessorKey: 'supplierRank',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        const rank = supplier.supplierRank as SupplierRank;
        const config = RANK_BADGES[rank];
        
        return (
          <div className="flex items-center space-x-2">
            <Badge 
              className={`${config.color} text-xs font-medium`}
            >
              {config.label}
            </Badge>
            <span className="text-sm text-gray-600">
              {supplier.rankPoints} pts
            </span>
          </div>
        );
      },
    },
    {
      header: 'Productos',
      accessorKey: 'Product',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const products = row.original.Product || [];
        
        return (
          <div className="text-center">
            <span className="text-sm font-medium text-gray-900">
              {products.length}
            </span>
            {products.length > 0 && (
              <p className="text-xs text-gray-500">
                productos
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Configuración',
      accessorKey: 'paymentTerm',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">
              {supplier.currency || 'CLP'}
            </p>
            <p className="text-xs text-gray-500">
              {supplier.paymentTerm?.replace('_', ' ').toLowerCase()}
            </p>
            {supplier.creditLimit && (
              <p className="text-xs text-gray-500">
                Límite: ${supplier.creditLimit.toLocaleString()}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Creado',
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        if (!row || !row.original) return null;
        const supplier = row.original;
        const date = new Date(supplier.createdAt);
        
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">
              {date.toLocaleDateString('es-CL')}
            </p>
            {supplier.CreatedByUser && (
              <p className="text-xs text-gray-500">
                por {supplier.CreatedByUser.firstName} {supplier.CreatedByUser.lastName}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Acciones masivas */}
      {selectedSuppliers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedSuppliers.length} proveedor(es) seleccionado(s)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {/* TODO: Implementar acciones masivas */}}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Desactivar
              </button>
              <button
                onClick={() => {/* TODO: Implementar acciones masivas */}}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <Table<Supplier & any>
        data={suppliers || []}
        columns={supplierColumns}
        rowKey="id"
        className="bg-white shadow-sm rounded-lg overflow-hidden"
      />

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-lg">🏢</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {(suppliers || []).length}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {(suppliers || []).filter(s => s?.active).length}
              </p>
              <p className="text-xs text-gray-500">Activos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {(suppliers || []).filter(s => s?.supplierRank === SupplierRank.BUENO || s?.supplierRank === SupplierRank.EXCELENTE).length}
              </p>
              <p className="text-xs text-gray-500">Bueno+</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-lg">🥇</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {suppliers.filter(s => s.supplierRank === SupplierRank.GOLD || s.supplierRank === SupplierRank.PLATINUM).length}
              </p>
              <p className="text-xs text-gray-500">Gold+</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-lg">📦</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {suppliers.reduce((acc, s) => acc + ((s as any).Product?.length || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Productos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 