'use client'

import { useState } from 'react'
import { ShoppingCart, Package, MapPin, Star, MessageCircle, Tag, Percent } from 'lucide-react'
import { ProductWithPromotion } from '@/actions/website/promotions'

interface ProductCardWithPromotionsProps {
  product: ProductWithPromotion
  onAddToCart?: (product: ProductWithPromotion) => void
}

export default function ProductCardWithPromotions({ product, onAddToCart }: ProductCardWithPromotionsProps) {
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

  // Precio final a mostrar (con promoción si existe, sino el original)
  const displayPrice = product.hasPromotion && product.promotionPrice 
    ? product.promotionPrice 
    : (product.finalPrice || product.saleprice || 0);

  // Función para manejar WhatsApp
  const handleWhatsAppClick = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      // Lógica por defecto para WhatsApp
      let message = `Hola! Me interesa este producto:%0A%0A*${product.name}*%0ASKU: ${product.sku || 'No disponible'}`
      
      if (product.hasPromotion && product.promotionData) {
        message += `%0A%0A🏷️ ¡ESTÁ EN PROMOCIÓN!%0A`
        message += `Precio original: $${product.originalPrice?.toLocaleString() || 'Consultar'}%0A`
        message += `*Precio con descuento: $${product.promotionPrice?.toLocaleString() || 'Consultar'}*%0A`
        message += `*Ahorro: $${product.promotionData.savings.toLocaleString()} (${Math.round(product.promotionData.savingsPercent)}%)*`
      } else {
        message += `%0APrecio: $${displayPrice.toLocaleString() || 'Consultar'}`
      }
      
      message += `%0A%0A¿Está disponible?`
      
      const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '56969095111'
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
      window.open(whatsappUrl, '_blank')
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 group relative">
      {/* Badge de promoción */}
      {product.hasPromotion && product.promotionData && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-lg">
            <Percent className="w-3 h-3 mr-1" />
            -{Math.round(product.promotionData.savingsPercent)}%
          </div>
        </div>
      )}

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
        <div className="absolute bottom-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
            product.stock > 0 ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
          }`}>
            {product.stock > 0 ? `Disponible (${product.stock})` : 'Sin stock'}
          </span>
        </div>

        {/* Badge de categoría (solo si no hay promoción para no sobrecargar) */}
        {product.category && !product.hasPromotion && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
              {product.category.name}
            </span>
          </div>
        )}

        {/* Ribbon de promoción */}
        {product.hasPromotion && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-xs font-bold transform rotate-12 translate-x-2 translate-y-2 shadow-lg">
            ¡OFERTA!
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

        {/* Información de promoción */}
        {product.hasPromotion && product.promotionData && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700 text-sm font-medium mb-1">
              <Tag className="w-3 h-3 mr-1" />
              {product.promotionData.name}
            </div>
            <div className="text-xs text-red-600">
              Ahorras: {formatPrice(product.promotionData.savings)}
            </div>
          </div>
        )}

        {/* Precio - NO mostrar si no hay stock */}
        <div className="mb-3">
          {product.stock > 0 ? (
            // Mostrar precio solo si hay stock
            displayPrice > 0 ? (
              <div>
                {product.hasPromotion ? (
                  <div className="space-y-1">
                    {/* Precio original tachado */}
                    <div className="text-sm text-gray-500 line-through">
                      Antes: {formatPrice(product.originalPrice)}
                    </div>
                    {/* Precio con descuento */}
                    <div className="text-2xl font-bold text-red-600">
                      {formatPrice(displayPrice)}
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(displayPrice)}
                  </div>
                )}
                <span className="text-sm text-gray-500 ml-1">
                  (IVA {product.vat || 0}% incluido)
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                Consultar precio
              </span>
            )
          ) : (
            // Sin stock - NO mostrar precio, solo mensaje
            <div className="text-center py-2">
              <span className="text-lg font-semibold text-gray-400">
                Sin stock disponible
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Consulta disponibilidad
              </p>
            </div>
          )}
        </div>

        {/* Ubicación */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{product.warehouse.name}</span>
        </div>

        {/* Botón de consultar por WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
            product.hasPromotion 
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {product.hasPromotion ? '¡Consultar Oferta!' : 'Consultar por WhatsApp'}
          </span>
        </button>
      </div>
    </div>
  )
}
