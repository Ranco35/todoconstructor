'use client';

import { useState } from 'react';
import { BedConfig, Room } from '@/actions/configuration/room-actions';
import { Plus, Minus, Bed, MapPin, DollarSign } from 'lucide-react';

interface RoomFormProps {
  room?: Room;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RoomForm({ room, onSubmit, onCancel, isLoading }: RoomFormProps) {
  const [bedConfigs, setBedConfigs] = useState<BedConfig[]>(
    room?.bed_config || [{ type: 'matrimonial', quantity: 1 }]
  );

  const [formData, setFormData] = useState({
    number: room?.number || '',
    type: room?.type || '',
    capacity: Number(room?.capacity) || 2,
    max_capacity: Number(room?.max_capacity) || 3,
    child_capacity: Number(room?.child_capacity) || 0,
    floor: Number(room?.floor) || 1,
    building: room?.building || 'Modulo 1',
    view_type: room?.view_type || 'interior',
    extra_bed_available: room?.extra_bed_available || false,
    extra_bed_price: Number(room?.extra_bed_price) || 25000,
    wifi: room?.wifi ?? true,
    minibar: room?.minibar || false,
    balcony: room?.balcony || false,
    jacuzzi: room?.jacuzzi || false,
    amenities: room?.amenities || '',
    price_per_night: Number(room?.price_per_night) || 0,
    price_low_season: Number(room?.price_low_season) || 0,
    price_mid_season: Number(room?.price_mid_season) || 0,
    price_high_season: Number(room?.price_high_season) || 0,
    room_status: room?.room_status || 'available'
  });

  const bedTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'matrimonial', label: 'Matrimonial' },
    { value: 'queen', label: 'Queen' },
    { value: 'king', label: 'King' },
    { value: 'sofa_cama', label: 'Sofá Cama' }
  ];

  const viewTypes = [
    { value: 'mar', label: 'Vista al Mar' },
    { value: 'montaña', label: 'Vista a la Montaña' },
    { value: 'jardín', label: 'Vista al Jardín' },
    { value: 'piscina', label: 'Vista a la Piscina' },
    { value: 'interior', label: 'Vista Interior' },
    { value: 'ciudad', label: 'Vista a la Ciudad' }
  ];

  const addBedConfig = () => {
    setBedConfigs([...bedConfigs, { type: 'individual', quantity: 1 }]);
  };

  const removeBedConfig = (index: number) => {
    setBedConfigs(bedConfigs.filter((_, i) => i !== index));
  };

  const updateBedConfig = (index: number, field: keyof BedConfig, value: any) => {
    const updated = [...bedConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setBedConfigs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que no haya valores NaN
    const validatedData = {
      ...formData,
      capacity: Number(formData.capacity) || 1,
      max_capacity: Number(formData.max_capacity) || 1,
      child_capacity: Number(formData.child_capacity) || 0,
      floor: Number(formData.floor) || 1,
      extra_bed_price: Number(formData.extra_bed_price) || 0,
      price_per_night: Number(formData.price_per_night) || 1,
      price_low_season: Number(formData.price_low_season) || 0,
      price_mid_season: Number(formData.price_mid_season) || 0,
      price_high_season: Number(formData.price_high_season) || 0,
    };

    // Validaciones básicas
    if (!validatedData.number.trim()) {
      alert('El número de habitación es obligatorio');
      return;
    }
    
    if (!validatedData.type.trim()) {
      alert('El tipo de habitación es obligatorio');
      return;
    }
    
    if (validatedData.capacity < 1) {
      alert('La capacidad debe ser mayor a 0');
      return;
    }
    
    if (validatedData.price_per_night <= 0) {
      alert('El precio base debe ser mayor a 0');
      return;
    }
    
    const form = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      form.append(key, value.toString());
    });
    form.append('bed_config', JSON.stringify(bedConfigs));
    
    await onSubmit(form);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Bed className="w-6 h-6 text-blue-600" />
          {room ? 'Editar Habitación' : 'Nueva Habitación'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Habitación *
            </label>
            <input
              type="text"
              required
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Habitación *
            </label>
            <input
              type="text"
              required
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad Estándar *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad Máxima *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.max_capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Piso
            </label>
            <input
              type="number"
              min="1"
              value={formData.floor}
              onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edificio
            </label>
            <select
              value={formData.building}
              onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Modulo 1">Modulo 1</option>
              <option value="Modulo 2">Modulo 2</option>
              <option value="Cabañas">Cabañas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad Niños
            </label>
            <input
              type="number"
              min="0"
              value={formData.child_capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, child_capacity: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Vista
            </label>
            <select
              value={formData.view_type}
              onChange={(e) => setFormData(prev => ({ ...prev, view_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {viewTypes.map(view => (
                <option key={view.value} value={view.value}>
                  {view.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Camas Extra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="extra_bed"
              checked={formData.extra_bed_available}
              onChange={(e) => setFormData(prev => ({ ...prev, extra_bed_available: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="extra_bed" className="text-sm font-medium text-gray-700">
              Cama extra disponible
            </label>
          </div>

          {formData.extra_bed_available && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Cama Extra
              </label>
              <input
                type="number"
                min="0"
                value={formData.extra_bed_price}
                onChange={(e) => setFormData(prev => ({ ...prev, extra_bed_price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Amenidades Adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amenidades Adicionales
          </label>
          <textarea
            value={formData.amenities}
            onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe amenidades adicionales..."
          />
        </div>

        {/* Configuración de Camas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Configuración de Camas</h3>
            <button
              type="button"
              onClick={addBedConfig}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {bedConfigs.map((bed, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <select
                value={bed.type}
                onChange={(e) => updateBedConfig(index, 'type', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                {bedTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                min="1"
                max="5"
                value={bed.quantity}
                onChange={(e) => updateBedConfig(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
              />

              {bedConfigs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBedConfig(index)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Servicios */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Servicios</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'wifi', label: 'WiFi' },
              { key: 'minibar', label: 'Minibar' },
              { key: 'balcony', label: 'Balcón' },
              { key: 'jacuzzi', label: 'Jacuzzi' }
            ].map(service => (
              <label key={service.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData[service.key as keyof typeof formData] as boolean}
                  onChange={(e) => setFormData(prev => ({ ...prev, [service.key]: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{service.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Precios por Temporadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💰 Precio Base *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.price_per_night}
              onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: parseFloat(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Tarifa estándar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🟢 Temporada Baja
            </label>
            <input
              type="number"
              min="0"
              value={formData.price_low_season}
              onChange={(e) => setFormData(prev => ({ ...prev, price_low_season: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Menor demanda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🟡 Temporada Media
            </label>
            <input
              type="number"
              min="0"
              value={formData.price_mid_season}
              onChange={(e) => setFormData(prev => ({ ...prev, price_mid_season: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              placeholder="Demanda moderada"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔴 Temporada Alta
            </label>
            <input
              type="number"
              min="0"
              value={formData.price_high_season}
              onChange={(e) => setFormData(prev => ({ ...prev, price_high_season: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Mayor demanda"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : (room ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
} 