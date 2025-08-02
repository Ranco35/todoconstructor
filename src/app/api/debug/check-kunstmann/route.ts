import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    console.log('[DEBUG] Verificando Kunstmann en la base de datos...');

    // 1. Buscar Kunstmann específicamente
    const { data: kunstmannResults, error: kunstmannError } = await supabase
      .from('Supplier')
      .select('*')
      .or(`name.ilike.%kunstmann%,name.ilike.%kun%,displayName.ilike.%kunstmann%,displayName.ilike.%kun%`);

    if (kunstmannError) {
      console.error('[DEBUG] Error buscando Kunstmann:', kunstmannError);
    }

    // 2. Obtener todos los proveedores
    const { data: allSuppliers, error: allError } = await supabase
      .from('Supplier')
      .select('id, name, displayName, email, active')
      .order('name');

    if (allError) {
      console.error('[DEBUG] Error obteniendo todos los proveedores:', allError);
    }

    // 3. Buscar Kunstmann en todos los proveedores
    const kunstmannInAll = allSuppliers?.filter(s => 
      s.name?.toLowerCase().includes('kunstmann') || 
      s.name?.toLowerCase().includes('kun')
    ) || [];

    // 4. Buscar por email específico
    const { data: emailResults, error: emailError } = await supabase
      .from('Supplier')
      .select('*')
      .ilike('email', '%jmonsalve%');

    if (emailError) {
      console.error('[DEBUG] Error buscando por email:', emailError);
    }

    // 5. Buscar por molinocollico
    const { data: molinoResults, error: molinoError } = await supabase
      .from('Supplier')
      .select('*')
      .ilike('email', '%molinocollico%');

    if (molinoError) {
      console.error('[DEBUG] Error buscando molinocollico:', molinoError);
    }

    console.log('[DEBUG] Resultados Kunstmann:', kunstmannResults?.length || 0);
    console.log('[DEBUG] Total proveedores:', allSuppliers?.length || 0);
    console.log('[DEBUG] Kunstmann en todos:', kunstmannInAll.length);
    console.log('[DEBUG] Por email jmonsalve:', emailResults?.length || 0);
    console.log('[DEBUG] Por molinocollico:', molinoResults?.length || 0);

    return NextResponse.json({
      kunstmannResults: kunstmannResults || [],
      allSuppliers: allSuppliers?.length || 0,
      kunstmannInAll: kunstmannInAll,
      emailResults: emailResults || [],
      molinoResults: molinoResults || [],
      debug: {
        kunstmannCount: kunstmannResults?.length || 0,
        totalSuppliers: allSuppliers?.length || 0,
        kunstmannInAllCount: kunstmannInAll.length,
        emailCount: emailResults?.length || 0,
        molinoCount: molinoResults?.length || 0
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error general:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 