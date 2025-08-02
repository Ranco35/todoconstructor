'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import CategoryParentSelector from '@/components/shared/CategoryParentSelector';
import NotificationToast from '@/components/shared/NotificationToast';
import { updateCategory } from '@/actions/configuration/category-actions';

// Definir el tipo Category localmente
interface Category {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryWithCount extends Category {
  _count: {
    Product: number;
  };
}

interface EditCategoryFormProps {
  category: CategoryWithCount;
}

export default function EditCategoryForm({ category }: EditCategoryFormProps) {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(category.parentId);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    
    // Delay mínimo para asegurar que el usuario vea el spinner
    const startTime = Date.now();
    const minDelay = 800; // 800ms mínimo
    
    try {
      await updateCategory(category.id, formData);
      // Si la acción redirige, este código no se ejecutará.
      // Si no, podríamos mostrar un mensaje de éxito.
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
        message: error instanceof Error ? error.message : 'Error desconocido al actualizar la categoría',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {notification && (
        <NotificationToast
          type={notification.type}
          title={notification.type === 'success' ? 'Éxito' : notification.type === 'error' ? 'Error' : 'Información'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

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
              <p className="text-gray-600 font-medium">Actualizando categoría...</p>
            </div>
          </div>
        )}
        <form action={handleSubmit} className="space-y-6">
          {/* Input hidden para parentId */}
          <input type="hidden" name="parentId" value={selectedParentId || ''} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                defaultValue={category.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Electrónicos, Ropa, Alimentación..."
              />
              <p className="mt-1 text-sm text-gray-500">Máximo 100 caracteres</p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                defaultValue={category.description || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción detallada de la categoría..."
              />
              <p className="mt-1 text-sm text-gray-500">Máximo 500 caracteres</p>
            </div>

            <div className="md:col-span-2">
              <CategoryParentSelector
                value={selectedParentId}
                onChange={setSelectedParentId}
                excludeId={category.id}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link href="/dashboard/configuration/category">
              <button
                type="button"
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  Actualizando...
                </>
              ) : (
                'Actualizar Categoría'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 