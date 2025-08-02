'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  deleteAction: (formData: FormData) => Promise<any>;
  id: string | number;
  confirmMessage?: string;
  className?: string;
  iconOnly?: boolean;
}

export function DeleteButton({ 
  deleteAction, 
  id, 
  confirmMessage, 
  className,
  iconOnly = false 
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultClassName = iconOnly 
    ? "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    : "text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50";

  const handleSubmit = async (formData: FormData) => {
    setIsDeleting(true);
    
    try {
      const result = await deleteAction(formData);
      
      if (result && !result.success) {
        alert(result.error || 'Error al eliminar el elemento');
      } else if (result && result.success) {
        // Mostrar mensaje de éxito
        alert(`✅ ${result.message || 'Elemento eliminado correctamente'}`);
      }
    } catch (error) {
      alert('Error al eliminar el elemento');
      console.error('Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form action={handleSubmit} className="inline">
      <input type="hidden" name="id" value={String(id)} />
      <button
        type="submit"
        disabled={isDeleting}
        className={className || defaultClassName}
        onClick={(e) => {
          if (!window.confirm(confirmMessage || '¿Estás seguro de que quieres eliminar este elemento?')) {
            e.preventDefault();
          }
        }}
        title={iconOnly ? (isDeleting ? "Eliminando..." : "Eliminar") : undefined}
      >
        {iconOnly ? (
          <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
        ) : (
          <>{isDeleting ? '⏳ Eliminando...' : '🗑️ Eliminar'}</>
        )}
      </button>
    </form>
  );
} 