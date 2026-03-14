import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API CRM] getCRMStages - Iniciando...');
    
    const supabase = await getSupabaseServerClient();
    
    // Obtener las etapas
    const { data: stages, error: stagesError } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (stagesError) {
      console.error('❌ [API CRM] Error fetching CRM stages:', stagesError);
      return NextResponse.json({ 
        success: false, 
        error: stagesError.message 
      }, { status: 500 });
    }

    console.log('✅ [API CRM] getCRMStages - Exitoso:', {
      stagesCount: stages?.length || 0
    });

    return NextResponse.json({ 
      success: true, 
      data: stages || [] 
    });

  } catch (error) {
    console.error('❌ [API CRM] Error in getCRMStages:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
