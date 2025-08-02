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
  
  // Optimizaciones experimentales para performance
  experimental: {
    // 🔥 HABILITADO: Server Actions explícitamente para Vercel
    serverActions: true,
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
    'sharp'
  ],
  
  // Configuración webpack optimizada
  webpack: (config, { dev, isServer }) => {
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