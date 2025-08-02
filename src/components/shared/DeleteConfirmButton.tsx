'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface DeleteConfirmButtonProps {
  deleteAction: (formData: FormData) => Promise<any>;
  id: string;
  confirmMessage?: string;
  className?: string;
  iconOnly?: boolean;
  buttonText?: string;
  onSuccess?: () => void; // Nuevo callback para éxito
}

export function DeleteConfirmButton({
  deleteAction,
  id,
  confirmMessage,
  className,
  iconOnly,
  buttonText = "Eliminar",
  onSuccess
}: DeleteConfirmButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dependencies, setDependencies] = useState<any>(null);
  const router = useRouter();

  const defaultClassName = "text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50";

  const handleInitialClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🗑️ DeleteConfirmButton: Iniciando eliminación para ID:', id);
    setIsDeleting(true);
    
    try {
      const formData = new FormData();
      formData.append('id', String(id));
      
      console.log('📤 DeleteConfirmButton: Llamando deleteAction con FormData:', { id: String(id) });
      const result = await deleteAction(formData);
      console.log('📥 DeleteConfirmButton: Resultado de deleteAction:', result);
      
      if (result && !result.success && result.canForceDelete) {
        console.log('⚠️ DeleteConfirmButton: Producto tiene dependencias, mostrando modal');
        // Mostrar modal de confirmación con dependencias
        setDependencies(result.dependencies);
        setShowModal(true);
      } else if (result && !result.success) {
        console.log('❌ DeleteConfirmButton: Error en eliminación:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Error al eliminar el elemento';
        alert(errorMessage);
      } else if (result && result.success) {
        console.log('✅ DeleteConfirmButton: Eliminación exitosa:', result.message);
        // Mostrar mensaje de éxito
        const successMessage = typeof result.message === 'string' ? result.message : 'Elemento eliminado correctamente';
        alert(`✅ ${successMessage}`);
        
        // Llamar callback de éxito si existe
        if (onSuccess) {
          onSuccess();
        } else {
          // Usar router.refresh() en lugar de window.location.reload()
          router.refresh();
        }
      } else {
        console.log('⚠️ DeleteConfirmButton: Resultado inesperado:', result);
      }
    } catch (error) {
      console.error('💥 DeleteConfirmButton: Error al eliminar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el elemento';
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleForceDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('💥 DeleteConfirmButton: Iniciando eliminación FORZADA para ID:', id);
    setIsDeleting(true);
    
    try {
      const formData = new FormData();
      formData.append('id', String(id));
      formData.append('force', 'true');
      
      console.log('📤 DeleteConfirmButton: Llamando deleteAction FORZADA con FormData:', { id: String(id), force: 'true' });
      const result = await deleteAction(formData);
      console.log('📥 DeleteConfirmButton: Resultado de eliminación FORZADA:', result);
      
      if (result && !result.success) {
        console.log('❌ DeleteConfirmButton: Error en eliminación forzada:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Error al eliminar el elemento';
        alert(errorMessage);
      } else if (result && result.success) {
        console.log('✅ DeleteConfirmButton: Eliminación forzada exitosa:', result.message);
        // Mostrar mensaje de éxito y cerrar modal
        const successMessage = typeof result.message === 'string' ? result.message : 'Elemento y dependencias eliminados correctamente';
        alert(`✅ ${successMessage}`);
        setShowModal(false);
        
        // Llamar callback de éxito si existe
        if (onSuccess) {
          onSuccess();
        } else {
          // Usar router.refresh() en lugar de window.location.reload()
          router.refresh();
        }
      } else {
        console.log('⚠️ DeleteConfirmButton: Resultado inesperado en eliminación forzada:', result);
      }
    } catch (error) {
      console.error('💥 DeleteConfirmButton: Error al eliminar con fuerza:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el elemento';
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={isDeleting}
        className={className || defaultClassName}
        onClick={handleInitialClick}
      >
        {iconOnly ? (
          <Trash2 className="w-4 h-4" />
        ) : (
          <>🗑️ {buttonText}</>
        )}
      </button>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Eliminación
                </h3>
              </div>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Este producto tiene dependencias que deben ser eliminadas:
              </p>
              
              {dependencies && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <ul className="space-y-1 text-sm">
                    {dependencies.warehouses > 0 && (
                      <li>• {dependencies.warehouses} asignación(es) a bodega(s)</li>
                    )}
                    {dependencies.sales > 0 && (
                      <li>• {dependencies.sales} venta(s) registrada(s)</li>
                    )}
                    {dependencies.reservations > 0 && (
                      <li>• {dependencies.reservations} reservación(es)</li>
                    )}
                    {dependencies.components > 0 && (
                      <li>• {dependencies.components} componente(s) de producto</li>
                    )}
                    {dependencies.pettyCashPurchases > 0 && (
                      <li>• {dependencies.pettyCashPurchases} compra(s) de caja menor</li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-600">
                ¿Estás seguro de que quieres eliminar el producto y todas sus dependencias? 
                <strong className="text-red-600"> Esta acción no se puede deshacer.</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleForceDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar Todo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 