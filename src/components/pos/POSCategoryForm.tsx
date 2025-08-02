"use client";

import React, { useState, useEffect } from 'react';
import type { POSProductCategory } from '@/types/pos/category';

interface Props {
  initialData?: POSProductCategory | null;
  onSave: (values: Omit<POSProductCategory, 'id' | 'createdAt' | 'updatedAt'>, id?: number) => void;
  onCancel: () => void;
}

const defaultValues = {
  name: '',
  displayName: '',
  icon: '',
  color: '#3B82F6',
  cashRegisterTypeId: 1, // Cambiado a Recepción por defecto
  isActive: true,
  sortOrder: 0,
};

export default function POSCategoryForm({ initialData, onSave, onCancel }: Props) {
  const [values, setValues] = useState<Omit<POSProductCategory, 'id' | 'createdAt' | 'updatedAt'>>(
    initialData
      ? { ...initialData }
      : defaultValues
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setValues(initialData ? { ...initialData } : defaultValues);
    setSuccess(false);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value === '' ? '' : (name === 'cashRegisterTypeId' || name === 'sortOrder' ? parseInt(value) : value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values, initialData?.id);
    setSuccess(true);
    if (!initialData) setValues(defaultValues); // Limpiar si es nuevo
  };

  // Función para crear categoría específica para un tipo de POS
  const createForType = (typeId: number) => {
    const categoryData = { ...values, cashRegisterTypeId: typeId };
    onSave(categoryData);
    setSuccess(true);
    setValues(defaultValues); // Limpiar formulario
  };

  const getCashRegisterTypeName = (typeId: number) => {
    return typeId === 1 ? 'Recepción' : 'Restaurante';
  };

  const getCashRegisterTypeColor = (typeId: number) => {
    return typeId === 1 ? 'blue' : 'orange';
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded mb-4 bg-gray-50">
      <h2 className="font-semibold mb-4 text-lg">
        {initialData ? 'Editar Categoría' : 'Nueva Categoría POS'}
      </h2>
      
      {success && (
        <div className="text-green-600 mb-4 p-2 bg-green-50 border border-green-200 rounded">
          ✅ ¡Categoría guardada exitosamente!
        </div>
      )}

      {/* Indicador visual del tipo de POS seleccionado */}
      {!initialData && (
        <div className={`mb-4 p-3 rounded-lg border ${values.cashRegisterTypeId === 1 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Tipo de POS seleccionado:
          </div>
          <div className={`text-lg font-bold ${values.cashRegisterTypeId === 1 ? 'text-blue-700' : 'text-orange-700'}`}>
            🏪 {getCashRegisterTypeName(values.cashRegisterTypeId)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Interno *
          </label>
          <input 
            name="name" 
            value={values.name} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="ej: menu_dia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Visible *
          </label>
          <input 
            name="displayName" 
            value={values.displayName} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="ej: Menú del Día"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icono
          </label>
          <select 
            name="icon" 
            value={values.icon} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar icono</option>
            <optgroup label="🍽️ Restaurante & Comida">
              <option value="🍽️">🍽️ Comida General</option>
              <option value="🥘">🥘 Platos Principales</option>
              <option value="🍲">🍲 Sopas y Guisos</option>
              <option value="🥗">🥗 Ensaladas</option>
              <option value="🍕">🍕 Pizza</option>
              <option value="🍔">🍔 Hamburguesas</option>
              <option value="🌮">🌮 Tacos</option>
              <option value="🍜">🍜 Fideos/Pasta</option>
              <option value="🍱">🍱 Comida Asiática</option>
              <option value="🥙">🥙 Wraps/Sándwiches</option>
              <option value="🍳">🍳 Desayunos</option>
              <option value="🥞">🥞 Pancakes</option>
              <option value="🧀">🧀 Quesos</option>
              <option value="🥩">🥩 Carnes</option>
              <option value="🐟">🐟 Pescados</option>
              <option value="🦐">🦐 Mariscos</option>
            </optgroup>
            <optgroup label="🥤 Bebidas">
              <option value="☕">☕ Café</option>
              <option value="🫖">🫖 Té</option>
              <option value="🥤">🥤 Refrescos</option>
              <option value="🧃">🧃 Jugos</option>
              <option value="🍺">🍺 Cerveza</option>
              <option value="🍷">🍷 Vino</option>
              <option value="🥃">🥃 Licores</option>
              <option value="🍸">🍸 Cocteles</option>
              <option value="🥛">🥛 Lácteos</option>
              <option value="🧊">🧊 Bebidas Frías</option>
            </optgroup>
            <optgroup label="🍰 Postres & Dulces">
              <option value="🍰">🍰 Tortas</option>
              <option value="🧁">🧁 Cupcakes</option>
              <option value="🍪">🍪 Galletas</option>
              <option value="🍮">🍮 Flanes</option>
              <option value="🍨">🍨 Helados</option>
              <option value="🍫">🍫 Chocolates</option>
              <option value="🍬">🍬 Caramelos</option>
              <option value="🥧">🥧 Pasteles</option>
            </optgroup>
            <optgroup label="🏨 Hotel & Spa">
              <option value="💆">💆 Masajes</option>
              <option value="🛁">🛁 Spa</option>
              <option value="🏊">🏊 Piscina</option>
              <option value="🛏️">🛏️ Habitaciones</option>
              <option value="🧴">🧴 Productos Spa</option>
              <option value="🌸">🌸 Belleza</option>
              <option value="💅">💅 Manicure</option>
              <option value="✨">✨ Tratamientos</option>
              <option value="🧘">🧘 Relajación</option>
              <option value="🌿">🌿 Natural/Orgánico</option>
            </optgroup>
            <optgroup label="🎯 Programas & Actividades">
              <option value="🎯">🎯 Programas</option>
              <option value="📅">📅 Paquetes</option>
              <option value="🎪">🎪 Entretenimiento</option>
              <option value="🏃">🏃 Deportes</option>
              <option value="🚴">🚴 Actividades</option>
              <option value="🎨">🎨 Arte</option>
              <option value="🎵">🎵 Música</option>
              <option value="📚">📚 Educativo</option>
            </optgroup>
            <optgroup label="🏪 General">
              <option value="🏪">🏪 Tienda General</option>
              <option value="🛍️">🛍️ Compras</option>
              <option value="💳">💳 Servicios</option>
              <option value="📦">📦 Productos</option>
              <option value="🎁">🎁 Regalos</option>
              <option value="🏷️">🏷️ Ofertas</option>
              <option value="⭐">⭐ Premium</option>
              <option value="🔥">🔥 Populares</option>
              <option value="🆕">🆕 Nuevo</option>
              <option value="💎">💎 Especiales</option>
            </optgroup>
          </select>
          <div className="mt-1 text-xs text-gray-500">
            Vista previa: {values.icon && <span className="text-lg">{values.icon}</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={values.color}
              onChange={handleChange}
              name="color"
              className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              name="color"
              value={values.color}
              onChange={handleChange}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="#3B82F6"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Vista previa: <span 
              className="inline-block w-4 h-4 rounded border border-gray-300" 
              style={{ backgroundColor: values.color }}
            ></span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de POS *
          </label>
          <select 
            name="cashRegisterTypeId" 
            value={values.cashRegisterTypeId} 
            onChange={handleChange} 
            className={`w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${values.cashRegisterTypeId === 1 ? 'bg-blue-50' : 'bg-orange-50'}`}
          >
            <option value={1}>🏨 Recepción</option>
            <option value={2}>🍽️ Restaurante</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orden
          </label>
          <input 
            type="number"
            name="sortOrder" 
            value={values.sortOrder} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            min="0"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            name="isActive" 
            checked={values.isActive} 
            onChange={handleChange} 
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Categoría activa</span>
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {initialData ? (
          // Modo edición - botón normal
          <div className="flex gap-2">
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ✅ Actualizar Categoría
            </button>
            <button 
              type="button" 
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors" 
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        ) : (
          // Modo creación - botones específicos por tipo
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Crear categoría para:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => createForType(1)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={!values.name || !values.displayName}
              >
                🏨 Crear para Recepción
              </button>
              <button
                type="button"
                onClick={() => createForType(2)}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={!values.name || !values.displayName}
              >
                🍽️ Crear para Restaurante
              </button>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Los campos "Nombre Interno" y "Nombre Visible" son obligatorios
            </div>
          </div>
        )}
      </div>
    </form>
  );
} 