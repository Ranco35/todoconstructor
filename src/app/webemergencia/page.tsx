'use client';

import { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Clock, Wifi, Car, Utensils, Waves, Flower, Users, MessageCircle } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Contact {
  icon: React.ReactNode;
  title: string;
  info: string;
  action?: string;
}

export default function HotelLlifenPage() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const features: Feature[] = [
    {
      icon: <Waves className="w-8 h-8 text-teal-600" />,
      title: "Aguas Termales",
      description: "Aguas termales naturales con propiedades curativas únicas"
    },
    {
      icon: <Flower className="w-8 h-8 text-green-600" />,
      title: "Spa",
      description: "Tratamientos de relajación y bienestar en entorno natural"
    },
    {
      icon: <Utensils className="w-8 h-8 text-orange-600" />,
      title: "Gastronomía Gourmet",
      description: "Cocina de autor con ingredientes locales"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Experiencias Únicas",
      description: "Actividades exclusivas en contacto con la naturaleza"
    }
  ];

  const contacts: Contact[] = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Reservas",
      info: "+56 9 6645 7193",
      action: "tel:+56966457193"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "WhatsApp",
      info: "+56 9 6645 7193",
      action: "https://wa.me/56966457193?text=Hola,%20me%20interesa%20hacer%20una%20reserva%20en%20Hotel%20Termas%20Llifen"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      info: "reservas@termasllifen.cl",
      action: "mailto:reservas@termasllifen.cl"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Ubicación",
      info: "Lago Ranco, Región de Los Ríos, Chile"
    }
  ];

  const WhatsAppButton = ({ size = "normal", position = "" }: { size?: "normal" | "large", position?: string }) => {
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 space-x-3";
    const sizeClasses = size === "large" 
      ? "px-12 py-6 text-xl" 
      : "px-8 py-4 text-lg";
    const colorClasses = "bg-green-500 text-white hover:bg-green-600";
    
    return (
      <a
        href="https://wa.me/56966457193?text=Hola,%20me%20interesa%20hacer%20una%20reserva%20en%20Hotel%20Termas%20Llifen"
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${sizeClasses} ${colorClasses} ${position}`}
      >
        <MessageCircle className={size === "large" ? "w-8 h-8" : "w-6 h-6"} />
        <span>Reservar por WhatsApp</span>
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      {/* Header Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-emerald-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              <span className="font-serif text-teal-700">Hotel Termas</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Llifen
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Una experiencia única en el corazón del Lago Ranco, donde las aguas termales naturales se encuentran con el lujo y la tranquilidad
            </p>
            
            {/* Reloj en tiempo real */}
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-teal-100 mb-8">
              <Clock className="w-5 h-5 text-teal-600" />
              <span className="text-gray-700 font-medium">{currentTime}</span>
            </div>

            {/* Botón WhatsApp grande al inicio */}
            <div className="mb-8">
              <WhatsAppButton size="large" />
            </div>

            {/* Botones de contacto principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+56966457193"
                className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-semibold rounded-lg shadow-lg hover:bg-teal-700 transition-colors space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Llamar Ahora</span>
              </a>
              <a
                href="mailto:reservas@termasllifen.cl"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-colors space-x-2 border border-teal-200"
              >
                <Mail className="w-5 h-5" />
                <span>Enviar Email</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Descubre Nuestras Experiencias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-gray-50 rounded-full group-hover:bg-teal-50 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Contacto y Reservas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {contact.action ? (
                  <a
                    href={contact.action}
                    target={contact.action.startsWith('https://wa.me') ? '_blank' : undefined}
                    rel={contact.action.startsWith('https://wa.me') ? 'noopener noreferrer' : undefined}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className={`flex-shrink-0 p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform ${
                      contact.title === 'WhatsApp' 
                        ? 'bg-green-100 text-green-600 group-hover:bg-green-200' 
                        : 'bg-teal-100 text-teal-600 group-hover:bg-teal-200'
                    }`}>
                      {contact.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition-colors mb-2">
                      {contact.title}
                    </h3>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors">
                      {contact.info}
                    </p>
                  </a>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="flex-shrink-0 p-3 bg-gray-100 rounded-lg mb-3">
                      {contact.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {contact.title}
                    </h3>
                    <p className="text-gray-600">
                      {contact.info}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Servicios e Instalaciones
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Wifi className="w-6 h-6" />, name: "WiFi Gratuito" },
              { icon: <Car className="w-6 h-6" />, name: "Estacionamiento" },
              { icon: <Utensils className="w-6 h-6" />, name: "Restaurante" },
              { icon: <Waves className="w-6 h-6" />, name: "Piscinas Termales" },
              { icon: <Flower className="w-6 h-6" />, name: "Spa & Wellness" },
              { icon: <Users className="w-6 h-6" />, name: "Eventos Especiales" },
              { icon: <MapPin className="w-6 h-6" />, name: "Tours y Excursiones" },
              { icon: <Clock className="w-6 h-6" />, name: "Servicio 24/7" }
            ].map((service, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="p-2 bg-teal-100 rounded-lg mb-3 text-teal-600">
                  {service.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {service.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center mb-20">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-12 text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para una experiencia inolvidable?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Escapa de la rutina y sumérgete en el lujo natural del Lago Ranco. 
              Tu momento de relajación te está esperando.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+56966457193"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-colors space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Llamar Ahora</span>
              </a>
              <a
                href="https://wa.me/56966457193?text=Hola,%20me%20interesa%20hacer%20una%20reserva%20en%20Hotel%20Termas%20Llifen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition-colors space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:reservas@termasllifen.cl"
                className="inline-flex items-center justify-center px-8 py-4 bg-teal-700 text-white font-semibold rounded-lg shadow-lg hover:bg-teal-800 transition-colors space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </section>

        {/* Botón WhatsApp grande al final */}
        <section className="text-center mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Reserva Ahora por WhatsApp!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Contacta directamente con nosotros para hacer tu reserva de forma rápida y sencilla
            </p>
            <WhatsAppButton size="large" />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 font-serif">Hotel Termas Llifen</h3>
            <p className="text-gray-400 mb-4">
              Lago Ranco, Región de Los Ríos, Chile
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a 
                href="tel:+56966457193"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>+56 9 6645 7193</span>
              </a>
              <span className="hidden sm:block text-gray-600">•</span>
              <a 
                href="mailto:reservas@termasllifen.cl"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>reservas@termasllifen.cl</span>
              </a>
              <span className="hidden sm:block text-gray-600">•</span>
              <a 
                href="https://wa.me/56966457193"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <span>© 2025 Hotel Termas Llifen</span>
              <span>•</span>
              <span>Todos los derechos reservados</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 