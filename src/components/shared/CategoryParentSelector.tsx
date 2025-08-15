'use client';

import React, { useEffect, useState } from 'react';
import { Category } from '@/types/database';

interface CategoryParentSelectorProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  excludeId?: number;
}

export default function CategoryParentSelector({ value, onChange, excludeId }: CategoryParentSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories?flat=true');
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setCategories(data.filter((cat: Category) => cat.id !== excludeId));
        } else {
          setCategories([]);
        }
      } catch (error) {
        // Manejo silencioso de errores para evitar console errors
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [excludeId]);

  return (
    <div>
      <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
        Categoría Padre <span className="text-gray-400">(opcional)</span>
      </label>
      <select
        id="parentId"
        name="parentId"
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      >
        <option value="">Sin categoría padre (raíz)</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <p className="mt-1 text-sm text-gray-500">
        Selecciona una categoría padre para crear una jerarquía
      </p>
    </div>
  );
} 