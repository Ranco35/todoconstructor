import { Package, Users, Award, Clock, MapPin, Phone } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sobre TC Constructor
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Más de 20 años brindando soluciones integrales en ferretería y construcción, 
          con la confianza y calidad que nuestros clientes merecen.
        </p>
      </div>

      {/* Historia */}
      <div className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Nuestra Historia
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                TC Constructor nació en el año 2000 con la visión de ser la ferretería 
                de referencia en Santiago, ofreciendo productos de calidad y un servicio 
                excepcional a nuestros clientes.
              </p>
              <p>
                Desde nuestros inicios, nos hemos especializado en herramientas, materiales 
                de construcción y productos eléctricos, convirtiéndonos en el aliado 
                perfecto para constructores, contratistas y aficionados al bricolaje.
              </p>
              <p>
                Hoy en día, contamos con un amplio catálogo de productos y un equipo 
                de profesionales altamente capacitados, listos para asesorarte en 
                cualquier proyecto que tengas en mente.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Nuestros Valores</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Calidad en todos nuestros productos</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Servicio al cliente excepcional</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Precios competitivos y justos</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Innovación constante</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Compromiso con la comunidad</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
          <div className="text-gray-600">Productos Disponibles</div>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">1000+</div>
          <div className="text-gray-600">Clientes Satisfechos</div>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">20+</div>
          <div className="text-gray-600">Años de Experiencia</div>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
          <div className="text-gray-600">Soporte Técnico</div>
        </div>
      </div>

      {/* Equipo */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Nuestro Equipo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">JD</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Juan Díaz
            </h3>
            <p className="text-blue-600 font-medium mb-2">Gerente General</p>
            <p className="text-gray-600 text-sm">
              Más de 15 años de experiencia en el rubro de la construcción y ferretería.
            </p>
          </div>
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">MR</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              María Rodríguez
            </h3>
            <p className="text-green-600 font-medium mb-2">Jefa de Ventas</p>
            <p className="text-gray-600 text-sm">
              Especialista en asesoría técnica y atención al cliente.
            </p>
          </div>
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">CL</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Carlos López
            </h3>
            <p className="text-purple-600 font-medium mb-2">Técnico Especialista</p>
            <p className="text-gray-600 text-sm">
              Experto en herramientas eléctricas y sistemas de construcción.
            </p>
          </div>
        </div>
      </div>

      {/* Ubicación y contacto */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Visítanos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-gray-600">
                  Av. Principal 123, Santiago, Chile
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="text-gray-600">
                  +56 9 6909 5111
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="text-gray-600">
                  <p>Lunes a Viernes: 8:00 - 18:00</p>
                  <p>Sábados: 9:00 - 14:00</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Por qué elegirnos?
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Productos de las mejores marcas del mercado</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Asesoría técnica especializada y gratuita</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Precios competitivos y descuentos por volumen</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Entrega rápida y confiable</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Garantías extendidas en productos seleccionados</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
