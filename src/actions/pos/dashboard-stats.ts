'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface POSStats {
  totalSalesToday: number
  revenueToday: number
  activeSessions: number
  totalTables: number
  availableTables: number
}

export async function getPOSStats(): Promise<POSStats> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Fecha de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISOString = today.toISOString()
    
    // Ventas del día
    const { data: salesData, error: salesError } = await supabase
      .from('POSSale')
      .select('total')
      .gte('createdAt', todayISOString)
    
    if (salesError) {
      console.error('Error fetching POS sales:', salesError)
    }
    
    // Sesiones activas
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('id')
      .eq('status', 'open')
      .not('cashRegisterTypeId', 'is', null)
    
    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError)
    }
    
    // Mesas disponibles
    const { data: tablesData, error: tablesError } = await supabase
      .from('POSTable')
      .select('status')
      .eq('isActive', true)
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError)
    }
    
    // Calcular estadísticas
    const totalSalesToday = salesData?.length || 0
    const revenueToday = salesData?.reduce((sum, sale) => sum + (parseFloat(sale.total.toString()) || 0), 0) || 0
    const totalTables = tablesData?.length || 0
    const availableTables = tablesData?.filter(table => table.status === 'available').length || 0
    
    return {
      totalSalesToday,
      revenueToday,
      activeSessions: activeSessions?.length || 0,
      totalTables,
      availableTables
    }
  } catch (error) {
    console.error('Error in getPOSStats:', error)
    return {
      totalSalesToday: 0,
      revenueToday: 0,
      activeSessions: 0,
      totalTables: 0,
      availableTables: 0
    }
  }
} 