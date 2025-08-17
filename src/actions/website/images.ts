'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { formatFileSize } from '@/utils/fileUtils'

export interface WebsiteImage {
  id: string
  filename: string
  original_name: string
  url: string
  storage_path?: string
  alt_text?: string
  category: 'hero' | 'rooms' | 'services' | 'gallery' | 'testimonials' | 'other'
  size: number // bytes
  width?: number
  height?: number
  is_active: boolean
  uploaded_at: string
  updated_at: string
}

export interface ImageStats {
  total: number
  byCategory: Record<string, number>
  totalSize: number // bytes
  activeImages: number
}

// Server-side helpers (avoid importing client-only storage utils)
const WEBSITE_BUCKET_NAME = 'website-images'

function extractWebsitePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const parts = url.pathname.split('/')
    if (parts.length >= 6 && parts[4] === WEBSITE_BUCKET_NAME) {
      return parts.slice(5).join('/')
    }
    return null
  } catch {
    return null
  }
}

async function uploadWebsiteImageServer(file: File, category: string = 'other') {
  const supabase = await getSupabaseServerClient()
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const fileName = `${timestamp}_${random}.${ext}`
  const filePath = `${category}/${fileName}`

  const { error } = await supabase.storage
    .from(WEBSITE_BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) {
    return { success: false as const, error: error.message }
  }

  const { data } = supabase.storage.from(WEBSITE_BUCKET_NAME).getPublicUrl(filePath)
  return { success: true as const, publicUrl: data.publicUrl, filePath }
}

async function deleteWebsiteImageServer(filePath: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.storage.from(WEBSITE_BUCKET_NAME).remove([filePath])
  if (error) return { success: false as const, error: error.message }
  return { success: true as const }
}

async function updateWebsiteImageServer(file: File, category: string, currentStoragePath?: string) {
  if (currentStoragePath) {
    await deleteWebsiteImageServer(currentStoragePath)
  }
  return await uploadWebsiteImageServer(file, category)
}

/**
 * Verifica si la tabla website_images existe
 */
export async function checkWebsiteImagesTable(): Promise<{ exists: boolean; error?: string }> {
  try {
    console.log('🔍 Checking website_images table...')
    const supabase = await getSupabaseServerClient()
    
    // Usar una consulta más simple y robusta
    const { data, error } = await supabase
      .from('website_images')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Error checking website_images table:', {
        message: error.message || 'Unknown error',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        code: error.code || 'No code',
        fullError: JSON.stringify(error)
      })
      return { exists: false, error: error.message || 'Database error' }
    }

    console.log('✅ website_images table exists')
    return { exists: true }
  } catch (error) {
    console.error('❌ Exception checking website_images table:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown exception',
      fullError: JSON.stringify(error)
    })
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown exception' }
  }
}

/**
 * Obtiene todas las imágenes del website (versión mejorada con debugging)
 */
export async function getWebsiteImages(
  category?: string, 
  isActive?: boolean
): Promise<WebsiteImage[]> {
  try {
    console.log('🔍 getWebsiteImages called with:', { category, isActive })
    
    // Primero verificar si la tabla existe
    const tableCheck = await checkWebsiteImagesTable()
    if (!tableCheck.exists) {
      console.error('❌ Table website_images does not exist:', tableCheck.error)
      return []
    }

    console.log('🔗 Getting Supabase client...')
    const supabase = await getSupabaseServerClient()
    
    console.log('📡 Building query...')
    let query = supabase
      .from('website_images')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (category) {
      console.log('🏷️ Adding category filter:', category)
      query = query.eq('category', category)
    }

    if (isActive !== undefined) {
      console.log('✅ Adding active filter:', isActive)
      query = query.eq('is_active', isActive)
    }

    console.log('📡 Executing query...')
    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching website images:', {
        message: error.message || 'Unknown error',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        code: error.code || 'No code',
        fullError: JSON.stringify(error)
      })
      return []
    }

    console.log('✅ Images fetched successfully:', data?.length || 0, 'images')
    return data || []
  } catch (error) {
    console.error('❌ Exception in getWebsiteImages:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown exception',
      fullError: JSON.stringify(error)
    })
    return []
  }
}

/**
 * Obtiene una imagen específica por ID
 */
export async function getWebsiteImageById(id: string): Promise<WebsiteImage | null> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('website_images')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching website image:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getWebsiteImageById:', error)
    return null
  }
}

/**
 * Actualiza información de una imagen
 */
export async function updateWebsiteImage(
  id: string, 
  updates: Partial<Pick<WebsiteImage, 'alt_text' | 'category' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('website_images')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating website image:', error)
      return { success: false, error: 'Error al actualizar la imagen' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateWebsiteImage:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Elimina una imagen (marca como inactiva)
 */
export async function deleteWebsiteImage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Primero marcar como inactiva
    const { error: updateError } = await supabase
      .from('website_images')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error deactivating website image:', updateError)
      return { success: false, error: 'Error al eliminar la imagen' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteWebsiteImage:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene estadísticas de imágenes (versión mejorada con debugging)
 */
export async function getImageStats(): Promise<ImageStats> {
  try {
    console.log('📊 getImageStats called')

    // Verificar si la tabla existe
    const tableCheck = await checkWebsiteImagesTable()
    if (!tableCheck.exists) {
      console.error('❌ Table website_images does not exist in getImageStats:', tableCheck.error)
      return {
        total: 0,
        byCategory: {},
        totalSize: 0,
        activeImages: 0
      }
    }

    console.log('🔗 Getting Supabase client for stats...')
    const supabase = await getSupabaseServerClient()
    
    console.log('📡 Fetching image stats...')
    const { data: images, error } = await supabase
      .from('website_images')
      .select('category, size, is_active')

    if (error) {
      console.error('❌ Error fetching image stats:', {
        message: error.message || 'Unknown error',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        code: error.code || 'No code',
        fullError: JSON.stringify(error)
      })
      return {
        total: 0,
        byCategory: {},
        totalSize: 0,
        activeImages: 0
      }
    }

    if (!images) {
      console.log('ℹ️ No images found in database')
      return {
        total: 0,
        byCategory: {},
        totalSize: 0,
        activeImages: 0
      }
    }

    console.log('📊 Processing stats for', images.length, 'images')

    // Procesar estadísticas
    const stats: ImageStats = {
      total: images.length,
      byCategory: {},
      totalSize: 0,
      activeImages: 0
    }

    images.forEach(image => {
      // Contar por categoría
      if (image.category) {
        stats.byCategory[image.category] = (stats.byCategory[image.category] || 0) + 1
      }
      
      // Sumar tamaño total
      if (image.size) {
        stats.totalSize += image.size
      }
      
      // Contar imágenes activas
      if (image.is_active) {
        stats.activeImages += 1
      }
    })

    console.log('✅ Stats processed successfully:', stats)
    return stats
  } catch (error) {
    console.error('❌ Exception in getImageStats:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown exception',
      fullError: JSON.stringify(error)
    })
    return {
      total: 0,
      byCategory: {},
      totalSize: 0,
      activeImages: 0
    }
  }
}

/**
 * Wrapper para getImageStats con formato de respuesta consistente
 */
export async function getWebsiteImageStats(): Promise<{ success: boolean; stats?: ImageStats; error?: string }> {
  try {
    const stats = await getImageStats()
    return { success: true, stats }
  } catch (error) {
    console.error('❌ Error en getWebsiteImageStats:', error)
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}

/**
 * Activa/desactiva múltiples imágenes
 */
export async function toggleMultipleImages(
  imageIds: string[], 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('website_images')
      .update({ 
        is_active: isActive, 
        updated_at: new Date().toISOString() 
      })
      .in('id', imageIds)

    if (error) {
      console.error('Error toggling multiple images:', error)
      return { success: false, error: 'Error al actualizar las imágenes' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in toggleMultipleImages:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Subir nueva imagen del website con integración completa de Storage
 */
export async function uploadNewWebsiteImage(
  formData: FormData
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'other'
    const altText = formData.get('altText') as string || ''
    const width = formData.get('width') as string
    const height = formData.get('height') as string
    
    if (!file) {
      return { success: false, error: 'No se ha seleccionado ningún archivo' }
    }

    console.log('📤 Subiendo nueva imagen del website:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      category,
      altText,
      width,
      height
    })

    // Subir archivo a Supabase Storage
    const uploadResult = await uploadWebsiteImageServer(file, category)
    
    if (!uploadResult.success) {
      console.error('❌ Error subiendo imagen:', uploadResult.error)
      return { success: false, error: uploadResult.error }
    }

    // Insertar registro en la base de datos
    const { data, error: dbError } = await supabase
      .from('website_images')
      .insert([{
        filename: uploadResult.filePath!.split('/').pop(),
        original_name: file.name,
        url: uploadResult.publicUrl,
        storage_path: uploadResult.filePath,
        alt_text: altText,
        category,
        size: file.size,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        is_active: true,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Error insertando en BD:', dbError)
      // Intentar eliminar archivo subido si falló la inserción
      await deleteWebsiteImageServer(uploadResult.filePath!)
      return { success: false, error: 'Error al guardar la imagen en la base de datos' }
    }

    console.log('✅ Imagen del website subida exitosamente:', data)
    return { success: true, imageId: data.id }

  } catch (error) {
    console.error('❌ Error en uploadNewWebsiteImage:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Actualizar imagen existente del website
 */
export async function updateExistingWebsiteImage(
  imageId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const file = formData.get('file') as File | null
    const altText = formData.get('altText') as string
    const category = formData.get('category') as string
    const width = formData.get('width') as string
    const height = formData.get('height') as string
    
    // Obtener imagen actual
    const { data: currentImage, error: fetchError } = await supabase
      .from('website_images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (fetchError || !currentImage) {
      return { success: false, error: 'Imagen no encontrada' }
    }

    let updateData: any = {
      alt_text: altText,
      category,
      updated_at: new Date().toISOString()
    }

    // Si se proporciona un nuevo archivo, actualizar la imagen
    if (file) {
      console.log('🔄 Actualizando imagen del website:', {
        imageId,
        filename: file.name,
        size: file.size,
        type: file.type,
        category,
        width,
        height
      })

      // Extraer path del storage de la URL actual
      const currentStoragePath = extractWebsitePathFromUrl(currentImage.url)
      
      // Subir nueva imagen
      const uploadResult = await updateWebsiteImage(file, category, currentStoragePath)
      
      if (!uploadResult.success) {
        console.error('❌ Error actualizando imagen:', uploadResult.error)
        return { success: false, error: uploadResult.error }
      }

      // Actualizar datos con la nueva imagen
      updateData = {
        ...updateData,
        filename: uploadResult.filePath!.split('/').pop(),
        original_name: file.name,
        url: uploadResult.publicUrl,
        storage_path: uploadResult.filePath,
        size: file.size,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined
      }
    }

    // Actualizar registro en la base de datos
    const { error: updateError } = await supabase
      .from('website_images')
      .update(updateData)
      .eq('id', imageId)

    if (updateError) {
      console.error('❌ Error actualizando BD:', updateError)
      return { success: false, error: 'Error al actualizar la imagen en la base de datos' }
    }

    console.log('✅ Imagen del website actualizada exitosamente')
    return { success: true }

  } catch (error) {
    console.error('❌ Error en updateExistingWebsiteImage:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Eliminar imagen del website (archivo y registro)
 */
export async function deleteWebsiteImageComplete(
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Obtener imagen actual
    const { data: currentImage, error: fetchError } = await supabase
      .from('website_images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (fetchError || !currentImage) {
      return { success: false, error: 'Imagen no encontrada' }
    }

    console.log('🗑️ Eliminando imagen del website:', {
      imageId,
      filename: currentImage.filename,
      url: currentImage.url
    })

    // Extraer path del storage de la URL
    const storagePath = extractWebsitePathFromUrl(currentImage.url) || currentImage.storage_path

    // Eliminar archivo del storage
    if (storagePath) {
      const deleteResult = await deleteWebsiteImage(storagePath)
      if (!deleteResult.success) {
        console.warn('⚠️ No se pudo eliminar archivo del storage:', deleteResult.error)
      }
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('website_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      console.error('❌ Error eliminando de BD:', deleteError)
      return { success: false, error: 'Error al eliminar la imagen de la base de datos' }
    }

    console.log('✅ Imagen del website eliminada exitosamente')
    return { success: true }

  } catch (error) {
    console.error('❌ Error en deleteWebsiteImageComplete:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Cambiar el estado activo/inactivo de una imagen específica
 */
export async function toggleImageStatus(
  imageId: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('website_images')
      .update({ 
        is_active: isActive, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', imageId)

    if (error) {
      console.error('Error toggling image status:', error)
      return { success: false, error: 'Error al cambiar el estado de la imagen' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in toggleImageStatus:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtener todas las imágenes del storage real
 */
export async function getWebsiteImagesFromStorage(): Promise<{ success: boolean; images?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    console.log('📋 Obteniendo imágenes del website desde la base de datos...')
    
    const { data: images, error } = await supabase
      .from('website_images')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('❌ Error obteniendo imágenes:', error)
      return { success: false, error: 'Error al obtener las imágenes' }
    }

    console.log(`✅ ${images?.length || 0} imágenes obtenidas exitosamente`)
    return { success: true, images: images || [] }

  } catch (error) {
    console.error('❌ Error en getWebsiteImagesFromStorage:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

 