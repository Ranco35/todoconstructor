'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface NoProductsMessageProps {
  searchTerm: string
  selectedCategory: string
  onClearSearch: () => void
  className?: string
}

export default function NoProductsMessage({
  searchTerm,
  selectedCategory,
  onClearSearch,
  className = ""
}: NoProductsMessageProps) {
  const getMessage = () => {
    if (searchTerm) {
      return `No se encontraron productos que coincidan con "${searchTerm}"`
    }
    if (selectedCategory !== 'all') {
      return `No hay productos disponibles en la categoría seleccionada`
    }
    return 'No hay productos disponibles'
  }

  return (
    <Card className={className}>
      <CardContent className="p-8 text-center">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">
          {getMessage()}
        </p>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
          >
            Limpiar búsqueda
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 