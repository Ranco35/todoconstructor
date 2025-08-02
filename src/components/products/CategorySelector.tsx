'use client';

import React, { useState, useEffect } from 'react';
import { getAllCategories } from '@/actions/configuration/category-actions';

interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  Parent?: {
    name: string;
  } | null;
  _count?: {
    Product: number;
  };
}

interface CategorySelectorProps {
  value?: number;
  onChange: (categoryId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CategorySelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar categoría", 
  required = false 
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categories = await getAllCategories();
        setCategories(categories);
        setError(null);
      } catch (err) {
        console.error('Error cargando categorías:', err);
        setError('Error al cargar categorías');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === '') {
      onChange(undefined);
    } else {
      onChange(parseInt(selectedValue));
    }
  };

  // Función para crear la estructura jerárquica
  const createHierarchicalOptions = () => {
    const rootCategories = categories.filter(cat => !cat.parentId);
    const childCategories = categories.filter(cat => cat.parentId);
    
    const options: JSX.Element[] = [];
    
    // Agregar categorías raíz y sus hijos
    rootCategories.forEach(rootCategory => {
      // Agregar categoría padre
      options.push(
        <option key={rootCategory.id} value={rootCategory.id}>
          📁 {rootCategory.name}
          {rootCategory._count && rootCategory._count.Product > 0 && 
            ` (${rootCategory._count.Product} productos)`
          }
        </option>
      );
      
      // Agregar categorías hijas de esta categoría padre
      const children = childCategories.filter(child => child.parentId === rootCategory.id);
      children.forEach(child => {
        options.push(
          <option key={child.id} value={child.id}>
            ┗━ {child.name}
            {child._count && child._count.Product > 0 && 
              ` (${child._count.Product} productos)`
            }
          </option>
        );
      });
    });
    
    // Agregar categorías huérfanas (sin padre válido) al final
    const orphanCategories = childCategories.filter(cat => 
      !rootCategories.find(root => root.id === cat.parentId)
    );
    
    if (orphanCategories.length > 0) {
      options.push(
        <option key="separator" disabled value="">
          ───────────────────
        </option>
      );
      orphanCategories.forEach(orphan => {
        options.push(
          <option key={orphan.id} value={orphan.id}>
            🔗 {orphan.name}
            {orphan._count && orphan._count.Product > 0 && 
              ` (${orphan._count.Product} productos)`
            }
          </option>
        );
      });
    }
    
    return options;
  };

  if (error) {
    return (
      <div className="mt-1">
        <select 
          disabled 
          className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
        >
          <option>Error al cargar categorías</option>
        </select>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={loading}
        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          loading ? 'bg-gray-100 text-gray-500' : 'bg-white'
        }`}
      >
        <option value="">
          {loading ? 'Cargando categorías...' : '📂 Todas las categorías'}
        </option>
        {!loading && createHierarchicalOptions()}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando categorías disponibles...</p>
      )}
      
      {!loading && categories.length === 0 && (
        <div className="mt-1">
          <p className="text-sm text-gray-500">No hay categorías disponibles.</p>
          <p className="text-sm text-blue-600">
                          <a href="/dashboard/configuration/category/create" className="underline">
              Crear nueva categoría →
            </a>
          </p>
        </div>
      )}
      
      {!loading && categories.length > 0 && (
        <div className="mt-1">
          <p className="text-sm text-gray-600">
            📁 = Categoría Principal &nbsp;&nbsp; ┗━ = Subcategoría &nbsp;&nbsp; 🔗 = Sin categoría padre
          </p>
        </div>
      )}
    </div>
  );
} 