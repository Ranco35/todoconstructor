'use client'

import { useState } from 'react'
import ProductCardWithPromotions from './ProductCardWithPromotions'
import { ProductWithPromotion } from '@/actions/website/promotions'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductsPaginatedProps {
  products: ProductWithPromotion[]
  categoryName: string
  itemsPerPage?: number
}

export default function ProductsPaginated({ 
  products, 
  categoryName,
  itemsPerPage = 20 
}: ProductsPaginatedProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  // Calcular paginación
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = products.slice(startIndex, endIndex)

  // Funciones de navegación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Mostrar páginas con elipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No hay productos en esta categoría
        </h3>
        <p className="text-gray-500 mb-6">
          Esta categoría aún no tiene productos asignados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información de paginación superior */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, products.length)}</span> de <span className="font-semibold">{products.length}</span> productos
        </div>
        <div className="text-sm text-gray-600">
          Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Productos en {categoryName}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
            <ProductCardWithPromotions
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-center space-x-2">
            {/* Botón Anterior */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Números de página */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

