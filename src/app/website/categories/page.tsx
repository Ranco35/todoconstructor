import { getProductCategories, getProductsByCategory } from '@/actions/website/products'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'

export default async function CategoriesPage() {
  const categories = await getProductCategories()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Categorías de Productos
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explora nuestras categorías de productos de ferretería y construcción. 
          Encuentra exactamente lo que necesitas para tu proyecto.
        </p>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Contáctanos y te ayudaremos a encontrar el producto perfecto para tu proyecto.
          </p>
          <Link
            href="/website/contact"
            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            <span>Contactar</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface CategoryCardProps {
  category: {
    id: number
    name: string
    description: string | null
  }
}

async function CategoryCard({ category }: CategoryCardProps) {
  // Obtener algunos productos de ejemplo de esta categoría
  const products = await getProductsByCategory(category.id)
  const productCount = products.length

  // Función para obtener icono por categoría
  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: string } = {
      'Herramientas': '🔧',
      'Materiales': '🧱',
      'Eléctricos': '⚡',
      'Pinturas': '🎨',
      'Ferretería': '🛠️',
      'Construcción': '🏗️',
      'Plomería': '🚿',
      'Jardín': '🌱'
    }
    return icons[categoryName] || '📦'
  }

  // Función para obtener color por categoría
  const getCategoryColor = (categoryName: string) => {
    const colors: { [key: string]: string } = {
      'Herramientas': 'from-blue-500 to-blue-600',
      'Materiales': 'from-green-500 to-green-600',
      'Eléctricos': 'from-red-500 to-red-600',
      'Pinturas': 'from-orange-500 to-orange-600',
      'Ferretería': 'from-purple-500 to-purple-600',
      'Construcción': 'from-gray-500 to-gray-600',
      'Plomería': 'from-cyan-500 to-cyan-600',
      'Jardín': 'from-emerald-500 to-emerald-600'
    }
    return colors[categoryName] || 'from-gray-500 to-gray-600'
  }

  return (
    <Link href={`/website/category/${category.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 group cursor-pointer">
        {/* Header con gradiente */}
        <div className={`h-32 bg-gradient-to-r ${getCategoryColor(category.name)} flex items-center justify-center`}>
          <div className="text-center text-white">
            <div className="text-4xl mb-2">{getCategoryIcon(category.name)}</div>
            <h3 className="text-xl font-bold">{category.name}</h3>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Descripción */}
          {category.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {category.description}
            </p>
          )}

          {/* Contador de productos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-500">
              <Package className="w-4 h-4" />
              <span className="text-sm">
                {productCount} {productCount === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 text-blue-600 group-hover:text-blue-700">
              <span className="text-sm font-medium">Ver productos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
