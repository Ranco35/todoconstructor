'use client';

import React, { useState, useEffect } from 'react';
import { getAllCategories } from '@/actions/configuration/category-actions';

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface ExpenseCategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ExpenseCategorySelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar categoría",
  className 
}: ExpenseCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Categorías por defecto para caja chica
  const defaultCategories: Category[] = [
    { id: 1, name: 'Gastos Administrativos', description: 'Gastos generales de administración' },
    { id: 2, name: 'Materiales de Oficina', description: 'Papelería, útiles y suministros' },
    { id: 3, name: 'Servicios Básicos', description: 'Agua, luz, teléfono, internet' },
    { id: 4, name: 'Transporte y Movilidad', description: 'Pasajes, combustible, peajes' },
    { id: 5, name: 'Alimentación', description: 'Comidas, refrigerios, cafetería' },
    { id: 6, name: 'Mantenimiento', description: 'Reparaciones y mantenimiento general' },
    { id: 7, name: 'Limpieza e Higiene', description: 'Productos de limpieza y aseo' },
    { id: 8, name: 'Capacitación', description: 'Cursos, seminarios, materiales educativos' },
    { id: 9, name: 'Emergencias', description: 'Gastos urgentes e imprevistos' },
    { id: 10, name: 'Otros Gastos', description: 'Gastos varios no clasificados' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando categorías para gastos...');
      
      // Intentar cargar categorías desde el sistema
      const systemCategories = await getAllCategories();
      
      if (systemCategories && systemCategories.length > 0) {
        console.log('✅ Categorías cargadas desde el sistema:', systemCategories.length);
        setCategories(systemCategories);
      } else {
        console.log('⚠️ No hay categorías en el sistema, usando categorías por defecto');
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.error('❌ Error cargando categorías del sistema:', err);
      console.log('🔄 Usando categorías por defecto para caja chica');
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    if (!value) {
      console.log('[ExpenseCategorySelector] getSelectedCategory: value es null/undefined');
      return null;
    }
    const found = categories.find(c => c.id === parseInt(value));
    console.log('[ExpenseCategorySelector] getSelectedCategory: buscando', value, '->', found);
    return found;
  };
  
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedCategory = getSelectedCategory();

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`w-full flex items-center justify-between p-3 border rounded-lg bg-white text-left transition-colors ${
            loading ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-blue-400'
          } ${
            selectedCategory ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">🏷️</span>
            {loading ? (
              <span className="text-gray-500">Cargando categorías...</span>
            ) : selectedCategory ? (
              <span className="font-medium text-gray-900">{selectedCategory.name}</span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
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

        {isOpen && !loading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron categorías que coincidan con "{searchTerm}".
                </div>
              ) : (
                filteredCategories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => {
                      console.log('[ExpenseCategorySelector] onChange llamado con:', category.id.toString());
                      onChange(category.id.toString());
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                    {value === category.id.toString() && <span className="text-blue-600 text-lg">✓</span>}
                  </div>
                ))
              )}
            </div>
            
            {/* Footer informativo */}
            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                💡 {categories.length} categoría{categories.length !== 1 ? 's' : ''} disponible{categories.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
        </div>
    </div>
  );
} 