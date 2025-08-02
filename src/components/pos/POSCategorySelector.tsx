"use client";

import React, { useEffect, useState } from 'react';
import { getPOSCategories } from '@/actions/pos/pos-category-actions';
import type { POSProductCategory } from '@/types/pos/category';

interface POSCategorySelectorProps {
  value?: number;
  onChange: (categoryId: number) => void;
  typeId?: number; // 1: Recepción, 2: Restaurante
}

export default function POSCategorySelector({ value, onChange, typeId = 2 }: POSCategorySelectorProps) {
  const [categories, setCategories] = useState<POSProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPOSCategories(typeId)
      .then(data => setCategories(data.filter(cat => cat.isActive)))
      .finally(() => setLoading(false));
  }, [typeId]);

  return (
    <div>
      <label className="block mb-1 font-medium">Categoría POS</label>
      {loading ? (
        <div className="text-gray-500">Cargando categorías...</div>
      ) : (
        <select
          className="border px-2 py-1 rounded w-full"
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
        >
          <option value="">Selecciona una categoría...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.displayName} {cat.icon ? `(${cat.icon})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
} 