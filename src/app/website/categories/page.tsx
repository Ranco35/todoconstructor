import { getProductsWithStock, getProductCategories } from '@/actions/website/products'
import { ProductStore } from '@/components/website/ProductStore'

export default async function CategoriesPage() {
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
      </div>

      {/* Componente de tienda con todos los productos */}
      <ProductStore />
    </div>
  )
}

