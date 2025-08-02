'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import { WAREHOUSE_TYPES } from '@/constants/warehouse';
import { DeleteConfirmButton } from './DeleteConfirmButton';

// Definir el tipo Warehouse localmente
interface Warehouse {
  id: string;
  name: string;
  location: string;
  type?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type WarehouseWithCount = Warehouse & {
  Parent?: {
    id: number;
    name: string;
  } | null;
  _count?: {
    Warehouse_Product: number;
    Inventory: number;
    Children: number;
  };
}

interface WarehouseTableProps {
  data: WarehouseWithCount[];
  deleteAction: (formData: FormData) => Promise<any>;
}

export function WarehouseTable({ data, deleteAction }: WarehouseTableProps) {
  // Función para obtener la etiqueta del tipo de bodega
  const getTypeLabel = (type: string | undefined) => {
    if (!type) return 'Sin tipo';
    const typeObj = WAREHOUSE_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega Padre
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hijos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ver Productos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-3 lg:px-6 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl mb-4">🏭</span>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bodegas registradas</h3>
                      <p className="text-gray-600">Agrega tu primera bodega para comenzar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.id}
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                      <div className="max-w-32 truncate font-medium" title={warehouse.name}>
                        {warehouse.name}
                      </div>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        warehouse.type === 'VENTA' ? 'bg-green-100 text-green-800' :
                        warehouse.type === 'INVENTARIO' ? 'bg-blue-100 text-blue-800' :
                        warehouse.type === 'PRODUCCION' ? 'bg-purple-100 text-purple-800' :
                        warehouse.type === 'MERMAS' ? 'bg-red-100 text-red-800' :
                        warehouse.type === 'CONSUMO_INTERNO' ? 'bg-orange-100 text-orange-800' :
                        warehouse.type === 'RECEPCION_MERCADERIA' ? 'bg-indigo-100 text-indigo-800' :
                        warehouse.type === 'TRANSITO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getTypeLabel(warehouse.type || '')}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                      <div className="max-w-24 truncate" title={warehouse.location}>
                        {warehouse.location}
                      </div>
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                      <div className="max-w-24 truncate" title={warehouse.Parent?.name || '-'}>
                        {warehouse.Parent ? warehouse.Parent.name : '-'}
                      </div>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                        {warehouse._count?.Children || 0}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                        {warehouse._count?.Warehouse_Product || 0}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900">
                      <Link href={`/dashboard/configuration/inventory/warehouses/${warehouse.id}/products`}>
                        <button className="text-blue-600 hover:text-blue-900 text-xs underline">
                          Ver ({warehouse._count?.Warehouse_Product || 0})
                        </button>
                      </Link>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm font-medium w-32">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/configuration/inventory/warehouses/edit/${warehouse.id}`}>
                          <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50">
                            Editar
                          </button>
                        </Link>
                        <DeleteConfirmButton
                          deleteAction={deleteAction}
                          id={String(warehouse.id)}
                          confirmMessage="¿Estás seguro de que quieres eliminar esta bodega?"
                          className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded hover:bg-red-50"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 