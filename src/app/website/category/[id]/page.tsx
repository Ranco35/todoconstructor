import { getProductCategories, getProductsByCategory } from '@/actions/website/products'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/website/ProductCard'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

interface CategoryPageProps {
  params: {
    id: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryId = parseInt(params.id)
  
  if (isNaN(categoryId)) {
    notFound()
  }

  // Obtener categorías y productos
  const [categories, products] = await Promise.all([
    getProductCategories(),
    getProductsByCategory(categoryId)
  ])

  // Buscar la categoría actual
  const currentCategory = categories.find(cat => cat.id === categoryId)
  
  if (!currentCategory) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href="/website" className="hover:text-blue-600">Inicio</Link>
        <span>/</span>
        <Link href="/website/categories" className="hover:text-blue-600">Categorías</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{currentCategory.name}</span>
      </nav>

      {/* Header de la categoría */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/website/categories"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a categorías</span>
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {currentCategory.name}
        </h1>
        
        {currentCategory.description && (
          <p className="text-xl text-gray-600 max-w-3xl">
            {currentCategory.description}
          </p>
        )}

        <div className="flex items-center space-x-2 mt-4 text-gray-500">
          <Package className="w-5 h-5" />
          <span>
            {products.length} {products.length === 1 ? 'producto disponible' : 'productos disponibles'}
          </span>
        </div>
      </div>

      {/* Grid de productos */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No hay productos disponibles
          </h3>
          <p className="text-gray-500 mb-6">
            Esta categoría no tiene productos con stock disponible en este momento.
          </p>
          <Link
            href="/website/categories"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Ver otras categorías</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Otras categorías */}
      {products.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Otras categorías
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories
              .filter(cat => cat.id !== categoryId)
              .slice(0, 4)
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/website/category/${category.id}`}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ver productos
                  </p>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Generar metadatos dinámicos
export async function generateMetadata({ params }: CategoryPageProps) {
  const categoryId = parseInt(params.id)
  const categories = await getProductCategories()
  const category = categories.find(cat => cat.id === categoryId)

  if (!category) {
    return {
      title: 'Categoría no encontrada',
    }
  }

  return {
    title: `${category.name} - TC Constructor`,
    description: category.description || `Productos de ${category.name} en TC Constructor`,
  }
}
