"use client";

import React, { useEffect, useState } from 'react';
import POSCategoryTable from './POSCategoryTable';
import POSCategoryForm from './POSCategoryForm';
import { getPOSCategories, createPOSCategory, updatePOSCategory, deletePOSCategory, togglePOSCategoryActive } from '@/actions/pos/pos-category-actions';
import type { POSProductCategory } from '@/types/pos/category';

export default function POSCategoryManager() {
  const [categories, setCategories] = useState<POSProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<POSProductCategory | null>(null);
  const [deleting, setDeleting] = useState<POSProductCategory | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPOSCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Crear o actualizar categoría
  const handleSave = async (values: Omit<POSProductCategory, 'id' | 'createdAt' | 'updatedAt'>, id?: number) => {
    setError(null);
    try {
      if (id) {
        await updatePOSCategory(id, values);
      } else {
        await createPOSCategory(values);
      }
      setEditing(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    }
  };

  // Eliminar categoría
  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await deletePOSCategory(id);
      setDeleting(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    }
  };

  // Activar/desactivar categoría
  const handleToggleActive = async (id: number, isActive: boolean) => {
    setError(null);
    try {
      await togglePOSCategoryActive(id, isActive);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado');
    }
  };

  // Separar categorías por tipo
  const receptionCategories = categories.filter(cat => cat.cashRegisterTypeId === 1);
  const restaurantCategories = categories.filter(cat => cat.cashRegisterTypeId === 2);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Categorías POS</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold mb-2 text-blue-700">Categorías Recepción</h2>
          <POSCategoryTable
            categories={receptionCategories}
            loading={loading}
            onEdit={setEditing}
            onDelete={cat => setDeleting(cat)}
            onToggleActive={handleToggleActive}
          />
        </div>
        <div className="border rounded-lg p-4 bg-orange-50">
          <h2 className="text-lg font-semibold mb-2 text-orange-700">Categorías Restaurante</h2>
          <POSCategoryTable
            categories={restaurantCategories}
            loading={loading}
            onEdit={setEditing}
            onDelete={cat => setDeleting(cat)}
            onToggleActive={handleToggleActive}
          />
        </div>
      </div>
      <div>
        <POSCategoryForm
          key={editing?.id || 'new'}
          initialData={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
      {/* Modal de confirmación de eliminación */}
      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="font-bold mb-2">¿Eliminar categoría?</h2>
            <p className="mb-4">¿Seguro que deseas eliminar la categoría <b>{deleting.displayName}</b>?</p>
            <div className="flex gap-2">
              <button className="bg-red-600 text-white px-4 py-1 rounded" onClick={() => handleDelete(deleting.id)}>Eliminar</button>
              <button className="bg-gray-300 px-4 py-1 rounded" onClick={() => setDeleting(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 