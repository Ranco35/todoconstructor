import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFormPersistenceOptions {
  key: string;
  initialData?: any;
  autoSaveInterval?: number; // in milliseconds
  onAutoSave?: (data: any) => void;
}

export function useFormPersistence<T>({
  key,
  initialData = {},
  autoSaveInterval = 30000, // 30 segundos por defecto
  onAutoSave
}: UseFormPersistenceOptions) {
  const [formData, setFormData] = useState<T>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Clave para localStorage
  const storageKey = `form_autosave_${key}`;

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.timestamp && parsedData.data) {
          const savedTime = new Date(parsedData.timestamp);
          const now = new Date();
          const timeDiff = now.getTime() - savedTime.getTime();
          
          // Solo cargar si es de las últimas 24 horas
          if (timeDiff < 24 * 60 * 60 * 1000) {
            setFormData(prevData => ({ ...prevData, ...parsedData.data }));
            setLastSaved(savedTime);
            setHasUnsavedChanges(true);
            
            toast.info(`📝 Datos recuperados de ${savedTime.toLocaleTimeString()}`, {
              description: 'Se encontraron datos guardados automáticamente',
              action: {
                label: 'Descartar',
                onClick: () => clearPersistedData()
              }
            });
          } else {
            // Limpiar datos muy antiguos
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.warn('Error cargando datos guardados:', error);
      localStorage.removeItem(storageKey);
    }
  }, [key]);

  // Guardar en localStorage
  const saveToStorage = useCallback((data: T) => {
    if (!autoSaveEnabled) return;
    
    try {
      const dataToSave = {
        data,
        timestamp: new Date().toISOString(),
        key
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      if (onAutoSave) {
        onAutoSave(data);
      }
    } catch (error) {
      console.warn('Error guardando en localStorage:', error);
    }
  }, [storageKey, key, autoSaveEnabled, onAutoSave]);

  // Auto-guardado automático
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveToStorage(formData);
      console.log('🔄 Auto-guardado ejecutado');
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, autoSaveInterval, autoSaveEnabled, saveToStorage]);

  // Actualizar datos del formulario
  const updateFormData = useCallback((updater: Partial<T> | ((prev: T) => T)) => {
    setFormData(prevData => {
      const newData = typeof updater === 'function' ? updater(prevData) : { ...prevData, ...updater };
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  // Limpiar datos persistidos
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, [storageKey]);

  // Guardar manualmente
  const saveNow = useCallback(() => {
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  // Verificar si hay cambios antes de salir
  const confirmExit = useCallback((message = '¿Estás seguro de salir? Los cambios no guardados se perderán.') => {
    if (hasUnsavedChanges) {
      return window.confirm(message);
    }
    return true;
  }, [hasUnsavedChanges]);

  // Event listener para beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    formData,
    updateFormData,
    hasUnsavedChanges,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    saveNow,
    clearPersistedData,
    confirmExit
  };
} 