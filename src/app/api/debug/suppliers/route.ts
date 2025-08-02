import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';

    console.log('[DEBUG] Buscando proveedores con término:', searchTerm);

    // 1. Obtener todos los proveedores activos
    const { data: allSuppliers, error: allError } = await supabase
      .from('Supplier')
      .select('id, name, displayName, email, phone, city, supplierRank, active')
      .eq('active', true)
      .order('name');

    if (allError) {
      console.error('[DEBUG] Error obteniendo todos los proveedores:', allError);
      return NextResponse.json({ error: 'Error obteniendo proveedores' }, { status: 500 });
    }

    console.log('[DEBUG] Total de proveedores activos:', allSuppliers?.length || 0);

    // 2. Buscar proveedores con el término
    let searchQuery = supabase
      .from('Supplier')
      .select('id, name, displayName, email, phone, city, supplierRank, active')
      .eq('active', true);

    if (searchTerm && searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim().toLowerCase();
      searchQuery = searchQuery.or(`name.ilike.%${searchLower}%,displayName.ilike.%${searchLower}%,email.ilike.%${searchLower}%,city.ilike.%${searchLower}%`);
    }

    const { data: searchResults, error: searchError } = await searchQuery.order('name');

    if (searchError) {
      console.error('[DEBUG] Error en búsqueda:', searchError);
      return NextResponse.json({ error: 'Error en búsqueda' }, { status: 500 });
    }

    console.log('[DEBUG] Resultados de búsqueda:', searchResults?.length || 0);

    // 3. Buscar específicamente Kunstmann
    const { data: kunstmannResults, error: kunstmannError } = await supabase
      .from('Supplier')
      .select('id, name, displayName, email, phone, city, supplierRank, active')
      .eq('active', true)
      .or(`name.ilike.%kunstmann%,name.ilike.%kun%,displayName.ilike.%kunstmann%,displayName.ilike.%kun%`)
      .order('name');

    if (kunstmannError) {
      console.error('[DEBUG] Error buscando Kunstmann:', kunstmannError);
    }

    // 4. Verificar campos específicos
    const kunstmannByName = allSuppliers?.filter(s => 
      s.name?.toLowerCase().includes('kunstmann') || 
      s.name?.toLowerCase().includes('kun') ||
      s.displayName?.toLowerCase().includes('kunstmann') ||
      s.displayName?.toLowerCase().includes('kun')
    ) || [];

    const kunstmannByEmail = allSuppliers?.filter(s => 
      s.email?.toLowerCase().includes('kunstmann') || 
      s.email?.toLowerCase().includes('kun')
    ) || [];

    return NextResponse.json({
      searchTerm,
      totalActiveSuppliers: allSuppliers?.length || 0,
      searchResults: searchResults?.length || 0,
      kunstmannResults: kunstmannResults?.length || 0,
      kunstmannByName: kunstmannByName.length,
      kunstmannByEmail: kunstmannByEmail.length,
      allSuppliers: allSuppliers?.slice(0, 10) || [], // Solo primeros 10
      searchResults: searchResults || [],
      kunstmannResults: kunstmannResults || [],
      kunstmannByName: kunstmannByName,
      kunstmannByEmail: kunstmannByEmail,
      debug: {
        searchTerm,
        searchLower: searchTerm.toLowerCase(),
        searchLength: searchTerm.length
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error general:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 