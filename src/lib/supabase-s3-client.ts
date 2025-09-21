'use client';

import { supabaseS3Config, getS3ClientConfig, validateS3Config } from './supabase-s3-config';

// Interface para resultados de operaciones S3
export interface S3UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface S3DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Cliente S3 para Supabase Storage
 * Alternativa al cliente Supabase Storage estándar
 */
export class SupabaseS3Client {
  private config: ReturnType<typeof getS3ClientConfig>;

  constructor() {
    if (!validateS3Config()) {
      throw new Error('Configuración S3 inválida. Verifica las credenciales.');
    }
    this.config = getS3ClientConfig();
  }

  /**
   * Subir archivo a S3 de Supabase
   */
  async uploadFile(
    bucket: string,
    key: string,
    file: File,
    contentType?: string
  ): Promise<S3UploadResult> {
    try {
      // Para usar S3 directamente necesitaríamos AWS SDK
      // Por ahora, usamos fetch para hacer la petición
      const formData = new FormData();
      formData.append('file', file);
      
      const url = `${supabaseS3Config.endpoint}/${bucket}/${key}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType || file.type,
          // Aquí necesitaríamos agregar headers de autenticación S3
        }
      });

      if (response.ok) {
        return {
          success: true,
          url: `${supabaseS3Config.endpoint}/${bucket}/${key}`,
          key
        };
      } else {
        return {
          success: false,
          error: `Error S3: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Error subiendo archivo a S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar archivo de S3 de Supabase
   */
  async deleteFile(bucket: string, key: string): Promise<S3DeleteResult> {
    try {
      const url = `${supabaseS3Config.endpoint}/${bucket}/${key}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          // Aquí necesitaríamos agregar headers de autenticación S3
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Error S3: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Error eliminando archivo de S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener URL pública de un archivo
   */
  getPublicUrl(bucket: string, key: string): string {
    return `${supabaseS3Config.endpoint}/${bucket}/${key}`;
  }

  /**
   * Listar archivos en un bucket
   */
  async listFiles(bucket: string, prefix?: string): Promise<{ files: string[]; error?: string }> {
    try {
      const url = `${supabaseS3Config.endpoint}/${bucket}${prefix ? `/${prefix}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Aquí necesitaríamos agregar headers de autenticación S3
        }
      });

      if (response.ok) {
        // Parsear respuesta XML de S3
        const xmlText = await response.text();
        // Implementar parsing XML para extraer nombres de archivos
        return { files: [] }; // Placeholder
      } else {
        return {
          files: [],
          error: `Error S3: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Error listando archivos S3:', error);
      return {
        files: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Instancia singleton del cliente S3
export const supabaseS3Client = new SupabaseS3Client();

/**
 * Función de conveniencia para subir imagen de producto usando S3
 */
export async function uploadProductImageS3(
  file: File,
  productId?: number
): Promise<S3UploadResult> {
  try {
    // Generar nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const prefix = productId ? `${productId}_` : '';
    const key = `products/${prefix}${timestamp}_${random}.${extension}`;

    console.log('📤 Subiendo imagen de producto via S3:', {
      bucket: supabaseS3Config.buckets.products,
      key,
      fileSize: file.size,
      fileType: file.type,
      productId
    });

    const result = await supabaseS3Client.uploadFile(
      supabaseS3Config.buckets.products,
      key,
      file,
      file.type
    );

    if (result.success && result.url) {
      console.log('✅ Imagen de producto subida exitosamente via S3:', {
        url: result.url,
        key: result.key
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Error subiendo imagen de producto via S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Función de conveniencia para eliminar imagen de producto usando S3
 */
export async function deleteProductImageS3(key: string): Promise<S3DeleteResult> {
  try {
    console.log('🗑️ Eliminando imagen de producto via S3:', key);

    const result = await supabaseS3Client.deleteFile(
      supabaseS3Config.buckets.products,
      key
    );

    if (result.success) {
      console.log('✅ Imagen de producto eliminada exitosamente via S3');
    }

    return result;
  } catch (error) {
    console.error('❌ Error eliminando imagen de producto via S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
