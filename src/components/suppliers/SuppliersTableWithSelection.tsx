'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Truck, Car, Factory, Building, Wrench, Zap, ChefHat, Coffee, Sparkles, Bed, MapPin, Users, Briefcase, DollarSign, Star, Heart, Shield, Award, Target, Leaf, Settings, User, Home, PaintBucket } from 'lucide-react';
import { DeleteConfirmButton } from '@/components/shared/DeleteConfirmButton';
import { deleteSupplierAction } from '@/actions/suppliers/delete';

// Mapa de iconos para etiquetas (igual que en la página de lista exitosa)
const iconMap: { [key: string]: any } = {
  'bed': Bed, 'coffee': Coffee, 'chef-hat': ChefHat, 'sparkles': Sparkles,
  'truck': Truck, 'car': Car, 'factory': Factory, 'building': Building,
  'briefcase': Briefcase, 'wrench': Wrench, 'zap': Zap, 'settings': Settings,
  'package': Package, 'map-pin': MapPin, 'users': Users, 'dollar-sign': DollarSign,
  'star': Star, 'heart': Heart, 'shield': Shield, 'award': Award,
  'target': Target, 'leaf': Leaf, 'user': User, 'home': Home, 'paint-bucket': PaintBucket
};

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  city?: string;
  isActive: boolean;
  supplierRank?: string;
  etiquetas?: Array<{
    id: number;
    etiqueta: {
      nombre: string;
      color: string;
      icono: string;
    };
  }>;
}

interface SuppliersTableWithSelectionProps {
  suppliers: Supplier[];
  selectedSuppliers: number[];
  onSelectSupplier: (supplierId: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  showCheckboxes: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function SuppliersTableWithSelection({
  suppliers,
  selectedSuppliers,
  onSelectSupplier,
  onSelectAll,
  showCheckboxes,
  canEdit,
  canDelete,
}: SuppliersTableWithSelectionProps) {
  const allSelected = suppliers.length > 0 && selectedSuppliers.length === suppliers.length;
  const someSelected = selectedSuppliers.length > 0 && selectedSuppliers.length < suppliers.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {suppliers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showCheckboxes && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calidad de Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etiquetas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => {
                const initials = supplier.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const isSelected = selectedSuppliers.includes(supplier.id);
                
                return (
                  <tr 
                    key={supplier.id} 
                    className={`hover:bg-gray-50 ${isSelected && showCheckboxes ? 'bg-purple-50' : ''}`}
                  >
                    {showCheckboxes && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectSupplier(supplier.id, e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {initials}
                        </div>
                        <div className="ml-4">
                          <Link
                            href={`/dashboard/suppliers/${supplier.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                          >
                            {supplier.name}
                          </Link>
                          {supplier.taxId && (
                            <div className="text-sm text-gray-500">RUT: {supplier.taxId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.email || 'Sin email'}</div>
                      <div className="text-sm text-gray-500">{supplier.phone || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.supplierRank === 'BASICO' ? 'bg-gray-100 text-gray-800' :
                        supplier.supplierRank === 'REGULAR' ? 'bg-yellow-100 text-yellow-800' :
                        supplier.supplierRank === 'BUENO' ? 'bg-green-100 text-green-800' :
                        supplier.supplierRank === 'EXCELENTE' ? 'bg-purple-100 text-purple-800' :
                        supplier.supplierRank === 'PREMIUM' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.supplierRank || 'Sin tipo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {supplier.etiquetas && supplier.etiquetas.length > 0 ? (
                          supplier.etiquetas.slice(0, 3).map((assignment: any) => {
                            const tag = assignment.etiqueta;
                            const Icon = iconMap[tag.icono] || Package;
                            return (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                <Icon className="w-3 h-3" />
                                {tag.nombre}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 text-xs">Sin etiquetas</span>
                        )}
                        {supplier.etiquetas && supplier.etiquetas.length > 3 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            +{supplier.etiquetas.length - 3} más
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.city || 'Sin ciudad'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        {canEdit && (
                          <Link
                            href={`/dashboard/suppliers/edit/${supplier.id}`}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Editar
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/suppliers/${supplier.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </Link>
                        {canDelete && (
                          <DeleteConfirmButton
                            id={supplier.id.toString()}
                            deleteAction={deleteSupplierAction}
                            confirmMessage={`¿Estás seguro de que deseas eliminar al proveedor "${supplier.name}"?`}
                          />
                        )}
                        {!canEdit && !canDelete && (
                          <span className="text-gray-400 text-xs">
                            Solo lectura
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proveedores</h3>
          <p className="text-gray-500 mb-4">
            No se encontraron proveedores con los filtros aplicados
          </p>
        </div>
      )}
    </div>
  );
} 