import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Simple count
    const { count, error: countError } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Count result:', { count, countError });
    
    // Test 2: Direct select without filters
    const { data, error: dataError } = await supabase
      .from('Supplier')
      .select('id, name, email, supplierRank, active')
      .limit(5);
    
    console.log('📋 Data result:', { data, dataError });
    
    // Test 3: Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('check_table_policies', { table_name: 'Supplier' })
      .limit(1);
    
    console.log('🔒 Policies check:', { policies, policiesError });
    
    return NextResponse.json({
      success: true,
      tests: {
        count: { result: count, error: countError?.message },
        data: { result: data, error: dataError?.message },
        policies: { result: policies, error: policiesError?.message }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 