import Link from 'next/link'
import { Star, Users, Wifi, Coffee } from 'lucide-react'

const rooms = [
  {
    id: 1,
    name: 'Habitación Estándar',
    description: 'Comodidad y elegancia en un espacio acogedor con vista al valle.',
    price: '$50.000',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    features: ['2 personas', 'WiFi gratuito', 'Desayuno incluido'],
    rating: 4.8
  },
  {
    id: 2,
    name: 'Suite Premium',
    description: 'Lujo y espacio en nuestra suite más exclusiva con jacuzzi privado.',
    price: '$120.000',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80',
    features: ['4 personas', 'Jacuzzi privado', 'Vista panorámica'],
    rating: 4.9
  },
  {
    id: 3,
    name: 'Cabaña Familiar',
    description: 'Espacio ideal para familias con cocina completa y terraza privada.',
    price: '$80.000',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    features: ['6 personas', 'Cocina completa', 'Terraza privada'],
    rating: 4.7
  }
]

export default function RoomsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Habitaciones de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              Lujo
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descansa en nuestras habitaciones diseñadas para ofrecerte el máximo confort 
            y una experiencia única en el corazón del valle.
          </p>
        </div>

        {/* Habitaciones Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
            >
              {/* Imagen */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold">{room.rating}</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {room.name}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {room.description}
                </p>

                {/* Características */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {room.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Precio y botón */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-green-600">
                      {room.price}
                    </span>
                    <span className="text-gray-500 text-sm">/noche</span>
                  </div>
                  
                  <Link
                    href={`/dashboard/reservations/create?room=${room.id}`}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/website/rooms"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span>Ver Todas las Habitaciones</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
} 