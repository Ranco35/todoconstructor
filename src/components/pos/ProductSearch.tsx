'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface ProductSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  placeholder?: string
  className?: string
}

export default function ProductSearch({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Buscar productos...",
  className = ""
}: ProductSearchProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 