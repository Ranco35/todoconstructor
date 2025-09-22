'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';

interface ColumnOption {
  key: string;
  label: string;
}

interface ColumnSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnOption[];
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  storageKey?: string;
}

export default function ColumnSelectorModal({
  isOpen,
  onClose,
  columns,
  visibleColumns,
  onColumnsChange,
  storageKey = 'tableColumns'
}: ColumnSelectorModalProps) {
  const [localVisibleColumns, setLocalVisibleColumns] = useState<string[]>(visibleColumns);

  // Sincronizar con props cuando cambien
  useEffect(() => {
    setLocalVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  const handleToggleColumn = (key: string) => {
    setLocalVisibleColumns(prev => {
      const updated = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      return updated;
    });
  };

  const handleSelectAll = () => {
    setLocalVisibleColumns(columns.map(c => c.key));
  };

  const handleSelectNone = () => {
    setLocalVisibleColumns([]);
  };

  const handleReset = () => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.removeItem(storageKey);
    }
    setLocalVisibleColumns(columns.map(c => c.key));
  };

  const handleApply = () => {
    onColumnsChange(localVisibleColumns);
    onClose();
  };

  const handleCancel = () => {
    setLocalVisibleColumns(visibleColumns);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Seleccionar Columnas</h3>
            <p className="text-sm text-gray-600 mt-1">
              Elige qué columnas mostrar en la tabla
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Todas
            </button>
            <button
              onClick={handleSelectNone}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ninguna
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Column List */}
          <div className="space-y-2">
            {columns.map((column) => {
              const isVisible = localVisibleColumns.includes(column.key);
              return (
                <label
                  key={column.key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleToggleColumn(column.key)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isVisible 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {isVisible && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-1">
                    {column.label}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {column.key}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>💡 Tip:</strong> Las columnas seleccionadas se guardarán automáticamente para tu próxima visita.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Aplicar ({localVisibleColumns.length})
          </button>
        </div>
      </div>
    </div>
  );
}
