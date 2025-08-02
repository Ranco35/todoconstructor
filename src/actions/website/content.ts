'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface WebsiteContent {
  id: string
  section: string
  key: string
  title: string
  content: string
  description?: string
  updated_at: string
}

export interface WebsiteSettings {
  id: string
  setting_key: string
  setting_value: string
  description?: string
  updated_at: string
}

/**
 * Obtiene todo el contenido del website
 */
export async function getWebsiteContent(): Promise<WebsiteContent[]> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('website_content')
      .select('*')
      .order('section', { ascending: true })
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching website content:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getWebsiteContent:', error)
    return []
  }
}

/**
 * Obtiene contenido específico por sección
 */
export async function getWebsiteContentBySection(section: string): Promise<WebsiteContent[]> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('website_content')
      .select('*')
      .eq('section', section)
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching website content by section:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getWebsiteContentBySection:', error)
    return []
  }
}

/**
 * Actualiza contenido específico
 */
export async function updateWebsiteContent(
  id: string, 
  updates: Partial<WebsiteContent>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('website_content')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating website content:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateWebsiteContent:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Crea nuevo contenido
 */
export async function createWebsiteContent(
  content: Omit<WebsiteContent, 'id' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: WebsiteContent }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('website_content')
      .insert({
        ...content,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating website content:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createWebsiteContent:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Elimina contenido
 */
export async function deleteWebsiteContent(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('website_content')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting website content:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteWebsiteContent:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene configuraciones del website
 */
export async function getWebsiteSettings(): Promise<WebsiteSettings[]> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching website settings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getWebsiteSettings:', error)
    return []
  }
}

/**
 * Actualiza configuración del website
 */
export async function updateWebsiteSetting(
  settingKey: string, 
  value: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('website_settings')
      .update({
        setting_value: value,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', settingKey)

    if (error) {
      console.error('Error updating website setting:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateWebsiteSetting:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene estadísticas básicas del website
 */
export async function getWebsiteStats(): Promise<{
  totalVisits: number
  newMessages: number
  testimonials: number
  images: number
}> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Aquí podrías implementar lógica real para obtener estadísticas
    // Por ahora retornamos datos de ejemplo
    return {
      totalVisits: 1234,
      newMessages: 12,
      testimonials: 45,
      images: 89
    }
  } catch (error) {
    console.error('Error in getWebsiteStats:', error)
    return {
      totalVisits: 0,
      newMessages: 0,
      testimonials: 0,
      images: 0
    }
  }
} 