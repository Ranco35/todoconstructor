import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getActiveCostCenters } from '@/actions/configuration/cost-center-actions';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const hierarchical = searchParams.get('hierarchical') === 'true';
    const active = searchParams.get('active') !== 'false'; // Por defecto solo activos

         // Obtener centros de costo (simplificado para evitar problemas de relación)
     const { data: costCenters, error } = await supabase
       .from('Cost_Center')
       .select('*')
       .eq('isActive', active)
       .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo centros de costo: ${error.message}`);
    }

    return NextResponse.json(costCenters);
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function getActiveCostCenters() {
  const data = await getActiveCostCenters();
  return NextResponse.json({ costCenters: data });
} 