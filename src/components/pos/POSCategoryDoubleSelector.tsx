import React, { useEffect, useState } from 'react';
import { getPOSCategories } from '@/actions/pos/pos-category-actions';

interface POSCategoryDoubleSelectorProps {
  value: { restaurante?: number | null; recepcion?: number | null };
  onChange: (val: { restaurante?: number | null; recepcion?: number | null }) => void;
}

export default function POSCategoryDoubleSelector({ value, onChange }: POSCategoryDoubleSelectorProps) {
  const [restauranteCategories, setRestauranteCategories] = useState<any[]>([]);
  const [recepcionCategories, setRecepcionCategories] = useState<any[]>([]);

  useEffect(() => {
    getPOSCategories(2).then(data => setRestauranteCategories(data.filter(cat => cat.isActive)));
    getPOSCategories(1).then(data => setRecepcionCategories(data.filter(cat => cat.isActive)));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-medium">Categoría POS para Restaurante</label>
        <select
          className="border px-2 py-1 rounded w-full"
          value={value.restaurante || ''}
          onChange={e => onChange({ ...value, restaurante: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Sin categoría</option>
          {restauranteCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.displayName} {cat.icon ? `(${cat.icon})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Categoría POS para Recepción</label>
        <select
          className="border px-2 py-1 rounded w-full"
          value={value.recepcion || ''}
          onChange={e => onChange({ ...value, recepcion: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Sin categoría</option>
          {recepcionCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.displayName} {cat.icon ? `(${cat.icon})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 