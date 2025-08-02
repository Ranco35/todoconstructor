'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomById, updateRoom, Room } from '@/actions/configuration/room-actions';
import RoomForm from '@/components/rooms/RoomForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditRoomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditRoomPage({ params }: EditRoomPageProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    loadRoom();
  }, []);

  const loadRoom = async () => {
    try {
      const result = await getRoomById(parseInt(resolvedParams.id));
      if (result.success) {
        setRoom(result.data);
      } else {
        alert('Habitación no encontrada');
        router.push('/dashboard/configuration/rooms');
      }
    } catch (error) {
      console.error('Error loading room:', error);
      alert('Error al cargar habitación');
      router.push('/dashboard/configuration/rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!room) return;

    setIsLoading(true);
    try {
      const result = await updateRoom(room.id, formData);
      if (result.success) {
        router.push('/dashboard/configuration/rooms');
      } else {
        alert(result.error || 'Error al actualizar habitación');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Error al actualizar habitación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/configuration/rooms');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando habitación...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Habitación no encontrada</h2>
        <p className="text-gray-600 mt-2">La habitación que buscas no existe.</p>
        <Link
          href="/dashboard/configuration/rooms"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Habitaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/configuration/rooms"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Habitaciones
        </Link>
      </div>

      {/* Formulario */}
      <RoomForm
        room={room}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
} 