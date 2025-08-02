'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, 
  ArrowUp, ArrowDown, Plus, Filter, Settings, FileSpreadsheet, Trash2, Pencil, MoreVertical, Package, Eye, Copy
} from 'lucide-react';
import Link from 'next/link';
import { DeleteConfirmButton } from './DeleteConfirmButton';

export interface ModernColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface ModernRowActions<T> {
  editLink?: (row: T) => string;
  deleteAction?: (formData: FormData) => Promise<any>;
  deleteConfirmMessage?: string;
  viewLink?: (row: T) => string;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    className?: string;
  }>;
}

interface ModernTableProps<T> {
  data: T[];
  columns: ModernColumnDef<T>[];
  rowKey: keyof T;
  actions?: ModernRowActions<T>;
  title?: string;
  description?: string;
  stats?: Array<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'blue' | 'red' | 'yellow' | 'green';
    subtitle?: string;
  }>;
  filters?: Array<{
    label: string;
    value: string;
  }>;
  onFilterChange?: (filter: string) => void;
  selectedFilter?: string;
  searchPlaceholder?: string;
  createButtonText?: string;
  createButtonLink?: string;
  onBulkDelete?: (ids: (string | number)[]) => void;
  onBulkDuplicate?: (ids: (string | number)[]) => void;
  onRowSelectChange?: (ids: (string | number)[]) => void;
  selectedRowIds?: (string | number)[];
  showBulkActions?: boolean;
  showSearchControls?: boolean;
  showBulkActionsOnly?: boolean;
  showHeader?: boolean;
  // Nuevas props para manejo de filtros y columnas
  onFiltersToggle?: () => void;
  onColumnsToggle?: () => void;
  showFiltersButton?: boolean;
  showColumnsButton?: boolean;
}

type SortDirection = 'asc' | 'desc' | 'none';

export function ModernTable<T>({ 
  data, 
  columns, 
  rowKey, 
  actions,
  title = "Listado de Datos",
  description = "Visualiza y gestiona todos los elementos en un solo lugar",
  stats,
  filters,
  onFilterChange,
  selectedFilter = 'todos',
  searchPlaceholder = "Buscar...",
  createButtonText = "Nuevo Elemento",
  createButtonLink,
  onBulkDelete,
  onBulkDuplicate,
  onRowSelectChange,
  selectedRowIds = [],
  showBulkActions = false,
  showSearchControls = true,
  showBulkActionsOnly = false,
  showHeader = true,
  // Nuevas props
  onFiltersToggle,
  onColumnsToggle,
  showFiltersButton = false,
  showColumnsButton = false,
}: ModernTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalSelectedItems, setInternalSelectedItems] = useState<(string | number)[]>([]);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');
  const [showBulkActionsBar, setShowBulkActionsBar] = useState(false);

  // Usar selectedRowIds si está disponible, sino usar estado interno
  const selectedItems = selectedRowIds.length > 0 ? selectedRowIds : internalSelectedItems;

  // Filtrar y ordenar datos
  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter(item => {
      // Búsqueda básica en todas las propiedades del objeto
      const searchableText = Object.values(item as any)
        .join(' ')
        .toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });

    // Ordenar
    if (sortDirection !== 'none' && sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  // Manejar ordenamiento
  const handleSort = (field: keyof T) => {
    const column = columns.find(col => col.accessorKey === field);
    if (!column?.sortable) return;

    if (sortField === field) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc'
      );
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Manejar selección de items
  const handleSelectItem = (itemId: string | number) => {
    const currentSelection = selectedRowIds.length > 0 ? selectedRowIds : internalSelectedItems;
    const newSelection = currentSelection.includes(itemId) 
      ? currentSelection.filter(id => id !== itemId)
      : [...currentSelection, itemId];
    
    // Si hay callback externo, usarlo; sino actualizar estado interno
    if (onRowSelectChange) {
      onRowSelectChange(newSelection);
    } else {
      setInternalSelectedItems(newSelection);
    }
    
    setShowBulkActionsBar(newSelection.length > 0);
  };

  const handleSelectAll = () => {
    const currentSelection = selectedRowIds.length > 0 ? selectedRowIds : internalSelectedItems;
    const newSelection = currentSelection.length === filteredAndSortedData.length 
      ? [] 
      : filteredAndSortedData.map(item => item[rowKey] as string | number);
    
    // Si hay callback externo, usarlo; sino actualizar estado interno
    if (onRowSelectChange) {
      onRowSelectChange(newSelection);
    } else {
      setInternalSelectedItems(newSelection);
    }
    
    setShowBulkActionsBar(newSelection.length > 0);
  };

  // Componente de encabezado ordenable
  const SortableHeader = ({ field, children }: { field: keyof T; children: React.ReactNode }) => {
    const column = columns.find(col => col.accessorKey === field);
    if (!column?.sortable) {
      return (
        <th className="px-3 lg:px-6 py-4 text-left text-sm font-semibold text-gray-900">
          {children}
        </th>
      );
    }

    const isActive = sortField === field;
    const direction = isActive ? sortDirection : 'none';
    
    return (
      <th 
        className="px-3 lg:px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2 group">
          <div className="flex-1 min-w-0">
            {children}
          </div>
          <div className="flex flex-col flex-shrink-0">
            {direction === 'none' && (
              <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            )}
            {direction === 'asc' && (
              <ArrowUp className="w-4 h-4 text-blue-600" />
            )}
            {direction === 'desc' && (
              <ArrowDown className="w-4 h-4 text-blue-600" />
            )}
          </div>
        </div>
      </th>
    );
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      green: 'bg-green-100 text-green-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        {showHeader && (
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600">{description}</p>
              </div>
              {createButtonLink && (
                <Link href={createButtonLink}>
                  <button className="flex items-center gap-2 px-4 lg:px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                    <Plus className="w-5 h-5" />
                    {createButtonText}
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-600 text-sm font-medium truncate">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-sm mt-1 text-gray-600 truncate">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg flex-shrink-0 ${getColorClasses(stat.color)}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controles */}
        {showSearchControls && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4 lg:p-6">
              {!showBulkActionsOnly && (
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Búsqueda */}
                  <div className="relative flex-1 w-full lg:max-w-lg">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Filtros y acciones */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {filters && filters.length > 0 && onFilterChange && (
                      <select
                        value={selectedFilter}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      >
                        {filters.map((filter) => (
                          <option key={filter.value} value={filter.value}>
                            {filter.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {showFiltersButton && (
                      <button 
                        onClick={onFiltersToggle}
                        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                      </button>
                    )}

                    {showColumnsButton && (
                      <button 
                        onClick={onColumnsToggle}
                        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Columnas</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones masivas */}
              {selectedItems.length > 0 && (
                <div className={`${!showBulkActionsOnly ? 'mt-4' : ''} flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200 gap-3`}>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-700 font-medium">
                      {selectedItems.length} elemento{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {onBulkDuplicate && (
                      <button 
                        onClick={() => onBulkDuplicate(selectedItems)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg border border-gray-300 hover:bg-blue-50 transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Duplicar</span>
                      </button>
                    )}
                    {onBulkDelete && (
                      <button 
                        onClick={() => onBulkDelete(selectedItems)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg border border-gray-300 hover:bg-red-50 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        // Si hay callback externo, usarlo; sino actualizar estado interno
                        if (onRowSelectChange) {
                          onRowSelectChange([]);
                        } else {
                          setInternalSelectedItems([]);
                        }
                        setShowBulkActionsBar(false);
                      }}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto table-container">
            <table className="min-w-[1000px] w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {showBulkActions && (
                    <th className="px-3 lg:px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </th>
                  )}
                  {columns.map((column, index) => {
                    if (column.accessorKey) {
                      return (
                        <SortableHeader key={index} field={column.accessorKey}>
                          {column.header}
                        </SortableHeader>
                      );
                    }
                    return (
                      <th key={index} className="px-3 lg:px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        {column.header}
                      </th>
                    );
                  })}
                  {actions && (
                    <th className="px-3 lg:px-6 py-4 text-left text-sm font-semibold text-gray-900 w-28">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.map((row, index) => {
                  const itemId = row[rowKey] as string | number;
                  const isSelected = selectedItems.includes(itemId);

                  return (
                    <tr 
                      key={String(itemId)} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      {showBulkActions && (
                        <td className="px-3 lg:px-6 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectItem(itemId)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                      )}
                      
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                          {column.cell ? column.cell(row) : (column.accessorKey ? String(row[column.accessorKey]) : '')}
                        </td>
                      ))}
                      
                      {actions && (
                        <td className="px-3 lg:px-6 py-4 w-28">
                          <div className="flex items-center gap-1">
                            {actions.viewLink && (
                              <Link href={actions.viewLink(row)}>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalles">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                            )}
                            {actions.editLink && (
                              <Link href={actions.editLink(row)}>
                                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Editar">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </Link>
                            )}
                            {actions.deleteAction && (
                              <DeleteConfirmButton
                                deleteAction={actions.deleteAction}
                                id={String(itemId)}
                                confirmMessage={actions.deleteConfirmMessage}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                iconOnly={true}
                              />
                            )}
                            {actions.customActions && actions.customActions.map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={action.className || "p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"}
                                title={action.label}
                              >
                                {action.icon || <MoreVertical className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0) + (showBulkActions ? 1 : 0)} className="px-3 lg:px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                      <p className="text-gray-600 mb-6">
                        {searchTerm ? `No hay elementos que coincidan con "${searchTerm}"` : 'No hay datos para mostrar'}
                      </p>
                      {createButtonLink && (
                        <Link href={createButtonLink}>
                          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            <Plus className="w-5 h-5" />
                            {createButtonText}
                          </button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 