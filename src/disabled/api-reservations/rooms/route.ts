import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('id, number, type, capacity, room_status')
      .eq('is_active', true)
      .order('number');

    if (error) {
      throw new Error(`Error fetching rooms: ${error.message}`);
    }

    return NextResponse.json(rooms || []);

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 