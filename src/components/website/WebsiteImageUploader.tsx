'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Camera, X, Check, AlertCircle } from 'lucide-react'
import { uploadNewWebsiteImage, updateExistingWebsiteImage } from '@/actions/website/images'
import { formatFileSize } from '@/utils/fileUtils'

interface WebsiteImageUploaderProps {
  currentImageUrl?: string
  imageId?: string
  onImageChange?: (url: string | null, imageId: string | null) => void
  onUploadComplete?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  category?: string
  altText?: string
}

export default function WebsiteImageUploader({
  currentImageUrl,
  imageId,
  onImageChange,
  onUploadComplete,
  disabled = false,
  size = 'md',
  category: initialCategory = 'other',
  altText: initialAltText = ''
}: WebsiteImageUploaderProps) {
  console.log('🔄 WebsiteImageUploader renderizando:', {
    currentImageUrl,
    imageId,
    category: initialCategory,
    altText: initialAltText
  })

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [category, setCategory] = useState(initialCategory)
  const [altText, setAltText] = useState(initialAltText)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width?: number; height?: number }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-48 w-48'
  }

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (file.size > maxSize) {
      return `El archivo es demasiado grande (${formatFileSize(file.size)}). Máximo permitido: 5MB`
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido. Use: JPG, PNG, GIF o WebP'
    }

    return null
  }

  /**
   * Obtener dimensiones de una imagen
   */
  const getImageDimensions = (file: File): Promise<{ width?: number; height?: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({})
      }
      
      img.src = url
    })
  }

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setErrorMessage(validationError)
      setUploadStatus('error')
      return
    }

    setSelectedFile(file)
    setErrorMessage('')
    setUploadStatus('idle')

    // Obtener dimensiones de la imagen
    const dimensions = await getImageDimensions(file)
    setImageDimensions(dimensions)

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', category)
      formData.append('altText', altText)
      
      // Agregar dimensiones si están disponibles
      if (imageDimensions.width) {
        formData.append('width', imageDimensions.width.toString())
      }
      if (imageDimensions.height) {
        formData.append('height', imageDimensions.height.toString())
      }

      let result
      if (imageId) {
        // Actualizar imagen existente
        result = await updateExistingWebsiteImage(imageId, formData)
      } else {
        // Subir nueva imagen
        result = await uploadNewWebsiteImage(formData)
      }

      if (result.success) {
        setUploadStatus('success')
        const newImageId = result.imageId || imageId
        onImageChange?.(previewUrl, newImageId)
        onUploadComplete?.()
        console.log('✅ Imagen subida exitosamente')
      } else {
        throw new Error(result.error || 'Error desconocido')
      }

    } catch (error) {
      console.error('❌ Error subiendo imagen:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setImageDimensions({})
    setUploadStatus('idle')
    setErrorMessage('')
    onImageChange?.(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Debug info */}
          <div className="text-xs text-gray-500 mb-2">
            <p>🔧 Debug: Componente WebsiteImageUploader cargado</p>
            <p>ID: {imageId || 'nuevo'}</p>
            <p>Categoría: {category}</p>
          </div>

          {/* Preview de la imagen */}
          <div className="flex items-center justify-center">
            <div className={`${sizeClasses[size]} relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center`}>
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {!disabled && (
                    <button
                      onClick={handleRemove}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <div 
                  className={`w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-gray-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={openFileDialog}
                >
                  <Camera size={24} className="mb-2" />
                  <span className="text-sm text-center">Seleccionar imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-3">
            {/* Categoría */}
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero/Principal</SelectItem>
                  <SelectItem value="rooms">Habitaciones</SelectItem>
                  <SelectItem value="services">Servicios</SelectItem>
                  <SelectItem value="gallery">Galería</SelectItem>
                  <SelectItem value="testimonials">Testimonios</SelectItem>
                  <SelectItem value="other">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Texto alternativo */}
            <div>
              <Label htmlFor="altText">Texto alternativo</Label>
              <Textarea
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe la imagen para accesibilidad..."
                rows={2}
                disabled={disabled}
              />
            </div>

            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                onClick={openFileDialog}
                disabled={disabled || isUploading}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Upload size={16} className="mr-2" />
                Seleccionar archivo
              </Button>

              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={disabled || isUploading}
                  size="sm"
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      {imageId ? 'Actualizar' : 'Subir'}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Estado de la subida */}
            {uploadStatus === 'success' && (
              <div className="text-green-600 text-sm flex items-center">
                <Check size={16} className="mr-2" />
                Imagen subida exitosamente
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="text-red-600 text-sm flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {errorMessage}
              </div>
            )}

            {/* Información del archivo */}
            {selectedFile && (
              <div className="text-sm text-gray-600">
                <p><strong>Archivo:</strong> {selectedFile.name}</p>
                <p><strong>Tamaño:</strong> {formatFileSize(selectedFile.size)}</p>
                <p><strong>Tipo:</strong> {selectedFile.type}</p>
                {imageDimensions.width && imageDimensions.height && (
                  <p><strong>Dimensiones:</strong> {imageDimensions.width} × {imageDimensions.height} px</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 