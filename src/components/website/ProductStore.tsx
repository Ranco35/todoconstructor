'use client'

import { useState, useEffect } from 'react'
import { Package, ShoppingCart, Grid, List } from 'lucide-react'
import ProductCard from './ProductCard'
import ProductFilters from './ProductFilters'
import { ProductWithStock, ProductCategory, getProductsWithStock, getProductCategories } from '@/actions/website/products'

interface CartItem {
  product: ProductWithStock
  quantity: number
}

interface ActiveFilters {
  searchQuery: string
  categoryId: number | null
  minPrice: number | null
  maxPrice: number | null
  inStockOnly: boolean
}

export default function ProductStore() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>([])
  
  // Estado para mantener todos los filtros activos
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    searchQuery: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    inStockOnly: true
  })

  // Cargar productos y categorías al montar el componente
  useEffect(() => {
    loadData()
  }, [])

  // Aplicar filtros cuando cambien los filtros activos o productos
  useEffect(() => {
    applyAllFilters()
  }, [activeFilters, products])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProductsWithStock(),
        getProductCategories()
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función central que aplica todos los filtros de forma acumulativa
  const applyAllFilters = () => {
    let filtered = [...products]

    // 1. Filtro por categoría
    if (activeFilters.categoryId) {
      filtered = filtered.filter(product => 
        product.category?.id === activeFilters.categoryId
      )
    }

    // 2. Filtro de búsqueda
    if (activeFilters.searchQuery.trim()) {
      const query = activeFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      )
    }

    // 3. Filtro de precio
    if (activeFilters.minPrice !== null) {
      filtered = filtered.filter(product => {
        const price = product.finalPrice || product.saleprice || 0
        return price >= activeFilters.minPrice!
      })
    }

    if (activeFilters.maxPrice !== null) {
      filtered = filtered.filter(product => {
        const price = product.finalPrice || product.saleprice || 0
        return price <= activeFilters.maxPrice!
      })
    }

    // 4. Filtro de stock
    if (activeFilters.inStockOnly) {
      filtered = filtered.filter(product => product.stock > 0)
    }

    setFilteredProducts(filtered)
  }

  // Manejar búsqueda
  const handleSearch = (query: string) => {
    setActiveFilters(prev => ({
      ...prev,
      searchQuery: query
    }))
  }

  // Manejar filtro por categoría
  const handleCategoryFilter = (categoryId: number | null) => {
    setActiveFilters(prev => ({
      ...prev,
      categoryId
    }))
  }

  // Manejar filtro por precio
  const handlePriceFilter = (minPrice: number | null, maxPrice: number | null) => {
    setActiveFilters(prev => ({
      ...prev,
      minPrice,
      maxPrice
    }))
  }

  // Manejar filtro por stock
  const handleStockFilter = (inStockOnly: boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      inStockOnly
    }))
  }

  // Función para contactar sobre un producto
  const handleContactProduct = (product: ProductWithStock) => {
    const message = `Hola, me interesa el producto: ${product.name}`
    const whatsappUrl = `https://wa.me/56969095111?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando productos...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header de la tienda */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🛠️ Ferretería TC Constructor
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Encuentra todos los productos de ferretería que necesitas. 
          Herramientas, materiales de construcción, productos eléctricos y más.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
          <div className="text-gray-600">Productos disponibles</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 text-center">
          <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">WhatsApp</div>
          <div className="text-gray-600">Consulta directa</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">24/7</div>
          <div className="text-gray-600">Atención al cliente</div>
        </div>
      </div>

      {/* Filtros */}
      <ProductFilters
        categories={categories}
        onSearch={handleSearch}
        onCategoryFilter={handleCategoryFilter}
        onPriceFilter={handlePriceFilter}
        onStockFilter={handleStockFilter}
      />

      {/* Controles de vista y resultados */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleContactProduct}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500">
            Intenta ajustar los filtros o buscar con otros términos
          </p>
        </div>
      )}

      {/* Botón flotante de WhatsApp */}
      <div className="fixed bottom-4 right-4">
        <a
          href="https://wa.me/56969095111?text=Hola,%20me%20interesa%20consultar%20sobre%20productos%20de%20ferretería"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="hidden sm:block font-medium">WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
