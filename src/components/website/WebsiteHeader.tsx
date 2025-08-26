'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Phone, Mail } from 'lucide-react'

const navigation = [
  { name: 'Inicio', href: '/website' },
  { name: 'Habitaciones', href: '/website/rooms' },
  { name: 'Servicios', href: '/website/services' },
  { name: 'Sobre Nosotros', href: '/website/about' },
  { name: 'Contacto', href: '/website/contact' },
]

export default function WebsiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top bar con información de contacto */}
      <div className="bg-gradient-to-r from-green-800 to-blue-800 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>+56 9 1234 5678</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>info@admintermas.cl</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="hover:text-green-300 transition-colors">
              Área Administrativa
            </Link>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/website" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Todo Constructor</h1>
                <p className="text-sm text-gray-600">Hotel & Spa Termal</p>
              </div>
            </Link>
          </div>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Botón de reserva */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/dashboard/reservations/create"
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Reservar Ahora
            </Link>
          </div>

          {/* Botón móvil */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-green-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Abrir menú</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t mt-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-green-600 block px-3 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4">
                <Link
                  href="/dashboard/reservations/create"
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold block text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reservar Ahora
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 