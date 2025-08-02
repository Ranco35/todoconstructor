import { getWebsiteImages, getWebsiteImageStats, getWebsiteImagesFromStorage } from '@/actions/website/images'
import ImageManagementClient from '@/components/website/ImageManagementClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Image as ImageIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WebsiteImagesPage() {
  // Cargar imágenes y estadísticas desde storage
  const [imagesResult, statsResult] = await Promise.all([
    getWebsiteImagesFromStorage(),
    getWebsiteImageStats()
  ])

  if (!imagesResult.success) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las imágenes: {imagesResult.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las estadísticas: {statsResult.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const images = imagesResult.images || []
  const stats = statsResult.stats || {
    total: 0,
    byCategory: {},
    totalSize: 0,
    activeImages: 0
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ImageIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Imágenes del Website
              </h1>
              <p className="text-gray-600">
                Administra las imágenes que se muestran en el sitio web del hotel
              </p>
            </div>
          </div>

          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categorías Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hero/Principal</span>
                    <span className="font-medium">{stats.byCategory.hero || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Habitaciones</span>
                    <span className="font-medium">{stats.byCategory.rooms || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Servicios</span>
                    <span className="font-medium">{stats.byCategory.services || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Galería</span>
                    <span className="font-medium">{stats.byCategory.gallery || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Funcionalidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Subida de imágenes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Edición de metadatos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Categorización</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Gestión de estado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Formatos Soportados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>JPEG / JPG</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>PNG</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>GIF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>WebP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Componente principal */}
        <ImageManagementClient 
          initialImages={images}
          initialStats={stats}
        />
      </div>
    </div>
  )
} 