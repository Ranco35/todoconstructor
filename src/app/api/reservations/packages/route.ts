import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: packages, error } = await supabase
      .from('packages_modular')
      .select('id, name, code, description, color')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Error fetching packages: ${error.message}`);
    }

    return NextResponse.json(packages || []);

  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 