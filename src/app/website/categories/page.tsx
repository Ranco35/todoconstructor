import { getProductsWithStock, getProductCategories } from '@/actions/website/products'
import ProductStore from '@/components/website/ProductStore'

export default async function CategoriesPage() {
  try {
    const [products, categories] = await Promise.all([
      getProductsWithStock(),
      getProductCategories()
    ])

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Todos los Productos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora todos nuestros productos de ferretería y construcción. 
            Filtra por categoría, precio o busca el producto específico que necesitas.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Productos cargados: {products.length} | Categorías: {categories.length}
          </div>
        </div>

        {/* Componente de tienda con todos los productos */}
        <ProductStore />
      </div>
    )
  } catch (error) {
    console.error('Error loading categories page:', error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Error al cargar productos
          </h1>
          <p className="text-xl text-red-600">
            Hubo un problema al cargar los productos. Por favor, intenta de nuevo más tarde.
          </p>
          <div className="mt-4">
            <a href="/website" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }
}

