'use client';

import { useState } from 'react';
import { Room } from '@/actions/configuration/room-actions';
import { Edit, Trash2, Eye, MapPin, Users, Bed, DollarSign, Wifi, WineIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface RoomTableProps {
  rooms: Room[];
  onDelete: (id: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RoomTable({ rooms, onDelete, currentPage, totalPages, onPageChange }: RoomTableProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
      occupied: { label: 'Ocupada', className: 'bg-blue-100 text-blue-800' },
      maintenance: { label: 'Mantenimiento', className: 'bg-yellow-100 text-yellow-800' },
      cleaning: { label: 'Limpieza', className: 'bg-purple-100 text-purple-800' },
      out_of_order: { label: 'Fuera de Servicio', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getBedDescription = (bedConfig: any[]) => {
    if (!bedConfig || bedConfig.length === 0) return 'No especificado';
    
    return bedConfig.map(bed => 
      `${bed.quantity} ${bed.type.replace('_', ' ')}`
    ).join(', ');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getAmenityIcons = (room: Room) => {
    const amenities = [];
    if (room.wifi) amenities.push({ icon: <Wifi className="w-4 h-4" />, label: 'WiFi' });
    if (room.minibar) amenities.push({ icon: <WineIcon className="w-4 h-4" />, label: 'Minibar' });
    if (room.balcony) amenities.push({ icon: <MapPin className="w-4 h-4" />, label: 'Balcón' });
    if (room.jacuzzi) amenities.push({ icon: <div className="w-4 h-4 text-blue-600">🛁</div>, label: 'Jacuzzi' });
    
    return amenities;
  };

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Habitación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo y Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Camas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicios
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bed className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {room.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Piso {room.floor || 1}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{room.type}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {room.building} • {room.view_type}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {room.capacity}/{room.max_capacity}
                    </div>
                    {room.child_capacity > 0 && (
                      <div className="text-xs text-gray-500">
                        +{room.child_capacity} niños
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {getBedDescription(room.bed_config)}
                    </div>
                    {room.extra_bed_available && (
                      <div className="text-xs text-gray-500">
                        Cama extra: {formatPrice(room.extra_bed_price)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(room.price_per_night)}
                    </div>
                    {room.price_low_season > 0 && (
                      <div className="text-xs text-gray-500">
                        Baja: {formatPrice(room.price_low_season)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(room.room_status)}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getAmenityIcons(room).slice(0, 3).map((amenity, index) => (
                        <div key={index} title={amenity.label} className="text-gray-400">
                          {amenity.icon}
                        </div>
                      ))}
                      {getAmenityIcons(room).length > 3 && (
                        <span className="text-xs text-gray-500">+{getAmenityIcons(room).length - 3}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/dashboard/configuration/rooms/edit/${room.id}`}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => onDelete(room.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bed className="w-5 h-5 text-blue-600" />
                Habitación {selectedRoom.number} - {selectedRoom.type}
              </h3>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ubicación</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Edificio: {selectedRoom.building}</div>
                    <div>Piso: {selectedRoom.floor}</div>
                    <div>Vista: {selectedRoom.view_type}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Capacidad</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Estándar: {selectedRoom.capacity} personas</div>
                    <div>Máxima: {selectedRoom.max_capacity} personas</div>
                    {selectedRoom.child_capacity > 0 && (
                      <div>Niños: {selectedRoom.child_capacity} adicionales</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Camas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Configuración de Camas</h4>
                <div className="text-sm text-gray-600">
                  {getBedDescription(selectedRoom.bed_config)}
                  {selectedRoom.extra_bed_available && (
                    <div className="mt-1">
                      Cama extra disponible: {formatPrice(selectedRoom.extra_bed_price)}
                    </div>
                  )}
                </div>
              </div>

              {/* Precios por Temporadas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Precios por Temporadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-gray-600">💰 Precio Base</div>
                    <div className="font-medium text-blue-700">{formatPrice(selectedRoom.price_per_night)}</div>
                  </div>
                  {selectedRoom.price_low_season > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-gray-600">🟢 Temporada Baja</div>
                      <div className="font-medium text-green-700">{formatPrice(selectedRoom.price_low_season)}</div>
                    </div>
                  )}
                  {selectedRoom.price_mid_season > 0 && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="text-gray-600">🟡 Temporada Media</div>
                      <div className="font-medium text-yellow-700">{formatPrice(selectedRoom.price_mid_season)}</div>
                    </div>
                  )}
                  {selectedRoom.price_high_season > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="text-gray-600">🔴 Temporada Alta</div>
                      <div className="font-medium text-red-700">{formatPrice(selectedRoom.price_high_season)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Servicios */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Servicios y Amenidades</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getAmenityIcons(selectedRoom).map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      {amenity.icon}
                      <span>{amenity.label}</span>
                    </div>
                  ))}
                </div>
                {selectedRoom.amenities && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Adicionales:</strong> {selectedRoom.amenities}
                  </div>
                )}
              </div>

              {/* Estado */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estado Actual</h4>
                {getStatusBadge(selectedRoom.room_status)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 