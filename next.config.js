// Fix de build en Vercel: algunos paquetes de navegador referencian `self`
// durante el render/SSG en servidor. Reescribimos `self` -> `globalThis` en bundles del servidor.
// Esto previene "ReferenceError: self is not defined" al recolectar datos de páginas.

const webpack = require('webpack');

// (Eliminado nextConfig duplicado; integrar en la configuración principal de abajo)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Configuración optimizada para producción
  // 🔥 CORREGIDO: No usar output standalone que interfiere con Server Actions
  // output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // headers combinados se definen más abajo
  
  // Optimizaciones experimentales para performance
  experimental: {
    // 🔥 HABILITADO: Server Actions explícitamente para Vercel (Next 15 requiere objeto)
    serverActions: {},
    // Optimizar imports de paquetes pesados
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      'date-fns',
      'react-hook-form'
    ],
  },
  
  // Optimizar compilador
  compiler: {
    // 🔥 CORREGIDO: NO remover console.log en producción para debugging
    // removeConsole: process.env.NODE_ENV === 'production',
    removeConsole: false,
    // Optimizar styled-components si se usa
    styledComponents: true,
  },
  
  // Configurar paquetes externos pesados
  serverExternalPackages: [
    'puppeteer',
    'whatsapp-web.js',
    'fluent-ffmpeg',
    '@prisma/client',
    'sharp',
    // Evitar que estos paquetes se bundleen en el servidor (algunos referencian self/window)
    'xlsx',
    'exceljs',
    'jspdf',
    'jspdf-autotable',
    'qrcode'
  ],
  
  // Configuración webpack optimizada
  webpack: (config, { dev, isServer }) => {
    // Definir self como globalThis en el bundle del servidor para evitar errores en SSG/ISR
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'globalThis',
        })
      );
    }
    // Optimizaciones para desarrollo
    if (dev) {
      // Optimizar watching
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
      
             // Cache mejorado para desarrollo
       config.cache = {
         type: 'filesystem',
         buildDependencies: {
           config: [__filename],
         },
       };
    }
    
    // Optimizaciones para cliente
    if (!isServer) {
      // Fallbacks para módulos Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
      };
    }
    
         // Optimizar chunks para mejor caching (en producción)
     if (!dev) {
       config.optimization.splitChunks = {
         chunks: 'all',
         cacheGroups: {
           // Vendor chunks separados para mejor caching
           vendor: {
             test: /[\\/]node_modules[\\/]/,
             name: 'vendors',
             chunks: 'all',
             priority: 10,
           },
           // Componentes UI en chunk separado
           ui: {
             test: /[\\/]components[\\/]/,
             name: 'ui',
             chunks: 'all',
             priority: 5,
           },
           // Librerías comunes
           common: {
             minChunks: 2,
             chunks: 'all',
             name: 'common',
             priority: 1,
           },
         },
       };
     }
    
    // Optimizar resolución de módulos
    config.resolve.modules = ['node_modules'];
    
    return config;
  },
  
  // Headers para mejorar caching
  async headers() {
    return [
      // Configuración de cookies para producción (aplica a todas las rutas)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'SameSite=Lax; Secure; HttpOnly',
          },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirecciones optimizadas
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig; 