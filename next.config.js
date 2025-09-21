/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica esencial
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Configuración mínima para producción
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Configuración webpack mínima
  webpack: (config, { dev, isServer }) => {
    // Fix básico para self en servidor
    if (isServer) {
      config.plugins.push(
        new (require('webpack')).DefinePlugin({
          self: 'globalThis',
        })
      );
    }
    
    // Fallbacks mínimos para cliente
    if (!isServer) {
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
    
    return config;
  },
  
  // Redirección básica
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