import HeroSection from '@/components/website/HeroSection'
import ServicesSection from '@/components/website/ServicesSection'
import RoomsSection from '@/components/website/RoomsSection'
import ExperiencesSection from '@/components/website/ExperiencesSection'
import TestimonialsSection from '@/components/website/TestimonialsSection'
import ContactSection from '@/components/website/ContactSection'

export default function WebsiteHome() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Servicios Destacados */}
      <ServicesSection />
      
      {/* Habitaciones */}
      <RoomsSection />
      
      {/* Experiencias */}
      <ExperiencesSection />
      
      {/* Testimonios */}
      <TestimonialsSection />
      
      {/* Contacto */}
      <ContactSection />
    </div>
  )
} 