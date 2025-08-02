import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import WebsiteHeader from '@/components/website/WebsiteHeader'
import WebsiteFooter from '@/components/website/WebsiteFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hotel & Spa Admintermas - Experiencia Termal Única',
  description: 'Descubre el paraíso termal en el corazón de Chile. Habitaciones de lujo, spa termal, restaurante gourmet y experiencias inolvidables.',
  keywords: 'hotel, spa, termal, Chile, alojamiento, relax, wellness',
  openGraph: {
    title: 'Hotel & Spa Admintermas',
    description: 'Experiencia termal única en Chile',
    type: 'website',
  },
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen flex flex-col ${inter.className}`}>
      <WebsiteHeader />
      <main className="flex-1">
        {children}
      </main>
      <WebsiteFooter />
    </div>
  )
} 