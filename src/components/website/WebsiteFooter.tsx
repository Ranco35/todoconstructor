import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

const footerLinks = {
  hotel: [
    { name: 'Habitaciones', href: '/website/rooms' },
    { name: 'Servicios', href: '/website/services' },
    { name: 'Sobre Nosotros', href: '/website/about' },
    { name: 'Contacto', href: '/website/contact' },
  ],
  servicios: [
    { name: 'Spa Termal', href: '/website/spa' },
    { name: 'Restaurante', href: '/website/restaurant' },
    { name: 'Actividades', href: '/website/activities' },
    { name: 'Eventos', href: '/website/events' },
  ],
  información: [
    { name: 'Política de Privacidad', href: '/website/privacy' },
    { name: 'Términos y Condiciones', href: '/website/terms' },
    { name: 'FAQ', href: '/website/faq' },
    { name: 'Blog', href: '/website/blog' },
  ]
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'YouTube', icon: Youtube, href: '#' },
]

export default function WebsiteFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">Admintermas</h3>
                <p className="text-sm text-gray-400">Hotel & Spa Termal</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Descubre el paraíso termal en el corazón de Chile. Ofrecemos una experiencia 
              única combinando lujo, naturaleza y bienestar en un entorno incomparable.
            </p>

            {/* Información de contacto */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">+56 9 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">info@admintermas.cl</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Valle del Elqui, Chile</span>
              </div>
            </div>
          </div>

          {/* Enlaces del hotel */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Hotel</h4>
            <ul className="space-y-3">
              {footerLinks.hotel.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Enlaces de servicios */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Servicios</h4>
            <ul className="space-y-3">
              {footerLinks.servicios.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Enlaces de información */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Información</h4>
            <ul className="space-y-3">
              {footerLinks.información.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>

            {/* Newsletter */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">Suscríbete a nuestro newsletter:</span>
              <div className="flex">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-r-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200">
                  Suscribir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Admintermas. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/website/privacy" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Privacidad
              </Link>
              <Link href="/website/terms" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Términos
              </Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Área Administrativa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 