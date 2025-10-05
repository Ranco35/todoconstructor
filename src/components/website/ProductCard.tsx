'use client'

import { useState } from 'react'
import { ShoppingCart, Package, MapPin, Star, MessageCircle } from 'lucide-react'
import { ProductWithStock } from '@/actions/website/products'

interface ProductCardProps {
  product: ProductWithStock
  onAddToCart?: (product: ProductWithStock) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  // Función para formatear precio
  const formatPrice = (price: number | null) => {
    if (!price) return 'Consultar precio'
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Función para calcular precio con IVA
  const getPriceWithVAT = (price: number | null, vat: number | null) => {
    if (!price) return 0
    if (!vat || vat === 0) return price
    return Math.round(price * (1 + vat / 100))
  }

  // Función para obtener imagen genérica por categoría
  const getGenericImage = (categoryName: string | null) => {
    const categoryImages: { [key: string]: string } = {
      'Herramientas': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      'Materiales': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      'Eléctricos': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      'Pinturas': 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      'Ferretería': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    }
    
    return categoryImages[categoryName || 'Ferretería'] || categoryImages['Ferretería']
  }

  // Función para obtener color de stock
  const getStockColor = (stock: number) => {
    if (stock > 10) return 'text-green-600 bg-green-100'
    if (stock > 5) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 group">
      {/* Imagen del producto */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src={getGenericImage(product.category?.name || null)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        
        {/* Badge de stock */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(product.stock)}`}>
            {product.stock} unidades
          </span>
        </div>

        {/* Badge de categoría */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
              {product.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Contenido del producto */}
      <div className="p-4">
        {/* Nombre del producto */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Marca */}
        {product.brand && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Marca:</span> {product.brand}
          </p>
        )}

        {/* SKU */}
        {product.sku && (
          <p className="text-xs text-gray-500 mb-2">
            <span className="font-medium">SKU:</span> {product.sku}
          </p>
        )}

        {/* Descripción */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="mb-3">
          {product.finalPrice ? (
            <div>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(product.finalPrice)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                (IVA {product.vat || 0}% incluido)
              </span>
            </div>
          ) : (
            <span className="text-lg font-semibold text-gray-600">
              Consultar precio
            </span>
          )}
        </div>

        {/* Ubicación */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{product.warehouse.name}</span>
        </div>

        {/* Botón de consultar por WhatsApp */}
        <button
          onClick={() => onAddToCart?.(product)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Consultar por WhatsApp</span>
        </button>
      </div>
    </div>
  )
}
