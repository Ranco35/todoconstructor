import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Contacto
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          ¿Necesitas ayuda con tu proyecto? Contáctanos y te asesoraremos 
          para encontrar los productos perfectos para tus necesidades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Información de contacto */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Información de Contacto
          </h2>

          <div className="space-y-6">
            {/* Teléfono */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Teléfono
                </h3>
                <p className="text-gray-600 mb-2">
                  Llámanos para consultas y pedidos
                </p>
                <a
                  href="tel:+56969095111"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  +56 9 6909 5111
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Email
                </h3>
                <p className="text-gray-600 mb-2">
                  Envíanos un mensaje y te responderemos pronto
                </p>
                <a
                  href="mailto:info@tcconstructor.cl"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  info@tcconstructor.cl
                </a>
              </div>
            </div>

            {/* Ubicación */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Ubicación
                </h3>
                <p className="text-gray-600 mb-2">
                  Visítanos en nuestra tienda
                </p>
                <p className="text-purple-600 font-medium">
                  Av. Principal 123, Santiago, Chile
                </p>
              </div>
            </div>

            {/* Horarios */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Horarios de Atención
                </h3>
                <div className="text-gray-600 space-y-1">
                  <p>Lunes a Viernes: 8:00 - 18:00</p>
                  <p>Sábados: 9:00 - 14:00</p>
                  <p>Domingos: Cerrado</p>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  WhatsApp
                </h3>
                <p className="text-gray-600 mb-2">
                  Chatea con nosotros para consultas rápidas
                </p>
                <a
                  href="https://wa.me/56969095111?text=Hola,%20me%20interesa%20consultar%20sobre%20productos%20de%20ferretería"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  +56 9 6909 5111
                </a>
              </div>
            </div>
          </div>

          {/* Servicios adicionales */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Servicios que Ofrecemos
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Asesoría técnica especializada</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Entrega a domicilio</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Garantías en todos los productos</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Soporte post-venta</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Envíanos un Mensaje
          </h2>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+56 9 6909 5111"
              />
            </div>

            <div>
              <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-2">
                Asunto *
              </label>
              <select
                id="asunto"
                name="asunto"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona un asunto</option>
                <option value="consulta-producto">Consulta sobre producto</option>
                <option value="cotizacion">Solicitar cotización</option>
                <option value="asesoria-tecnica">Asesoría técnica</option>
                <option value="entrega-domicilio">Entrega a domicilio</option>
                <option value="garantia">Consulta sobre garantía</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje *
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tu consulta o necesidad..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Enviar Mensaje
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Te responderemos en un plazo máximo de 24 horas. 
              Para consultas urgentes, te recomendamos llamarnos directamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
