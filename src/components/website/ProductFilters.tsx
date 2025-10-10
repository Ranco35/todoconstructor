'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { ProductCategory } from '@/actions/website/products'

interface ProductFiltersProps {
  categories: ProductCategory[]
  onSearch: (query: string) => void
  onCategoryFilter: (categoryId: number | null) => void
  onPriceFilter: (minPrice: number | null, maxPrice: number | null) => void
  onStockFilter: (inStockOnly: boolean) => void
}

export default function ProductFilters({
  categories,
  onSearch,
  onCategoryFilter,
  onPriceFilter,
  onStockFilter
}: ProductFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStockOnly, setInStockOnly] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    onCategoryFilter(categoryId)
  }

  const handlePriceChange = () => {
    const min = minPrice ? parseFloat(minPrice) : null
    const max = maxPrice ? parseFloat(maxPrice) : null
    onPriceFilter(min, max)
  }

  const handleStockFilter = (checked: boolean) => {
    setInStockOnly(checked)
    onStockFilter(checked)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(true)
    onSearch('')
    onCategoryFilter(null)
    onPriceFilter(null, null)
    onStockFilter(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Botón de filtros móvil */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>

      {/* Panel de filtros */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => handleCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por precio mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio mínimo
            </label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value)
                // Aplicar filtro automáticamente con un pequeño delay
                setTimeout(() => handlePriceChange(), 300)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por precio máximo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio máximo
            </label>
            <input
              type="number"
              placeholder="999999"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value)
                // Aplicar filtro automáticamente con un pequeño delay
                setTimeout(() => handlePriceChange(), 300)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por stock */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => handleStockFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Solo con stock</span>
            </label>
          </div>
        </div>

        {/* Botón de limpiar filtros */}
        <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Limpiar filtros</span>
          </button>
        </div>
      </div>
    </div>
  )
}
