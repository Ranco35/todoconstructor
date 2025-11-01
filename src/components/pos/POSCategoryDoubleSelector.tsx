import React, { useEffect, useState } from 'react';
import { getPOSCategories } from '@/actions/pos/pos-category-actions';

interface POSCategoryDoubleSelectorProps {
  value: { ferreteria2?: number | null; ferreteria?: number | null };
  onChange: (val: { ferreteria2?: number | null; ferreteria?: number | null }) => void;
}

export default function POSCategoryDoubleSelector({ value, onChange }: POSCategoryDoubleSelectorProps) {
  const [ferreteria2Categories, setFerreteria2Categories] = useState<any[]>([]);
  const [ferreteriaCategories, setFerreteriaCategories] = useState<any[]>([]);

  useEffect(() => {
    getPOSCategories(2).then(data => setFerreteria2Categories(data.filter(cat => cat.isActive)));
    getPOSCategories(1).then(data => setFerreteriaCategories(data.filter(cat => cat.isActive)));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-medium">Categoría POS para Ferreteria2</label>
        <select
          className="border px-2 py-1 rounded w-full"
          value={value.ferreteria2 || ''}
          onChange={e => onChange({ ...value, ferreteria2: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Sin categoría</option>
          {ferreteria2Categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.displayName} {cat.icon ? `(${cat.icon})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Categoría POS para Ferreteria</label>
        <select
          className="border px-2 py-1 rounded w-full"
          value={value.ferreteria || ''}
          onChange={e => onChange({ ...value, ferreteria: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Sin categoría</option>
          {ferreteriaCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.displayName} {cat.icon ? `(${cat.icon})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 