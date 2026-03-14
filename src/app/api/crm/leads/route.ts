import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API CRM] getCRMLeads - Iniciando...');
    
    const supabase = await getSupabaseServerClient();
    
    // Obtener los leads
    const { data: leads, error: leadsError } = await supabase
      .from('crm_leads')
      .select(`
        *,
        stage:crm_stages(*)
      `)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('❌ [API CRM] Error fetching CRM leads:', leadsError);
      return NextResponse.json({ 
        success: false, 
        error: leadsError.message 
      }, { status: 500 });
    }

    // Obtener clientes asociados
    const clientIds = leads?.filter(lead => lead.client_id).map(lead => lead.client_id) || [];
    let clients = [];
    
    if (clientIds.length > 0) {
      const { data: clientsData, error: clientsError } = await supabase
        .from('Client')
        .select('id, "nombrePrincipal", apellido, email, rut, telefono, "telefonoMovil"')
        .in('id', clientIds);

      if (clientsError) {
        console.warn('⚠️ [API CRM] Error fetching clients:', clientsError);
      } else {
        clients = clientsData || [];
      }
    }

    // Enriquecer leads con datos de clientes
    const enrichedLeads = leads?.map(lead => {
      const client = clients.find(c => c.id === lead.client_id);
      return {
        ...lead,
        client: client || null
      };
    }) || [];

    console.log('✅ [API CRM] getCRMLeads - Exitoso:', {
      leadsCount: enrichedLeads.length,
      clientsCount: clients.length
    });

    return NextResponse.json({ 
      success: true, 
      data: enrichedLeads 
    });

  } catch (error) {
    console.error('❌ [API CRM] Error in getCRMLeads:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
