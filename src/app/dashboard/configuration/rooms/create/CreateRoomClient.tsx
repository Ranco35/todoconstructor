'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoomForm from '@/components/rooms/RoomForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Tipo para el resultado de la acción
type CreateRoomResult = {
  success: boolean;
  error?: string;
  data?: any;
};

// Tipo para la función de crear habitación
type CreateRoomAction = (formData: FormData) => Promise<CreateRoomResult>;

interface CreateRoomClientProps {
  createRoomAction: CreateRoomAction;
}

export default function CreateRoomClient({ createRoomAction }: CreateRoomClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createRoomAction(formData);
      if (result.success) {
        router.push('/dashboard/configuration/rooms');
      } else {
        // Manejar diferentes tipos de errores
        let errorMessage = result.error || 'Error al crear habitación';
        
        if (errorMessage.includes('duplicate key value violates unique constraint')) {
          const roomNumber = formData.get('number');
          errorMessage = `❌ La habitación "${roomNumber}" ya existe.\n\n💡 Sugerencias de números disponibles:\n• 103, 104, 105 (Primer piso)\n• 203, 204, 205 (Segundo piso)\n• 303, 304, 305 (Tercer piso)\n• C01, C02, C03 (Cabañas)`;
        } else if (errorMessage.includes('invalid input')) {
          errorMessage = 'Los datos ingresados no son válidos. Verifica todos los campos.';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Error inesperado al crear habitación. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/configuration/rooms');
  };

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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xs font-bold">!</span>
            </div>
            <p className="text-red-700 font-medium">Error al crear habitación</p>
          </div>
          <div className="text-red-600 text-sm mt-1 whitespace-pre-line">{error}</div>
        </div>
      )}

      {/* Formulario */}
      <RoomForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
} 