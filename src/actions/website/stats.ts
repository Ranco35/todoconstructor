'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface WebsiteStats {
  totalVisits: number
  newMessages: number
  testimonials: number
  images: number
  contentItems: number
  settings: number
}

/**
 * Obtiene estadísticas básicas del website
 */
export async function getWebsiteStats(): Promise<WebsiteStats> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Contar mensajes nuevos
    const { count: newMessages } = await supabase
      .from('website_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')

    // Contar testimonios activos
    const { count: testimonials } = await supabase
      .from('website_testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Contar imágenes
    const { count: images } = await supabase
      .from('website_images')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Contar elementos de contenido
    const { count: contentItems } = await supabase
      .from('website_content')
      .select('*', { count: 'exact', head: true })

    // Contar configuraciones
    const { count: settings } = await supabase
      .from('website_settings')
      .select('*', { count: 'exact', head: true })

    // Para las visitas, por ahora usamos un valor de ejemplo
    // En el futuro se puede implementar tracking real
    const totalVisits = 1234

    return {
      totalVisits,
      newMessages: newMessages || 0,
      testimonials: testimonials || 0,
      images: images || 0,
      contentItems: contentItems || 0,
      settings: settings || 0
    }
  } catch (error) {
    console.error('Error in getWebsiteStats:', error)
    return {
      totalVisits: 0,
      newMessages: 0,
      testimonials: 0,
      images: 0,
      contentItems: 0,
      settings: 0
    }
  }
}

/**
 * Registra una visita al website
 */
export async function recordWebsiteVisit(pageUrl: string, userAgent?: string, ipAddress?: string): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient()
    
    await supabase
      .from('website_analytics')
      .insert({
        page_url: pageUrl,
        user_agent: userAgent,
        visitor_ip: ipAddress,
        session_id: Math.random().toString(36).substring(7)
      })
  } catch (error) {
    console.error('Error recording website visit:', error)
  }
}

/**
 * Obtiene estadísticas de visitas por día
 */
export async function getWebsiteVisitsByDay(days: number = 7): Promise<Array<{ date: string; visits: number }>> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('website_analytics')
      .select('visit_date')
      .gte('visit_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('visit_date', { ascending: true })

    if (error) {
      console.error('Error fetching website visits:', error)
      return []
    }

    // Agrupar por fecha y contar visitas
    const visitsByDate = data?.reduce((acc, visit) => {
      const date = visit.visit_date
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Convertir a array de objetos
    return Object.entries(visitsByDate).map(([date, visits]) => ({
      date,
      visits
    }))
  } catch (error) {
    console.error('Error in getWebsiteVisitsByDay:', error)
    return []
  }
} 