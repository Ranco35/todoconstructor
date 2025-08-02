import { Waves, Utensils, Mountain, MapPin } from 'lucide-react'

const experiences = [
  {
    icon: Waves,
    title: 'Spa Termal',
    subtitle: 'Relajación Total',
    description: 'Sumérgete en nuestras piscinas termales naturales con propiedades curativas únicas. Disfruta de masajes terapéuticos y tratamientos de belleza.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    features: ['15 piscinas termales', 'Masajes terapéuticos', 'Tratamientos faciales'],
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Utensils,
    title: 'Restaurante Gourmet',
    subtitle: 'Gastronomía Local',
    description: 'Disfruta de la mejor gastronomía de la región con ingredientes frescos, vinos locales y platos típicos preparados por nuestros chefs expertos.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    features: ['Cocina regional', 'Vinos de la zona', 'Desayuno buffet'],
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Mountain,
    title: 'Actividades',
    subtitle: 'Aventura y Naturaleza',
    description: 'Explora el valle con nuestras excursiones guiadas, senderismo, observación de estrellas y actividades al aire libre para toda la familia.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    features: ['Excursiones guiadas', 'Senderismo', 'Observación de estrellas'],
    color: 'from-blue-500 to-blue-600'
  }
]

export default function ExperiencesSection() {
  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Experiencias
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
              Únicas
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Vive momentos inolvidables con nuestras experiencias diseñadas para 
            conectar con la naturaleza y encontrar la paz interior.
          </p>
        </div>

        {/* Experiencias Grid */}
        <div className="space-y-16">
          {experiences.map((experience, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Imagen */}
              <div className={`relative h-96 rounded-2xl overflow-hidden ${
                index % 2 === 1 ? 'lg:col-start-2' : ''
              }`}>
                <img
                  src={experience.image}
                  alt={experience.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>

              {/* Contenido */}
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${experience.color} flex items-center justify-center`}>
                  <experience.icon className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-3xl font-bold mb-2">
                    {experience.title}
                  </h3>
                  <p className="text-green-400 font-semibold text-lg mb-4">
                    {experience.subtitle}
                  </p>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {experience.description}
                  </p>
                </div>

                {/* Características */}
                <div className="space-y-3">
                  {experience.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Conocer Más
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para vivir la experiencia?
            </h3>
            <p className="text-xl mb-6 opacity-90">
              Reserva tu estadía y descubre el paraíso termal
            </p>
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg">
              Reservar Ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 