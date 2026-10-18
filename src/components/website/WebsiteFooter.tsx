'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, buildWhatsAppUrl } from '@/lib/website/whatsapp'

// Solo páginas que existen; agregar aquí cuando se creen nuevas (FAQ, despacho, etc.)
const footerLinks = {
  catalogo: [
    { name: 'Todos los productos', href: '/website' },
    { name: 'Categorías', href: '/website/categories' },
    { name: 'Promociones', href: '/website/promotions' },
  ],
  empresa: [
    { name: 'Sobre Nosotros', href: '/website/about' },
    { name: 'Contacto', href: '/website/contact' },
  ],
}

export default function WebsiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">TC</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">TC Constructor</h3>
                <p className="text-sm text-gray-400">Ferretería & Construcción</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Ferretería especializada en herramientas, materiales de construcción y productos eléctricos.
              Todo lo que necesitas para tus proyectos de construcción y reparación.
            </p>

            {/* Información de contacto */}
            <div className="space-y-3">
              <a href={`tel:+${WHATSAPP_NUMBER}`} className="flex items-center space-x-3 group">
                <Phone className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 group-hover:text-green-400 transition-colors">+56 9 6909 5111</span>
              </a>
              <a href="mailto:ventas@todoconstructor.cl" className="flex items-center space-x-3 group">
                <Mail className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 group-hover:text-green-400 transition-colors">ventas@todoconstructor.cl</span>
              </a>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Bodegas Termas LLifen - LLifen, Futrono, Chile</span>
              </div>
            </div>
          </div>

          {/* Enlaces del catálogo */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Catálogo</h4>
            <ul className="space-y-3">
              {footerLinks.catalogo.map((link) => (
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

          {/* Enlaces de la empresa */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={buildWhatsAppUrl('Hola, necesito información sobre productos de TC Constructor')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-300 hover:text-green-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Escríbenos por WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {year} TC Constructor. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
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
