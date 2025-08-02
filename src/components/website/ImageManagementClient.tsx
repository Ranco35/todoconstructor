'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Image as ImageIcon,
  Calendar,
  HardDrive,
  Plus,
  RefreshCw
} from 'lucide-react'
import { 
  getWebsiteImages, 
  getWebsiteImageStats, 
  deleteWebsiteImageComplete,
  toggleImageStatus,
  getWebsiteImagesFromStorage
} from '@/actions/website/images'
import { formatFileSize } from '@/utils/fileUtils'
import type { WebsiteImage, ImageStats } from '@/actions/website/images'
import WebsiteImageUploader from './WebsiteImageUploader'

interface ImageManagementClientProps {
  initialImages: WebsiteImage[]
  initialStats: ImageStats
}

export default function ImageManagementClient({ 
  initialImages, 
  initialStats 
}: ImageManagementClientProps) {
  const [images, setImages] = useState<WebsiteImage[]>(initialImages)
  const [stats, setStats] = useState<ImageStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingImage, setEditingImage] = useState<WebsiteImage | null>(null)

  // Filtrar imágenes
  const filteredImages = images.filter(image => {
    const matchesSearch = image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (image.alt_text && image.alt_text.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || image.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && image.is_active) ||
                         (statusFilter === 'inactive' && !image.is_active)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Cargar imágenes desde storage
  const loadImages = async () => {
    setLoading(true)
    try {
      const [imagesResult, statsResult] = await Promise.all([
        getWebsiteImagesFromStorage(),
        getWebsiteImageStats()
      ])

      if (imagesResult.success) {
        setImages(imagesResult.images || [])
      }
      
      if (statsResult.success) {
        setStats(statsResult.stats || initialStats)
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manejar eliminación de imagen
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return
    }

    try {
      const result = await deleteWebsiteImageComplete(imageId)
      if (result.success) {
        await loadImages() // Recargar imágenes
      } else {
        alert('Error al eliminar la imagen: ' + result.error)
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error)
      alert('Error al eliminar la imagen')
    }
  }

  // Manejar cambio de estado de imagen
  const handleToggleStatus = async (imageId: string, newStatus: boolean) => {
    try {
      const result = await toggleImageStatus(imageId, newStatus)
      if (result.success) {
        await loadImages() // Recargar imágenes
      } else {
        alert('Error al cambiar el estado: ' + result.error)
      }
    } catch (error) {
      console.error('Error cambiando estado:', error)
      alert('Error al cambiar el estado')
    }
  }

  // Componente de imagen individual
  const ImageCard = ({ image }: { image: WebsiteImage }) => (
    <Card className="relative group overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <img
            src={image.url}
            alt={image.alt_text || image.filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/images/placeholder.jpg'
            }}
          />
          
          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingImage(image)}
              >
                <Edit size={16} />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteImage(image.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Badge de estado */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={image.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {image.is_active ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>

          {/* Badge de categoría */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="text-xs bg-white/80">
              {getCategoryLabel(image.category)}
            </Badge>
          </div>
        </div>

        {/* Información */}
        <div className="p-4">
          <h3 className="font-semibold text-sm truncate mb-2">{image.original_name}</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Tamaño:</strong> {formatFileSize(image.size)}</p>
            {image.width && image.height && (
              <p><strong>Dimensiones:</strong> {image.width} × {image.height}</p>
            )}
            <p><strong>Subida:</strong> {new Date(image.uploaded_at).toLocaleDateString()}</p>
          </div>
          
          {/* Switch de estado */}
          <div className="flex items-center justify-between mt-3">
            <Label htmlFor={`active-${image.id}`} className="text-sm">
              {image.is_active ? 'Activa' : 'Inactiva'}
            </Label>
            <Switch
              id={`active-${image.id}`}
              checked={image.is_active}
              onCheckedChange={(checked) => handleToggleStatus(image.id, checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Función helper para obtener etiqueta de categoría
  const getCategoryLabel = (category: string) => {
    const labels = {
      hero: 'Hero',
      rooms: 'Habitaciones',
      services: 'Servicios',
      gallery: 'Galería',
      testimonials: 'Testimonios',
      other: 'Otros'
    }
    return labels[category as keyof typeof labels] || category
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Imágenes</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imágenes Activas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeImages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacio Total</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {images.length > 0 
                ? new Date(Math.max(...images.map(img => new Date(img.updated_at).getTime()))).toLocaleDateString()
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar imágenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="hero">Hero/Principal</SelectItem>
              <SelectItem value="rooms">Habitaciones</SelectItem>
              <SelectItem value="services">Servicios</SelectItem>
              <SelectItem value="gallery">Galería</SelectItem>
              <SelectItem value="testimonials">Testimonios</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadImages}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Subir Imagen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Subir Nueva Imagen</DialogTitle>
              </DialogHeader>
              <WebsiteImageUploader
                onUploadComplete={() => {
                  setShowUploadDialog(false)
                  loadImages()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de imágenes */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <ImageCard key={image.id} image={image} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredImages.map((image) => (
                <Card key={image.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={image.url}
                      alt={image.alt_text || image.filename}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{image.original_name}</h3>
                      <p className="text-sm text-gray-600">{getCategoryLabel(image.category)}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={image.is_active ? "default" : "secondary"}>
                        {image.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingImage(image)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'No se encontraron imágenes con los filtros aplicados'
                  : 'No hay imágenes disponibles'
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Dialog de edición */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Imagen</DialogTitle>
          </DialogHeader>
          {editingImage ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Editando imagen: {editingImage.filename}
              </p>
              <WebsiteImageUploader
                currentImageUrl={editingImage.url}
                imageId={editingImage.id}
                category={editingImage.category}
                altText={editingImage.alt_text || ''}
                onUploadComplete={() => {
                  setEditingImage(null)
                  loadImages()
                }}
              />
            </div>
          ) : (
            <div className="p-4">
              <p>Cargando editor de imagen...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 