import 'server-only';

/**
 * Configuración S3 para Supabase Storage
 * SOLO SERVER-SIDE — las credenciales nunca se exponen al browser
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

export const supabaseS3Config: SupabaseS3Config = {
  endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
  region: process.env.SUPABASE_S3_REGION || 'us-east-2',
  accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  buckets: {
    products: process.env.SUPABASE_PRODUCT_BUCKET || 'Imagenes Productos',
    clients: process.env.SUPABASE_CLIENT_BUCKET || 'client-images',
    website: process.env.SUPABASE_WEBSITE_BUCKET || 'website-images'
  }
};

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

export function getS3ClientConfig() {
  return {
    endpoint: supabaseS3Config.endpoint,
    region: supabaseS3Config.region,
    credentials: {
      accessKeyId: supabaseS3Config.accessKeyId,
      secretAccessKey: supabaseS3Config.secretAccessKey
    },
    forcePathStyle: true,
    signatureVersion: 'v4'
  };
}
