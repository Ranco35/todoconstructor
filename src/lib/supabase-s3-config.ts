/**
 * Configuración S3 para Supabase Storage
 * ⚠️ IMPORTANTE: Esta configuración contiene credenciales sensibles
 * En producción, usar variables de entorno
 */

export interface SupabaseS3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  buckets: {
    products: string;
    clients: string;
    website: string;
  };
}

// Configuración S3 de Supabase
export const supabaseS3Config: SupabaseS3Config = {
  endpoint: process.env.SUPABASE_S3_ENDPOINT || 'https://oojczqgarhyxcrrxjsiy.storage.supabase.co/storage/v1/s3',
  region: process.env.SUPABASE_S3_REGION || 'us-east-2',
  accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '82b8833db8556ae350e2406299b42b67',
  secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || 'd1433d5d91db2746aa5dd8aa550d6ef937c85f10ea7b09dd04e833bd57a5f620',
  buckets: {
    products: process.env.SUPABASE_PRODUCT_BUCKET || 'Imagenes Productos',
    clients: process.env.SUPABASE_CLIENT_BUCKET || 'client-images',
    website: process.env.SUPABASE_WEBSITE_BUCKET || 'website-images'
  }
};

// Función para verificar la configuración
export function validateS3Config(): boolean {
  const config = supabaseS3Config;
  
  const requiredFields = [
    config.endpoint,
    config.region,
    config.accessKeyId,
    config.secretAccessKey
  ];
  
  return requiredFields.every(field => field && field.length > 0);
}

// Función para obtener configuración S3 para AWS SDK
export function getS3ClientConfig() {
  return {
    endpoint: supabaseS3Config.endpoint,
    region: supabaseS3Config.region,
    credentials: {
      accessKeyId: supabaseS3Config.accessKeyId,
      secretAccessKey: supabaseS3Config.secretAccessKey
    },
    forcePathStyle: true, // Necesario para Supabase S3
    signatureVersion: 'v4'
  };
}
