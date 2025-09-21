'use client';

import { createClient } from '@/lib/supabase';

const supabaseClient = createClient();

// Configuración del bucket para imágenes de clientes
const CLIENT_BUCKET_NAME = 'client-images';
const PRODUCT_BUCKET_NAME = 'Imagenes Productos';
const WEBSITE_BUCKET_NAME = 'website-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Verificar que el usuario esté autenticado
 */
async function ensureAuthenticated(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
    
    if (!user) {
      console.warn('Usuario no autenticado');
      return false;
    }
    
    console.log('✅ Usuario autenticado:', user.email);
    return true;
  } catch (error) {
    console.error('Error inesperado verificando autenticación:', error);
    return false;
  }
}

/**
 * Validar archivo antes de subir
 */
function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido. Tipos soportados: ${ALLOWED_TYPES.join(', ')}`;
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `Archivo muy grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  
  return null;
}

/**
 * Generar nombre único para archivo
 */
function generateFileName(originalName: string, id?: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const prefix = id ? `${id}_` : '';
  return `${prefix}${timestamp}_${random}.${extension}`;
}

/**
 * Subir imagen de cliente a Supabase Storage
 */
export async function uploadClientImage(
  file: File, 
  clientId?: number
): Promise<UploadResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    // Validar archivo
    const validationError = validateFile(file);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Generar nombre único
    const fileName = generateFileName(file.name, clientId);
    const filePath = `clients/${fileName}`;

    console.log('📤 Subiendo imagen de cliente:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      clientId
    });

    // Crear bucket si no existe
    await ensureClientBucketExists();

    // Subir archivo
    const { data, error } = await supabaseClient.storage
      .from(CLIENT_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen de cliente:', error);
      
      // Manejar errores específicos de RLS
      if (error.message.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Error de permisos. Por favor, verifica que estés autenticado y vuelve a intentar.'
        };
      }
      
      return {
        success: false,
        error: `Error al subir imagen: ${error.message}`
      };
    }

    // Obtener URL pública
    const { data: urlData } = supabaseClient.storage
      .from(CLIENT_BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Imagen de cliente subida exitosamente:', {
      filePath: data.path,
      publicUrl: urlData.publicUrl
    });

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      filePath: data.path
    };

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Eliminar imagen de cliente
 */
export async function deleteClientImage(filePath: string): Promise<DeleteResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    console.log('🗑️ Eliminando imagen de cliente:', filePath);

    const { error } = await supabaseClient.storage
      .from(CLIENT_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error eliminando imagen de cliente:', error);
      
      // Manejar errores específicos de RLS
      if (error.message.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Error de permisos al eliminar imagen. Por favor, verifica que estés autenticado.'
        };
      }
      
      return {
        success: false,
        error: `Error al eliminar imagen: ${error.message}`
      };
    }

    console.log('✅ Imagen de cliente eliminada exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado eliminando imagen de cliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener URL pública de imagen de cliente
 */
export function getClientImageUrl(filePath: string): string {
  const { data } = supabaseClient.storage
    .from(CLIENT_BUCKET_NAME)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Actualizar imagen de cliente (eliminar anterior y subir nueva)
 */
export async function updateClientImage(
  file: File,
  clientId: number,
  currentImagePath?: string
): Promise<UploadResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    // Si hay imagen anterior, eliminarla
    if (currentImagePath) {
      const deleteResult = await deleteClientImage(currentImagePath);
      if (!deleteResult.success) {
        console.warn('⚠️ No se pudo eliminar imagen anterior:', deleteResult.error);
      }
    }

    // Subir nueva imagen
    return await uploadClientImage(file, clientId);

  } catch (error) {
    console.error('❌ Error actualizando imagen de cliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando imagen'
    };
  }
}

/**
 * Asegurar que el bucket de clientes existe
 */
export async function ensureClientBucketExists(): Promise<void> {
  try {
    // Verificar si el bucket existe
    const { data: buckets, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      console.error('Error verificando buckets de clientes:', error);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === CLIENT_BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('📁 Creando bucket de clientes:', CLIENT_BUCKET_NAME);
      
      const { error: createError } = await supabaseClient.storage.createBucket(CLIENT_BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_FILE_SIZE
      });

      if (createError) {
        console.error('❌ Error creando bucket de clientes:', createError);
      } else {
        console.log('✅ Bucket de clientes creado exitosamente');
      }
    }
  } catch (error) {
    console.error('❌ Error gestionando bucket de clientes:', error);
  }
}

/**
 * Asegurar que el bucket de productos existe
 */
export async function ensureProductBucketExists(): Promise<void> {
  try {
    const { data: buckets, error } = await supabaseClient.storage.listBuckets();
    if (error) {
      console.error('Error verificando buckets de productos:', error);
      return;
    }
    const bucketExists = buckets?.some(bucket => bucket.name === PRODUCT_BUCKET_NAME);
    if (!bucketExists) {
      console.log('📁 Creando bucket de productos:', PRODUCT_BUCKET_NAME);
      const { error: createError } = await supabaseClient.storage.createBucket(PRODUCT_BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_FILE_SIZE
      });
      // Si el error es de RLS o de existencia, lo ignoramos
      if (createError) {
        if (createError.message.includes('row-level security policy') || createError.message.includes('already exists')) {
          console.warn('⚠️ Bucket ya existe o no tienes permisos para crearlo, lo ignoramos.');
        } else {
          console.error('❌ Error inesperado creando bucket de productos:', createError);
        }
      } else {
        console.log('✅ Bucket de productos creado exitosamente');
      }
    }
  } catch (error) {
    console.error('❌ Error gestionando bucket de productos:', error);
  }
}

/**
 * Subir imagen de producto a Supabase Storage
 */
export async function uploadProductImage(
  file: File, 
  productId?: number
): Promise<UploadResult> {
  try {
    console.log('🟡 [uploadProductImage] INICIO');
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    console.log('🟡 [uploadProductImage] isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    // Validar archivo
    const validationError = validateFile(file);
    console.log('🟡 [uploadProductImage] validationError:', validationError);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Generar nombre único
    const fileName = generateFileName(file.name, productId);
    const filePath = `products/${fileName}`;

    console.log('📤 [uploadProductImage] Subiendo imagen de producto:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      productId
    });

    // Crear bucket si no existe
    await ensureProductBucketExists();
    console.log('🟡 [uploadProductImage] Bucket verificado/creado');

    // Subir archivo
    const { data, error } = await supabaseClient.storage
      .from(PRODUCT_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    console.log('🟡 [uploadProductImage] Resultado subida:', { data, error });

    if (error) {
      console.error('❌ [uploadProductImage] Error subiendo imagen de producto:', error);
      // Manejar errores específicos de RLS
      if (error.message.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Error de permisos. Por favor, verifica que estés autenticado y vuelve a intentar.'
        };
      }
      return {
        success: false,
        error: `Error al subir imagen: ${error.message}`
      };
    }

    // Obtener URL pública
    const { data: urlData } = supabaseClient.storage
      .from(PRODUCT_BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ [uploadProductImage] Imagen de producto subida exitosamente:', {
      filePath: data?.path,
      publicUrl: urlData.publicUrl
    });

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      filePath: data.path
    };

  } catch (error) {
    console.error('❌ [uploadProductImage] Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Eliminar imagen de producto
 */
export async function deleteProductImage(filePath: string): Promise<DeleteResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    console.log('🗑️ Eliminando imagen de producto:', filePath);

    const { error } = await supabaseClient.storage
      .from(PRODUCT_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error eliminando imagen de producto:', error);
      
      // Manejar errores específicos de RLS
      if (error.message.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Error de permisos al eliminar imagen. Por favor, verifica que estés autenticado.'
        };
      }
      
      return {
        success: false,
        error: `Error al eliminar imagen: ${error.message}`
      };
    }

    console.log('✅ Imagen de producto eliminada exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado eliminando imagen de producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Actualizar imagen de producto (eliminar anterior y subir nueva)
 */
export async function updateProductImage(
  file: File,
  productId: number,
  currentImagePath?: string
): Promise<UploadResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    // Si hay imagen anterior, eliminarla
    if (currentImagePath) {
      const deleteResult = await deleteProductImage(currentImagePath);
      if (!deleteResult.success) {
        console.warn('⚠️ No se pudo eliminar imagen anterior:', deleteResult.error);
      }
    }

    // Subir nueva imagen
    return await uploadProductImage(file, productId);

  } catch (error) {
    console.error('❌ Error actualizando imagen de producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando imagen'
    };
  }
}

/**
 * Extraer el path de una URL pública de Supabase
 */
export function extractPathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    
    // Formato: /storage/v1/object/public/bucket-name/path
    if (pathParts.length >= 6 && (pathParts[4] === CLIENT_BUCKET_NAME || pathParts[4] === PRODUCT_BUCKET_NAME)) {
      return pathParts.slice(5).join('/');
    }
    
    return null;
  } catch (error) {
    console.error('Error extrayendo path de URL:', error);
    return null;
  }
}

/**
 * Obtener URL pública de imagen de producto
 */
export function getProductImageUrl(filePath: string): string {
  const { data } = supabaseClient.storage
    .from(PRODUCT_BUCKET_NAME)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Asegurar que el bucket de website existe
 */
export async function ensureWebsiteBucketExists(): Promise<void> {
  try {
    // Verificar si el bucket existe
    const { data: buckets, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      console.error('Error verificando buckets del website:', error);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === WEBSITE_BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('📁 Creando bucket del website:', WEBSITE_BUCKET_NAME);
      
      const { error: createError } = await supabaseClient.storage.createBucket(WEBSITE_BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_FILE_SIZE
      });

      if (createError) {
        console.error('❌ Error creando bucket del website:', createError);
      } else {
        console.log('✅ Bucket del website creado exitosamente');
      }
    }
  } catch (error) {
    console.error('❌ Error gestionando bucket del website:', error);
  }
}

/**
 * Subir imagen del website a Supabase Storage
 */
export async function uploadWebsiteImage(
  file: File, 
  category: string = 'general',
  customFileName?: string
): Promise<UploadResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    // Validar archivo
    const validationError = validateFile(file);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Generar nombre único
    const fileName = customFileName || generateFileName(file.name);
    const filePath = `${category}/${fileName}`;

    console.log('📤 Subiendo imagen del website:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      category
    });

    // Crear bucket si no existe
    await ensureWebsiteBucketExists();

    // Subir archivo
    const { data, error } = await supabaseClient.storage
      .from(WEBSITE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen del website:', error);
      
      // Manejar errores específicos de RLS
      if (error.message.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Error de permisos. Por favor, verifica que estés autenticado y vuelve a intentar.'
        };
      }
      
      return {
        success: false,
        error: `Error al subir imagen: ${error.message}`
      };
    }

    // Obtener URL pública
    const { data: urlData } = supabaseClient.storage
      .from(WEBSITE_BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Imagen del website subida exitosamente:', {
      filePath,
      publicUrl: urlData.publicUrl
    });

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      filePath
    };

  } catch (error) {
    console.error('❌ Error inesperado subiendo imagen del website:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Eliminar imagen del website de Supabase Storage
 */
export async function deleteWebsiteImage(filePath: string): Promise<UploadResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    console.log('🗑️ Eliminando imagen del website:', filePath);

    const { error } = await supabaseClient.storage
      .from(WEBSITE_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error eliminando imagen del website:', error);
      
      // Manejar errores específicos de RLS
      if (error.message.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Error de permisos al eliminar imagen. Por favor, verifica que estés autenticado.'
        };
      }
      
      return {
        success: false,
        error: `Error al eliminar imagen: ${error.message}`
      };
    }

    console.log('✅ Imagen del website eliminada exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado eliminando imagen del website:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Actualizar imagen del website (eliminar anterior y subir nueva)
 */
export async function updateWebsiteImage(
  file: File,
  category: string = 'general',
  currentImagePath?: string,
  customFileName?: string
): Promise<UploadResult> {
  try {
    // Verificar autenticación primero
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.'
      };
    }

    // Si hay imagen anterior, eliminarla
    if (currentImagePath) {
      const deleteResult = await deleteWebsiteImage(currentImagePath);
      if (!deleteResult.success) {
        console.warn('⚠️ No se pudo eliminar la imagen anterior del website, continuando...');
      }
    }

    // Subir nueva imagen
    return await uploadWebsiteImage(file, category, customFileName);

  } catch (error) {
    console.error('❌ Error inesperado actualizando imagen del website:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener URL pública de imagen del website
 */
export function getWebsiteImageUrl(filePath: string): string {
  const { data } = supabaseClient.storage
    .from(WEBSITE_BUCKET_NAME)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Actualizar función extractPathFromUrl para incluir website bucket
 */
export function extractWebsitePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    
    // Formato: /storage/v1/object/public/bucket-name/path
    if (pathParts.length >= 6 && pathParts[4] === WEBSITE_BUCKET_NAME) {
      return pathParts.slice(5).join('/');
    }
    
    return null;
  } catch (error) {
    console.error('Error extrayendo path de URL del website:', error);
    return null;
  }
} 