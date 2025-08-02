'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Clipboard, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  acceptedTypes?: string[];
  maxSize?: number; // en bytes
  disabled?: boolean;
  loading?: boolean;
  currentFile?: File | null;
  placeholder?: string;
  description?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['.xlsx', '.xls', '.csv'],
  maxSize = 10 * 1024 * 1024, // 10MB por defecto
  disabled = false,
  loading = false,
  currentFile = null,
  placeholder = "Seleccionar archivo",
  description = "o arrastra y suelta aquí",
  className = ""
}) => {
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para validar archivo
  const validateFile = (file: File): string | null => {
    // Validar tipo de archivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Tipo de archivo no permitido. Solo se aceptan: ${acceptedTypes.join(', ')}`;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      return `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`;
    }

    return null;
  };

  // Función para procesar archivo (común para upload y paste)
  const processFile = (file: File) => {
    if (disabled || loading) return;

    setUploadError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    onFileSelect(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para manejar paste de archivos
  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          processFile(file);
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
      processFile(file);
    }
  };

  // Event listeners para paste global
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      // Solo procesar si el componente está activo y no hay input enfocado
      if (disabled || loading || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
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
  }, [disabled, loading]);

  const openFileDialog = () => {
    if (!disabled && !loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    if (onFileRemove) {
      onFileRemove();
    }
    setUploadError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        disabled={disabled || loading}
        className="hidden"
      />

      {/* Área de upload con drag & drop */}
      <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
          showPasteHint 
            ? 'border-blue-400 bg-blue-50' 
            : currentFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        } ${disabled || loading ? 'cursor-not-allowed opacity-50' : ''}`}
        onClick={!disabled && !loading ? openFileDialog : undefined}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Procesando archivo...</p>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center justify-center">
            <FileText className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>
            {!disabled && onFileRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
              >
                <X size={12} />
                Eliminar
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">{placeholder}</p>
            <p className="text-xs text-gray-500">{description}</p>
            {showPasteHint && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                <Clipboard size={12} />
                Suelta el archivo aquí
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>Formatos soportados: {acceptedTypes.join(', ')}</p>
        <p>Tamaño máximo: {formatFileSize(maxSize)}</p>
        <p className="flex items-center gap-1">
          <Clipboard size={12} />
          También puedes copiar y pegar (Ctrl+V) o arrastrar un archivo
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