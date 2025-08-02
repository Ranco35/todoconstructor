import Link from 'next/link'
import { 
  FileText, 
  Image, 
  Settings, 
  BarChart3, 
  Users, 
  MessageSquare,
  Globe,
  Calendar
} from 'lucide-react'

const adminSections = [
  {
    title: 'Gestión de Contenido',
    description: 'Edita textos, títulos y descripciones del website',
    icon: FileText,
    href: '/admin/website/content',
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Gestión de Imágenes',
    description: 'Sube, organiza y optimiza las imágenes del website',
    icon: Image,
    href: '/admin/website/images',
    color: 'from-green-500 to-green-600'
  },
  {
    title: 'Configuración',
    description: 'SEO, redes sociales e información de contacto',
    icon: Settings,
    href: '/admin/website/settings',
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Analytics',
    description: 'Estadísticas de visitas y comportamiento de usuarios',
    icon: BarChart3,
    href: '/admin/website/analytics',
    color: 'from-orange-500 to-orange-600'
  },
  {
    title: 'Testimonios',
    description: 'Gestiona las reseñas y testimonios de clientes',
    icon: Users,
    href: '/admin/website/testimonials',
    color: 'from-pink-500 to-pink-600'
  },
  {
    title: 'Mensajes',
    description: 'Consulta los mensajes del formulario de contacto',
    icon: MessageSquare,
    href: '/admin/website/messages',
    color: 'from-teal-500 to-teal-600'
  },
  {
    title: 'SEO',
    description: 'Optimización para motores de búsqueda',
    icon: Globe,
    href: '/admin/website/seo',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    title: 'Eventos',
    description: 'Gestiona eventos especiales y promociones',
    icon: Calendar,
    href: '/admin/website/events',
    color: 'from-red-500 to-red-600'
  }
]

export default function WebsiteAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administración del Website
        </h1>
        <p className="text-gray-600">
          Gestiona todo el contenido y configuración de tu página web
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visitas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mensajes Nuevos</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Testimonios</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Image className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Imágenes</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones de administración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${section.color}`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {section.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/website/content/edit"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
          >
            <h3 className="font-semibold mb-2">Editar Contenido</h3>
            <p className="text-sm opacity-90">Actualiza textos y descripciones</p>
          </Link>
          
          <Link
            href="/admin/website/images/upload"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
          >
            <h3 className="font-semibold mb-2">Subir Imágenes</h3>
            <p className="text-sm opacity-90">Agrega nuevas fotos al website</p>
          </Link>
          
          <Link
            href="/admin/website/settings/seo"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
          >
            <h3 className="font-semibold mb-2">Optimizar SEO</h3>
            <p className="text-sm opacity-90">Mejora el posicionamiento</p>
          </Link>
        </div>
      </div>

      {/* Vista previa */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Website</h3>
          <Link
            href="/website"
            target="_blank"
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
          >
            Ver Website
          </Link>
        </div>
        <p className="text-gray-600 text-sm">
          Revisa cómo se ve tu página web en tiempo real y asegúrate de que todos los cambios 
          se vean correctamente antes de publicarlos.
        </p>
      </div>
    </div>
  )
} 