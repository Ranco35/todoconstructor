import { NextRequest, NextResponse } from 'next/server';
import { searchClients } from '@/actions/clients';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || 'test';

    console.log('🔍 DEBUG: Iniciando búsqueda de clientes con término:', term);

    // Intentar buscar clientes
    const result = await searchClients(term);
    
    console.log('🔍 DEBUG: Resultado de searchClients:', {
      success: result.success,
      dataLength: result.data?.length || 0,
      error: result.error || 'ninguno'
    });

    return NextResponse.json({
      success: true,
      debug: {
        searchTerm: term,
        result: result,
        timestamp: new Date().toISOString(),
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ ERROR en debug de búsqueda de clientes:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}