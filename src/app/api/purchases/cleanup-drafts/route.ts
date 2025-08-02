import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * POST /api/purchases/cleanup-drafts
 * Limpiar facturas borrador incompletas (sin proveedor)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpieza de borradores incompletos...');
    
    const supabase = await getSupabaseServerClient();

    // Buscar facturas borrador sin proveedor o con "Proveedor desconocido"
    const { data: incompleteDrafts, error: searchError } = await supabase
      .from('purchase_invoices')
      .select(`
        id,
        number,
        supplier_id,
        total,
        status,
        payment_status,
        Supplier!supplier_id (
          name
        )
      `)
      .or('supplier_id.is.null,status.eq.draft')
      .eq('payment_status', 'pending')
      .lte('total', 1000); // Solo borradores con montos pequeños/incorrectos

    if (searchError) {
      console.error('❌ Error buscando borradores:', searchError);
      return NextResponse.json({
        success: false,
        error: 'Error al buscar borradores incompletos'
      }, { status: 500 });
    }

    console.log(`📋 Borradores incompletos encontrados: ${incompleteDrafts?.length || 0}`);
    
    if (!incompleteDrafts || incompleteDrafts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron borradores incompletos para limpiar',
        cleaned: 0
      });
    }

    // Listar borradores antes de eliminar
    const draftsToClean = incompleteDrafts.map(draft => ({
      id: draft.id,
      number: draft.number,
      supplier: draft.Supplier?.name || 'Sin proveedor',
      total: draft.total,
      status: draft.status
    }));

    console.log('📄 Borradores que serán eliminados:', draftsToClean);

    // Eliminar líneas asociadas primero
    const invoiceIds = incompleteDrafts.map(d => d.id);
    
    const { error: linesError } = await supabase
      .from('purchase_invoice_lines')
      .delete()
      .in('invoice_id', invoiceIds);

    if (linesError) {
      console.error('⚠️ Error eliminando líneas:', linesError);
      // Continuar aunque falle (las líneas pueden no existir)
    }

    // Eliminar facturas borrador
    const { error: deleteError } = await supabase
      .from('purchase_invoices')
      .delete()
      .in('id', invoiceIds);

    if (deleteError) {
      console.error('❌ Error eliminando borradores:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar borradores incompletos'
      }, { status: 500 });
    }

    console.log(`✅ Limpieza completada: ${incompleteDrafts.length} borradores eliminados`);

    return NextResponse.json({
      success: true,
      message: `Limpieza completada exitosamente`,
      cleaned: incompleteDrafts.length,
      cleanedDrafts: draftsToClean
    });

  } catch (error) {
    console.error('❌ Error inesperado en limpieza:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * GET /api/purchases/cleanup-drafts  
 * Ver borradores que serían limpiados (solo consulta)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Consultando borradores incompletos...');
    
    const supabase = await getSupabaseServerClient();

    const { data: incompleteDrafts, error } = await supabase
      .from('purchase_invoices')
      .select(`
        id,
        number,
        supplier_id,
        total,
        status,
        payment_status,
        created_at,
        Supplier!supplier_id (
          name
        )
      `)
      .or('supplier_id.is.null,status.eq.draft')
      .eq('payment_status', 'pending')
      .lte('total', 1000)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error consultando borradores:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar borradores'
      }, { status: 500 });
    }

    const draftsInfo = (incompleteDrafts || []).map(draft => ({
      id: draft.id,
      number: draft.number,
      supplier: draft.Supplier?.name || 'Sin proveedor',
      total: draft.total,
      status: draft.status,
      created_at: draft.created_at
    }));

    return NextResponse.json({
      success: true,
      drafts: draftsInfo,
      count: draftsInfo.length
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 