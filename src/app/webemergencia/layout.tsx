import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Hotel Termas Llifen - Lago Ranco, Chile',
  description: 'Hotel & Spa Termas Llifen - Experiencia única en el Lago Ranco con aguas termales naturales, spa de clase mundial y gastronomía gourmet',
  keywords: 'hotel, termas, llifen, lago ranco, spa, aguas termales, chile, turismo, relax, naturaleza',
  robots: 'index, follow',
  openGraph: {
    title: 'Hotel Termas Llifen - Lago Ranco, Chile',
    description: 'Experiencia única en el Lago Ranco con aguas termales naturales',
    type: 'website',
    locale: 'es_CL'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f766e', // verde termal
};

export default function WebLlifenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <head>
        <meta name="format-detection" content="telephone=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Termas Llifen" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 