'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Users, Bed } from 'lucide-react';

interface Room {
  number: string;
  type: string;
  price: number;
  features: string[];
  status: 'available' | 'limited';
  capacity?: number;
  code?: string;
  // Para distribución automática en backend
  adults?: number;
  children?: number;
  children_ages?: number[];
}

interface MultiRoomSelectorModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  selectedRooms: Room[];
  onConfirm: (rooms: Room[]) => void;
  // Pasajeros totales para información y distribución automática
  totalAdults?: number;
  totalChildren?: number;
  totalChildrenAges?: number[];
}

const MultiRoomSelectorModal: React.FC<MultiRoomSelectorModalProps> = ({ 
  open, 
  onClose, 
  rooms, 
  selectedRooms, 
  onConfirm,
  totalAdults = 2,
  totalChildren = 0, 
  totalChildrenAges = []
}) => {
  const [internalSelection, setInternalSelection] = useState<Room[]>(selectedRooms);

  // Sincronizar con props cuando se abre el modal
  useEffect(() => {
    if (open) {
      setInternalSelection(selectedRooms);
    }
  }, [open, selectedRooms]);

  // Función para distribuir pasajeros automáticamente (solo para backend)
  const distributeGuestsAutomatically = (rooms: Room[]) => {
    if (rooms.length === 0) return rooms;
    
    const adultsPerRoom = Math.floor(totalAdults / rooms.length);
    const extraAdults = totalAdults % rooms.length;
    const childrenPerRoom = Math.floor(totalChildren / rooms.length);
    const extraChildren = totalChildren % rooms.length;

    // Distribuir las edades de niños
    const allChildrenAges = [...totalChildrenAges];
    let ageIndex = 0;

    return rooms.map((room, index) => {
      const roomAdults = adultsPerRoom + (index < extraAdults ? 1 : 0);
      const roomChildren = childrenPerRoom + (index < extraChildren ? 1 : 0);
      
      // Asignar edades específicas para esta habitación
      const roomChildrenAges = [];
      for (let i = 0; i < roomChildren; i++) {
        if (ageIndex < allChildrenAges.length) {
          roomChildrenAges.push(allChildrenAges[ageIndex]);
          ageIndex++;
        } else {
          roomChildrenAges.push(5); // Edad por defecto
        }
      }

      return {
        ...room,
        adults: roomAdults,
        children: roomChildren,
        children_ages: roomChildrenAges
      };
    });
  };

  const toggleRoom = (room: Room) => {
    setInternalSelection(prev => {
      const isSelected = prev.some(r => r.number === room.number);
      let newSelection;
      
      if (isSelected) {
        // Quitar habitación
        newSelection = prev.filter(r => r.number !== room.number);
      } else {
        // Agregar habitación
        newSelection = [...prev, room];
      }
      
      // Redistribuir automáticamente cuando se agrega/quita una habitación
      return distributeGuestsAutomatically(newSelection);
    });
  };

  const isRoomSelected = (room: Room) => {
    return internalSelection.some(r => r.number === room.number);
  };

  const handleConfirm = () => {
    const roomsWithDistribution = distributeGuestsAutomatically(internalSelection);
    onConfirm(roomsWithDistribution);
    onClose();
  };

  const handleCancel = () => {
    setInternalSelection(selectedRooms);
    onClose();
  };

  const calculateTotalPrice = () => {
    return internalSelection.reduce((total, room) => total + room.price, 0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="text-2xl font-bold text-center mb-4">
          🏨 Seleccionar Habitaciones
        </DialogTitle>
        
        <div className="text-center text-yellow-600 mb-4">
          💡 ¡No olvides hacer click en "CONFIRMAR" al final!
        </div>

        {/* Header con información de selección */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {internalSelection.length} habitacion{internalSelection.length !== 1 ? 'es' : ''} seleccionada{internalSelection.length !== 1 ? 's' : ''}
                </h3>
                <div className="text-sm text-blue-700">
                  Total: {totalAdults} adultos, {totalChildren} niños - Se distribuirán automáticamente
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">
                Precio: ${calculateTotalPrice().toLocaleString('es-CL')}
              </div>
              <div className="text-xs text-gray-500">por noche</div>
            </div>
          </div>
        </div>

        {/* Lista de habitaciones con scroll */}
        <div className="flex-1 overflow-y-auto pr-2">
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏨</div>
              <div className="text-xl font-semibold text-gray-600 mb-2">No hay habitaciones disponibles</div>
              <div className="text-gray-500">Verifica la configuración del sistema</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {rooms.map(room => {
                const isSelected = isRoomSelected(room);
                
                return (
                  <div
                    key={room.number}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                    onClick={() => toggleRoom(room)}
                  >
                    {/* Checkbox de selección */}
                    <div className="absolute top-3 left-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>

                    {/* Estado de disponibilidad */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                      room.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {room.status === 'available' ? 'Disponible' : 'Limitada'}
                    </div>

                    {/* Información de la habitación */}
                    <div className="mt-6 mb-3">
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        Habitación {room.number}
                      </div>
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full inline-block text-xs mb-2">
                        {room.type}
                      </div>
                      {room.capacity && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Users size={14} />
                          <span>{room.capacity} huéspedes máximo</span>
                        </div>
                      )}
                    </div>

                    {/* Características */}
                    <div className="space-y-1 mb-3">
                      {room.features.slice(0, 2).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="text-green-500">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Precio */}
                    <div className="text-lg font-bold text-green-600">
                      ${room.price.toLocaleString('es-CL')} / noche
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de habitaciones seleccionadas */}
        {internalSelection.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border bg-gray-50 border-gray-200">
            <h4 className="font-semibold mb-2 text-gray-900">
              Habitaciones Seleccionadas:
            </h4>
            
            <div className="space-y-2">
              {internalSelection.map(room => (
                <div 
                  key={room.number}
                  className="px-3 py-2 rounded-lg text-sm bg-green-100 border border-green-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-800">
                        Habitación {room.number}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {room.type}
                      </span>
                    </div>
                    <span className="font-semibold text-green-800">
                      ${room.price.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen total */}
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-gray-900">
                  Total: {internalSelection.length} habitaciones • {totalAdults} adultos • {totalChildren} niños
                </span>
                <span className="text-gray-900">
                  ${calculateTotalPrice().toLocaleString('es-CL')}/noche
                </span>
              </div>
              
              <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                ✨ Los pasajeros se distribuirán automáticamente: ~{Math.ceil(totalAdults / internalSelection.length)} adultos por habitación
              </div>
            </div>
          </div>
        )}

        {/* Footer con botones */}
        <div className="border-t bg-white p-4 mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {internalSelection.length > 1 ? (
                <span>✓ Se crearán {internalSelection.length} reservas modulares</span>
              ) : internalSelection.length === 1 ? (
                <span>✓ Se creará 1 reserva modular</span>
              ) : (
                <span>Selecciona las habitaciones que necesitas</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="px-4 py-2"
              >
                ❌ Cancelar
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={internalSelection.length === 0}
                className={`px-6 py-2 font-bold transition-all ${
                  internalSelection.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                ✅ CONFIRMAR {internalSelection.length} HABITACION{internalSelection.length !== 1 ? 'ES' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiRoomSelectorModal; 