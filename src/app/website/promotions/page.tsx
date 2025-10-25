import { getPromotedProductsOnly, getActivePromotions } from '@/actions/website/promotions'
import ProductCardWithPromotions from '@/components/website/ProductCardWithPromotions'
import { Percent, Gift, Clock, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  console.log('🎯 PromotionsPage (Server) está renderizando...')
  
  try {
    // Cargar productos con promociones y promociones activas
    const [promotedProducts, activePromotions] = await Promise.all([
      getPromotedProductsOnly(),
      getActivePromotions()
    ]);

    console.log(`📦 Productos con promociones encontrados: ${promotedProducts.length}`)
    console.log(`🎯 Promociones activas: ${activePromotions.length}`)

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <Percent className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              ¡Ofertas Especiales!
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Aprovecha nuestras promociones exclusivas en productos seleccionados. 
            ¡Precios especiales por tiempo limitado!
          </p>
        </div>

        {/* Estadísticas de promociones */}
        {activePromotions.length > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl text-white p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Gift className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{activePromotions.length}</span>
                </div>
                <p className="text-red-100">Promociones Activas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Tag className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{promotedProducts.length}</span>
                </div>
                <p className="text-red-100">Productos en Oferta</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 mr-2" />
                  <span className="text-lg font-bold">¡Por tiempo limitado!</span>
                </div>
                <p className="text-red-100">No te pierdas estas ofertas</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de promociones activas */}
        {activePromotions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Gift className="w-6 h-6 text-red-600 mr-2" />
              Promociones Vigentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePromotions.map((promotion) => (
                <div key={promotion.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{promotion.name}</h3>
                  {promotion.description && (
                    <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    <p>
                      <span className="font-medium">Tipo:</span> {
                        promotion.promotionType === 'discount_percentage' ? `${promotion.value}% de descuento` :
                        promotion.promotionType === 'discount_fixed' ? `$${promotion.value.toLocaleString()} de descuento` :
                        promotion.promotionType === 'special_price' ? `Precio especial $${promotion.value.toLocaleString()}` :
                        `${promotion.value}% de aumento`
                      }
                    </p>
                    <p>
                      <span className="font-medium">Aplica a:</span> {
                        promotion.appliesTo === 'all_products' ? 'Todos los productos' :
                        promotion.appliesTo === 'categories' ? 'Categorías seleccionadas' :
                        promotion.appliesTo === 'specific_products' ? 'Productos específicos' :
                        'Proveedores específicos'
                      }
                    </p>
                    <p>
                      <span className="font-medium">Válida hasta:</span> {new Date(promotion.endDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos en promoción */}
        {promotedProducts.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Tag className="w-6 h-6 text-red-600 mr-2" />
              Productos en Oferta ({promotedProducts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {promotedProducts.map((product) => (
                <ProductCardWithPromotions
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        ) : (
          // Sin promociones
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Gift className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No hay promociones activas
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Por el momento no tenemos ofertas especiales, pero revisa nuestro catálogo completo de productos.
            </p>
            <div className="space-x-4">
              <a
                href="/website/categories"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
              >
                Ver Todos los Productos
              </a>
              <a
                href="/website/contact"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors inline-block"
              >
                Contactanos
              </a>
            </div>
          </div>
        )}

        {/* Call to action */}
        {promotedProducts.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl text-white p-8">
              <h2 className="text-3xl font-bold mb-4">¿Te interesan estos productos?</h2>
              <p className="text-xl mb-6 text-red-100">
                Contactanos por WhatsApp para más información sobre nuestras ofertas
              </p>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '56987654321'}?text=¡Hola! Me interesan sus productos en promoción. ¿Pueden darme más información?`}
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                </svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('❌ Error en PromotionsPage:', error)
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Percent className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar promociones
          </h1>
          <p className="text-gray-600 mb-6">
            Hubo un problema al cargar las ofertas. Por favor intenta nuevamente.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }
}
