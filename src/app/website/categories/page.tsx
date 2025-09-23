import { getProductCategories } from '@/actions/website/products'
import { createClient } from '@/lib/supabase-server'

export default async function CategoriesPage() {
  console.log('🚀 CategoriesPage (Server) está renderizando...')
  
  try {
    // Cargar datos en el servidor (SEO + velocidad inicial)
    const supabase = await createClient()
    
        // Obtener categorías
        const { data: categories } = await supabase
          .from('Category')
          .select('id, name, description, image')
          .order('name')

    // Obtener todos los productos (sin filtro de stock)
    const { data: productsData } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        brand,
        image,
        saleprice,
        finalPrice,
        vat,
        categoryid
      `)
      .order('name')

    // Obtener stock de productos
    const { data: stockData } = await supabase
      .from('Warehouse_Product')
      .select(`
        productId,
        quantity,
        warehouseId
      `)

    // Transformar productos con información de stock y categoría
    const products = productsData?.map(product => {
      const stock = stockData?.find(s => s.productId === product.id)
      const category = categories?.find(c => c.id === product.categoryid)
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        brand: product.brand,
        image: product.image,
        saleprice: product.saleprice,
        finalPrice: product.finalPrice,
        vat: product.vat,
        category: category ? {
          id: category.id,
          name: category.name
        } : null,
        stock: stock?.quantity || 0,
        warehouse: {
          id: stock?.warehouseId || 0,
          name: 'Almacén Principal'
        }
      }
    }) || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header específico para categorías */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8 rounded-lg mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              🛠️ Todos los Productos
        </h1>
            <p className="text-xl opacity-90">
              Explora todos nuestros productos de ferretería y construcción
            </p>
            <div className="mt-4 text-sm opacity-75">
              {products.length} productos disponibles • {categories.length} categorías
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-gray-600">Productos disponibles</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-green-600">WhatsApp</div>
            <div className="text-gray-600">Consulta directa</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🕒</div>
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-gray-600">Atención al cliente</div>
          </div>
        </div>

        {/* Lista de categorías clickeables */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Categorías Disponibles</h2>
          <p className="text-gray-600 mb-6">
            Haz clic en una categoría para ver todos los productos de esa categoría
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/website/categories/${category.id}`}
                className="bg-gray-50 rounded-lg p-4 text-center hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all duration-200 group"
              >
                <div className="h-16 w-16 mx-auto mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-400">📦</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                  {products.filter(p => p.category?.id === category.id).length} productos
                </p>
                <div className="mt-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver productos →
                </div>
              </a>
            ))}
          </div>
        </div>


        {/* Botón flotante de WhatsApp */}
        <div className="fixed bottom-4 right-4">
          <a
            href="https://wa.me/56912345678?text=Hola,%20me%20interesa%20consultar%20sobre%20productos%20de%20ferretería"
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
    console.error('Error loading categories page:', error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            ❌ Error al cargar productos
          </h1>
          <p className="text-red-600 mb-6">
            Hubo un problema al cargar los productos. Por favor, intenta de nuevo.
          </p>
          <a 
            href="/website" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Volver al inicio
          </a>
        </div>
    </div>
  )
  }
}

