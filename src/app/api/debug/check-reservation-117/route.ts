import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Check reservation 117 in main reservations table
    const { data: mainReservation, error: mainError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', 117)
      .single();

    // Check reservation 117 in modular_reservations table
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select('*')
      .eq('reservation_id', 117);

    return NextResponse.json({
      success: true,
      data: {
        mainReservation: mainReservation || null,
        mainError: mainError || null,
        modularReservations: modularReservations || [],
        modularError: modularError || null,
        hasModularData: (modularReservations && modularReservations.length > 0),
        explanation: "If hasModularData is false, the reservation won't appear in calendar because the function only looks in modular_reservations table"
      }
    });

  } catch (error) {
    console.error('Error checking reservation 117:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 