'use client';

import { createCategory } from "@/actions/configuration/category-actions";
import Link from "next/link";
import CategoryParentSelector from '@/components/shared/CategoryParentSelector';
import NotificationToast from '@/components/shared/NotificationToast';
import { useState } from 'react';

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default function CreateCategoryPage() {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    
    // Delay mínimo para asegurar que el usuario vea el spinner
    const startTime = Date.now();
    const minDelay = 800; // 800ms mínimo
    
    try {
      await createCategory(formData);
      // Si llegamos aquí, la función redirect() ya nos habrá llevado a otra página
      // No necesitamos hacer nada más aquí
    } catch (error) {
      // Next.js usa NEXT_REDIRECT para manejar redirects, esto no es un error real
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        // El redirect está funcionando correctamente, pero aseguramos delay mínimo
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, minDelay - elapsed);
        
        if (remainingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }
        return;
      }
      
      // Para errores reales, también respetamos el delay mínimo
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, minDelay - elapsed);
      
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }
      
      setNotification({
        message: error instanceof Error ? error.message : 'Error desconocido al crear la categoría',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {notification && (
        <NotificationToast
          type={notification.type}
          title={notification.type === 'success' ? 'Éxito' : notification.type === 'error' ? 'Error' : 'Información'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Nueva Categoría</h1>
        <p className="text-gray-600">Complete los datos para crear una nueva categoría de productos</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="flex flex-col items-center">
              <svg 
                className="animate-spin h-8 w-8 text-blue-600 mb-2" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600 font-medium">Creando categoría...</p>
            </div>
          </div>
        )}
        <form action={handleSubmit} className="space-y-6">
          {/* Input hidden para parentId */}
          <input type="hidden" name="parentId" value={selectedParentId || ''} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre de la categoría */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la categoría *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Electrónicos, Ropa, Alimentación..."
              />
              <p className="mt-1 text-sm text-gray-500">Máximo 100 caracteres</p>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción detallada de la categoría..."
              />
              <p className="mt-1 text-sm text-gray-500">Máximo 500 caracteres</p>
            </div>

            {/* Selector de categoría padre */}
            <div className="md:col-span-2">
              <CategoryParentSelector
                value={selectedParentId}
                onChange={setSelectedParentId}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link href="/dashboard/configuration/category">
              <button
                type="button"
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg 
                    className="animate-spin h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creando categoría...
                </>
              ) : (
                'Crear Categoría'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Consejos para crear categorías</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use nombres descriptivos y fáciles de entender</li>
                <li>Evite crear categorías muy similares</li>
                <li>Una buena categorización facilita la gestión del inventario</li>
                <li>Puede editar la categoría después de crearla</li>
                <li>Puede crear jerarquías seleccionando una categoría padre</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 