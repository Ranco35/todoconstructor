'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Upload, X, Loader2, Image, Clipboard } from 'lucide-react';
import { uploadClientImage, deleteClientImage, updateClientImage, extractPathFromUrl } from '@/lib/supabase-storage';

interface ClientImageUploaderProps {
  currentImageUrl?: string;
  clientId?: number;
  onImageChange: (imageUrl: string | null, imagePath: string | null) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ClientImageUploader: React.FC<ClientImageUploaderProps> = ({
  currentImageUrl,
  clientId,
  onImageChange,
  disabled = false,
  size = 'md'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuración de tamaños
  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 20 },
    md: { container: 'w-20 h-20', icon: 24 },
    lg: { container: 'w-32 h-32', icon: 32 }
  };

  const config = sizeConfig[size];

  // Función para procesar archivo (común para upload y paste)
  const processFile = async (file: File) => {
    if (disabled) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Crear preview inmediato
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      let result;
      
      if (currentImageUrl && clientId) {
        // Actualizar imagen existente
        const currentPath = extractPathFromUrl(currentImageUrl);
        result = await updateClientImage(file, clientId, currentPath || undefined);
      } else {
        // Subir nueva imagen
        result = await uploadClientImage(file, clientId);
      }

      if (result.success && result.publicUrl && result.filePath) {
        setPreviewUrl(result.publicUrl);
        onImageChange(result.publicUrl, result.filePath);
        setUploadError(null);
      } else {
        setUploadError(result.error || 'Error subiendo imagen');
        setPreviewUrl(currentImageUrl || null);
      }

      // Limpiar preview local
      URL.revokeObjectURL(localPreview);

    } catch (error) {
      console.error('Error en subida:', error);
      setUploadError('Error inesperado al subir imagen');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para manejar paste de imágenes
  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          await processFile(file);
          return;
        }
      }
    }
  };

  // Función para manejar drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setShowPasteHint(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setShowPasteHint(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setShowPasteHint(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await processFile(file);
      } else {
        setUploadError('Solo se permiten archivos de imagen');
      }
    }
  };

  // Event listeners para paste global
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      // Solo procesar si el componente está activo y no hay input enfocado
      if (disabled || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [disabled, currentImageUrl, clientId]);

  const handleRemoveImage = async () => {
    if (!previewUrl || disabled) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Si es una URL de Supabase, extraer path y eliminar
      if (previewUrl.includes('supabase')) {
        const imagePath = extractPathFromUrl(previewUrl);
        if (imagePath) {
          const result = await deleteClientImage(imagePath);
          if (!result.success) {
            setUploadError(result.error || 'Error eliminando imagen');
            return;
          }
        }
      }

      setPreviewUrl(null);
      onImageChange(null, null);

    } catch (error) {
      console.error('Error eliminando imagen:', error);
      setUploadError('Error eliminando imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Foto del Cliente
      </label>
      
      <div className="flex items-center space-x-4">
        {/* Preview de imagen con drag & drop */}
        <div 
          ref={containerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${config.container} bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 relative group cursor-pointer transition-all duration-200 ${
            showPasteHint ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-300'}`}
          onClick={!disabled ? openFileDialog : undefined}
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <Loader2 size={config.icon} className="text-blue-500 animate-spin" />
            </div>
          ) : previewUrl ? (
            <>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar imagen"
                >
                  <X size={16} className="text-white" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <User size={config.icon} className="text-gray-400 mb-1" />
              {showPasteHint && (
                <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-full">
                  <div className="text-center">
                    <Clipboard size={16} className="text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-blue-600 font-medium">Soltar imagen</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={openFileDialog}
            disabled={disabled || isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload size={16} />
            {isUploading ? 'Subiendo...' : previewUrl ? 'Cambiar Foto' : 'Subir Foto'}
          </button>

          {previewUrl && !disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isUploading}
              className="block text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>Formatos soportados: JPG, PNG, GIF, WebP</p>
        <p>Tamaño máximo: 5MB</p>
        <p className="flex items-center gap-1">
          <Clipboard size={12} />
          También puedes copiar y pegar (Ctrl+V) o arrastrar una imagen
        </p>
      </div>

      {/* Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{uploadError}</p>
        </div>
      )}
    </div>
  );
}; 