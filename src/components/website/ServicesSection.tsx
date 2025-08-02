import { Waves, Utensils, Wifi, Car, Dumbbell, Mountain } from 'lucide-react'

const services = [
  {
    icon: Waves,
    title: 'Spa Termal',
    description: 'Relájate en nuestras piscinas termales naturales con propiedades curativas únicas.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Utensils,
    title: 'Restaurante Gourmet',
    description: 'Disfruta de la mejor gastronomía local con ingredientes frescos y vinos de la región.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Wifi,
    title: 'WiFi Gratuito',
    description: 'Conectividad de alta velocidad en todas las áreas del hotel para tu comodidad.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Car,
    title: 'Estacionamiento',
    description: 'Estacionamiento gratuito y seguro para todos nuestros huéspedes.',
    color: 'from-gray-500 to-gray-600'
  },
  {
    icon: Dumbbell,
    title: 'Gimnasio',
    description: 'Mantén tu rutina de ejercicios en nuestro gimnasio completamente equipado.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Mountain,
    title: 'Actividades',
    description: 'Excursiones guiadas, senderismo y actividades al aire libre en el valle.',
    color: 'from-teal-500 to-teal-600'
  }
]

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Servicios de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              Excelencia
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Disfruta de una experiencia completa con nuestros servicios premium diseñados 
            para hacer de tu estadía una experiencia inolvidable.
          </p>
        </div>

        {/* Servicios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-6`}>
                <service.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {service.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para tu experiencia?
            </h3>
            <p className="text-xl mb-6 opacity-90">
              Reserva ahora y obtén un 10% de descuento en tu primera estadía
            </p>
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg">
              Reservar con Descuento
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 