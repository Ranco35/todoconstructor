'use client';

import React, { useState, useEffect } from 'react';
import { getAllActiveSuppliers } from '@/actions/suppliers/list';

interface SupplierMultiSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

interface Supplier {
  id: number;
  name: string;
  displayName?: string;
  companyType?: string;
  city?: string;
  supplierRank?: string;
}

export default function SupplierMultiSelector({ selectedIds, onChange }: SupplierMultiSelectorProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      setMounted(true);
      loadSuppliers();
    }
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersData = await getAllActiveSuppliers();
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]); // Asegurar que haya un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (supplierId: number) => {
    if (selectedIds.includes(supplierId)) {
      onChange(selectedIds.filter(id => id !== supplierId));
    } else {
      onChange([...selectedIds, supplierId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredSuppliers.map(s => s.id);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    search.trim() === '' || 
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    supplier.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const getSupplierTypeLabel = (type?: string) => {
    if (!type) return '';
    const types: Record<string, string> = {
      'INDIVIDUAL': 'Individual',
      'EMPRESA': 'Empresa',
    };
    return types[type] || type;
  };

  const getRankBadgeColor = (rank?: string) => {
    if (!rank) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      'BASICO': 'bg-gray-100 text-gray-800',
      'REGULAR': 'bg-blue-100 text-blue-800',
      'BUENO': 'bg-green-100 text-green-800',
      'EXCELENTE': 'bg-purple-100 text-purple-800',
    };
    return colors[rank] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Seleccionar Proveedores
          {selectedIds.length > 0 && (
            <span className="ml-2 text-blue-600">({selectedIds.length} seleccionados)</span>
          )}
        </h4>

        {/* Búsqueda */}
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Botones de selección */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Deseleccionar todos
          </button>
        </div>
      </div>

      {/* Lista de proveedores */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Cargando proveedores...</span>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-96 border border-gray-200 rounded bg-white">
          {filteredSuppliers.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              No se encontraron proveedores
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedIds.includes(supplier.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleToggle(supplier.id)}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(supplier.id)}
                      onChange={() => handleToggle(supplier.id)}
                      className="rounded mr-3"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {supplier.displayName || supplier.name}
                        </span>
                        {supplier.supplierRank && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRankBadgeColor(supplier.supplierRank)}`}>
                            {supplier.supplierRank}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {[
                          supplier.companyType ? getSupplierTypeLabel(supplier.companyType) : null,
                          supplier.city
                        ].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

