'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface SearchResultsIndicatorProps {
  searchTerm: string
  selectedCategory: string
  filteredCount: number
  totalCount: number
  categories: any[]
  onClearSearch: () => void
  className?: string
}

export default function SearchResultsIndicator({
  searchTerm,
  selectedCategory,
  filteredCount,
  totalCount,
  categories,
  onClearSearch,
  className = ""
}: SearchResultsIndicatorProps) {
  // Solo mostrar si hay búsqueda activa o categoría seleccionada
  if (!searchTerm && selectedCategory === 'all') {
    return null
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Indicador de resultados */}
        <div className="text-sm text-gray-600 mb-3">
          <span className="font-medium">{filteredCount}</span> producto{filteredCount !== 1 ? 's' : ''} encontrado{filteredCount !== 1 ? 's' : ''}
          {searchTerm && (
            <span> para "{searchTerm}"</span>
          )}
          {selectedCategory !== 'all' && (
            <span> en {categories.find(c => c.name === selectedCategory)?.displayName || selectedCategory}</span>
          )}
          {searchTerm && selectedCategory !== 'all' && (
            <span> de {totalCount} total</span>
          )}
        </div>

        {/* Botón para limpiar búsqueda */}
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="w-full"
          >
            <Search className="h-3 w-3 mr-2" />
            Limpiar búsqueda
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 