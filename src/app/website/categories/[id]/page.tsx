import { createClient } from '@/lib/supabase-server'
import { getProductsForWebsiteByCategory } from '@/actions/website/products'
import ProductCardWithPromotions from '@/components/website/ProductCardWithPromotions'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params
  const categoryId = parseInt(id)
  
  if (isNaN(categoryId)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            ❌ Categoría no válida
          </h1>
          <p className="text-red-600 mb-6">
            La categoría que buscas no existe o no es válida.
          </p>
          <Link 
            href="/website/categories" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Volver a categorías
          </Link>
        </div>
      </div>
    )
  }

  try {
    const supabase = await createClient()
    
    // Obtener la categoría
    const { data: category } = await supabase
      .from('Category')
      .select('id, name, description, image')
      .eq('id', categoryId)
      .single()

    if (!category) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              ❌ Categoría no encontrada
            </h1>
            <p className="text-red-600 mb-6">
              La categoría que buscas no existe en nuestro catálogo.
            </p>
            <Link 
              href="/website/categories" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Volver a categorías
            </Link>
          </div>
        </div>
      )
    }

    // Obtener productos de la categoría con promociones
    const products = await getProductsForWebsiteByCategory(categoryId)

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/website" className="hover:text-blue-600">Inicio</Link>
          <span>/</span>
          <Link href="/website/categories" className="hover:text-blue-600">Categorías</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>

        {/* Header de la categoría */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8 rounded-lg mb-8">
          <div className="text-center">
            {category.image && (
              <div className="mb-4">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="h-20 w-20 mx-auto rounded-lg object-cover border-2 border-white/20"
                />
              </div>
            )}
            <h1 className="text-4xl font-bold mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl opacity-90 mb-4">
                {category.description}
              </p>
            )}
            <div className="text-sm opacity-75">
              {products.length} productos disponibles
            </div>
          </div>
        </div>

        {/* Estadísticas de la categoría */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-gray-600">Total productos</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.stock > 0).length}
            </div>
            <div className="text-gray-600">Con stock disponible</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.stock === 0).length}
            </div>
            <div className="text-gray-600">Sin stock</div>
          </div>
        </div>

        {/* Lista de productos */}
        {products.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Productos en {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCardWithPromotions
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay productos en esta categoría
            </h3>
            <p className="text-gray-500 mb-6">
              Esta categoría aún no tiene productos asignados.
            </p>
            <Link 
              href="/website/categories" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Ver otras categorías
            </Link>
          </div>
        )}

        {/* Botón flotante de WhatsApp */}
        <div className="fixed bottom-4 right-4">
          <a
            href={`https://wa.me/56969095111?text=Hola, me interesa consultar sobre productos de ${category.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span className="text-xl">💬</span>
            <span className="hidden sm:block font-medium">WhatsApp</span>
          </a>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading category page:', error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            ❌ Error al cargar la categoría
          </h1>
          <p className="text-red-600 mb-6">
            Hubo un problema al cargar los productos de esta categoría.
          </p>
          <Link 
            href="/website/categories" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Volver a categorías
          </Link>
        </div>
      </div>
    )
  }
}
