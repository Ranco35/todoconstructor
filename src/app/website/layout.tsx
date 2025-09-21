import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import WebsiteHeader from '@/components/website/WebsiteHeader'
import WebsiteFooter from '@/components/website/WebsiteFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TC Constructor - Ferretería y Construcción',
  description: 'Ferretería especializada en herramientas, materiales de construcción, productos eléctricos y más. Todo lo que necesitas para tus proyectos.',
  keywords: 'ferretería, construcción, herramientas, materiales, eléctricos, Chile, TC Constructor',
  openGraph: {
    title: 'TC Constructor - Ferretería y Construcción',
    description: 'Ferretería especializada en herramientas y materiales de construcción',
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