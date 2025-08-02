import React from 'react';
import type { POSProductCategory } from '@/types/pos/category';

interface Props {
  categories: POSProductCategory[];
  loading: boolean;
  onEdit: (cat: POSProductCategory) => void;
  onDelete: (cat: POSProductCategory) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}

export default function POSCategoryTable({ categories, loading, onEdit, onDelete, onToggleActive }: Props) {
  if (loading) return <div>Cargando categorías...</div>;
  if (!categories.length) return <div>No hay categorías POS registradas.</div>;

  return (
    <table className="min-w-full border">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Nombre Visible</th>
          <th>Tipo</th>
          <th>Icono</th>
          <th>Color</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(cat => (
          <tr key={cat.id} className={!cat.isActive ? 'opacity-60' : ''}>
            <td>{cat.name}</td>
            <td>{cat.displayName}</td>
            <td>{cat.cashRegisterTypeId === 2 ? 'Restaurante' : 'Recepción'}</td>
            <td>{cat.icon || '-'}</td>
            <td>
              {cat.color ? (
                <span style={{ background: cat.color, padding: '0 8px', borderRadius: 4 }}>{cat.color}</span>
              ) : '-'}
            </td>
            <td>
              <button
                className={cat.isActive ? 'text-green-600 font-bold' : 'text-gray-400'}
                onClick={() => onToggleActive(cat.id, !cat.isActive)}
                title={cat.isActive ? 'Desactivar' : 'Activar'}
              >
                {cat.isActive ? 'Activo' : 'Inactivo'}
              </button>
            </td>
            <td>
              <button className="text-blue-600 underline mr-2" onClick={() => onEdit(cat)}>
                Editar
              </button>
              <button className="text-red-600 underline" onClick={() => onDelete(cat)}>
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 