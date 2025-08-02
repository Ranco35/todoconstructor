'use client';

// components/GenericTable.tsx (o src/components/shared/Table.tsx)
import React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface GenericTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: keyof T;
  onSelectionChange?: (selectedIds: (keyof T)[]) => void;
  className?: string;
}

export function Table<T>({ data, columns, rowKey, onSelectionChange, className }: GenericTableProps<T>) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                {onSelectionChange && (
                  <th className="py-3 px-3 lg:px-6 w-10">
                    <input type="checkbox" />
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <span className="truncate block">{column.header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="py-8 px-3 lg:px-6 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl mb-4">📋</span>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
                      <p className="text-gray-600">No se encontraron elementos para mostrar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={String(row[rowKey])} className="hover:bg-gray-50 transition-colors">
                    {onSelectionChange && (
                      <td className="py-4 px-3 lg:px-6">
                        <input type="checkbox" />
                      </td>
                    )}
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {column.cell ? column.cell(row) : String(row[column.accessorKey as keyof T] || '')}
                        </div>
                      </td>
                    ))}
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