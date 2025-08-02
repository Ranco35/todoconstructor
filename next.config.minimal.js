/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración MÍNIMA para desarrollo ultra-rápido
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Desactivar TODAS las optimizaciones
  poweredByHeader: false,
  reactStrictMode: false,
  swcMinify: false,
  
  // Webpack ultra-minimalista
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Desactivar optimizaciones costosas
      config.optimization = {
        minimize: false,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        usedExports: false,
        sideEffects: false,
      };
      
      // Cache básico
      config.cache = false; // Sin cache para evitar problemas
      
      // Resolución rápida
      config.resolve.modules = ['node_modules'];
      config.resolve.symlinks = false;
      
      // Sin watching complejo
      config.watchOptions = {
        ignored: ['**/node_modules/**'],
        poll: false,
      };
    }
    
    // Fallbacks mínimos
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Sin experimental
  experimental: {},
  
  // Sin headers ni redirects complejos
};

module.exports = nextConfig;