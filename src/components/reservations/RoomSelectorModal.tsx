import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Room {
  number: string;
  type: string;
  price: number;
  features: string[];
  status: 'available' | 'limited';
}

interface RoomSelectorModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  selectedRoom: Room | null;
  onSelect: (room: Room) => void;
}

const RoomSelectorModal: React.FC<RoomSelectorModalProps> = ({ open, onClose, rooms, selectedRoom, onSelect }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogTitle>Selecciona una Habitación</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto mt-4">
          {rooms.map(room => (
            <div
              key={room.number}
              className={`room-available border-2 rounded-xl p-6 cursor-pointer transition-all relative bg-white shadow-md ${selectedRoom?.number === room.number ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-400'}`}
              onClick={() => { onSelect(room); onClose(); }}
            >
              <div className={`room-status absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${room.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {room.status === 'available' ? 'Disponible' : 'Última disponible'}
              </div>
              <div className="room-number text-xl font-bold mb-2">Habitación {room.number}</div>
              <div className="room-type-badge bg-blue-500 text-white px-3 py-1 rounded-full inline-block mb-3">{room.type}</div>
              <div className="room-features mb-3">
                {room.features.map((feature, idx) => (
                  <div key={idx} className="room-feature flex items-center gap-2 text-gray-700 text-sm">
                    <span>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="room-price-detail text-lg font-bold text-green-600 mt-2">${room.price.toLocaleString('es-CL')} / noche</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomSelectorModal; 