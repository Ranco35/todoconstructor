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
      description: "Tratamientos de relajación y bienestar con vista al lago"
    },
    {
      icon: <Utensils className="w-8 h-8 text-amber-600" />,
      title: "Gastronomía",
      description: "Cocina gourmet con ingredientes locales y vista panorámica"
    },
    {
      icon: <Wifi className="w-8 h-8 text-blue-600" />,
      title: "WiFi Gratuito",
      description: "Internet de alta velocidad en todas las instalaciones"
    },
    {
      icon: <Car className="w-8 h-8 text-gray-600" />,
      title: "Estacionamiento",
      description: "Amplio estacionamiento gratuito para huéspedes"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Eventos",
      description: "Salones para eventos, bodas y conferencias"
    }
  ];

  const contacts: Contact[] = [
    {
      icon: <Phone className="w-6 h-6 text-green-600" />,
      title: "Teléfono Principal",
      info: "+56 9 9887 1415",
      action: "tel:+56998871415"
    },
    {
      icon: <Phone className="w-6 h-6 text-green-600" />,
      title: "Reservas",
      info: "+56 63 2197150",
      action: "tel:+56632197150"
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Email",
      info: "contacto@termasllifen.cl",
      action: "mailto:contacto@termasllifen.cl"
    },
    {
      icon: <MapPin className="w-6 h-6 text-red-600" />,
      title: "Ubicación",
      info: "Lago Ranco, Región de Los Ríos, Chile",
      action: "https://goo.gl/maps/ejemplo"
    }
  ];

  const WhatsAppButton = ({ size = "normal", position = "" }: { size?: "normal" | "large", position?: string }) => {
    const baseClasses = "bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3";
    const sizeClasses = size === "large" ? "px-8 py-4 text-lg" : "px-6 py-3";
    const positionClasses = position === "fixed" ? "fixed bottom-6 right-6 z-50" : "";
    
    return (
      <a
        href="https://wa.me/56998871415?text=Hola,%20necesito%20información%20sobre%20Hotel%20Termas%20Llifen"
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${sizeClasses} ${positionClasses}`}
      >
        <MessageCircle className="w-6 h-6" />
        <span>WhatsApp</span>
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-teal-800">
                Hotel Termas Llifen
              </h1>
              <p className="text-teal-600 text-lg font-medium">Lago Ranco, Chile</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora actual
              </div>
              <div className="text-lg font-semibold text-teal-800">
                {currentTime}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-playfair font-bold text-gray-800 mb-6">
            Bienvenidos a 
            <span className="text-teal-700 block">Termas Llifen</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
            Experiencia única en el Lago Ranco con aguas termales naturales, 
            spa de clase mundial y gastronomía gourmet
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton size="large" />
            <a
              href="tel:+56632197150"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Phone className="w-6 h-6" />
              <span>Llamar Ahora</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-playfair font-bold text-center text-gray-800 mb-12">
            Nuestros Servicios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  {feature.icon}
                  <h4 className="text-xl font-semibold text-gray-800">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-playfair font-bold text-center text-gray-800 mb-12">
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                {contact.action ? (
                  <a
                    href={contact.action}
                    className="flex items-center gap-4 hover:text-teal-600 transition-colors duration-300"
                  >
                    {contact.icon}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {contact.title}
                      </h4>
                      <p className="text-gray-600">{contact.info}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-4">
                    {contact.icon}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {contact.title}
                      </h4>
                      <p className="text-gray-600">{contact.info}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Info */}
      <section className="py-16 px-6 bg-red-50 border-t-4 border-red-500">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-playfair font-bold text-center text-red-800 mb-8">
            Información de Emergencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-200">
              <h4 className="text-xl font-semibold text-red-800 mb-3">Bomberos</h4>
              <a href="tel:132" className="text-2xl font-bold text-red-600 hover:text-red-800">
                132
              </a>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-200">
              <h4 className="text-xl font-semibold text-red-800 mb-3">Carabineros</h4>
              <a href="tel:133" className="text-2xl font-bold text-red-600 hover:text-red-800">
                133
              </a>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-200">
              <h4 className="text-xl font-semibold text-red-800 mb-3">SAMU</h4>
              <a href="tel:131" className="text-2xl font-bold text-red-600 hover:text-red-800">
                131
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h4 className="text-2xl font-playfair font-bold text-teal-400 mb-4">
            Hotel Termas Llifen
          </h4>
          <p className="text-gray-300 mb-4">
            Lago Ranco, Región de Los Ríos, Chile
          </p>
          <p className="text-sm text-gray-400">
            © 2025 Hotel Termas Llifen. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <WhatsAppButton position="fixed" />
    </div>
  );
} 