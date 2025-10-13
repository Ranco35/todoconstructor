import { Phone, MapPin, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Contacto
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Contáctanos para cualquier consulta o información que necesites.
        </p>
      </div>

      {/* Información de contacto simplificada */}
      <div className="max-w-2xl mx-auto">
        <div className="space-y-8">
          {/* WhatsApp */}
          <div className="flex items-center space-x-4 p-6 bg-green-50 rounded-2xl">
            <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                WhatsApp
              </h3>
              <p className="text-gray-600 mb-3">
                Chatea con nosotros para consultas rápidas
              </p>
              <a
                href="https://wa.me/56969095111?text=Hola,%20necesito%20información%20sobre%20productos%20de%20TC%20Constructor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-2xl">
            <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Teléfono
              </h3>
              <p className="text-gray-600 mb-3">
                Llámanos para consultas y pedidos
              </p>
              <a
                href="tel:+56969095111"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Phone className="w-5 h-5 mr-2" />
                +56 9 6909 5111
              </a>
            </div>
          </div>

          {/* Dirección */}
          <div className="flex items-center space-x-4 p-6 bg-purple-50 rounded-2xl">
            <div className="flex-shrink-0 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Ubicación
              </h3>
              <p className="text-gray-600 mb-3">
                Nuestra dirección física
              </p>
              <p className="text-purple-600 font-medium text-lg">
                Bodegas Termas LLifen
              </p>
              <p className="text-gray-600 text-sm mt-1">
                LLifen s/n, Futrono, Chile
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
