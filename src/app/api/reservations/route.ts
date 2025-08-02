import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { calculateFinalAmount } from '@/utils/reservationUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de filtro
    const status = searchParams.get('status');
    const client_type = searchParams.get('client_type');
    const check_in_from = searchParams.get('check_in_from');
    const check_in_to = searchParams.get('check_in_to');
    const room_id = searchParams.get('room_id');
    const company_id = searchParams.get('company_id');
    const payment_status = searchParams.get('payment_status');

    let query = (await getSupabaseServerClient())
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        client:Client(*),
        modular_reservation:modular_reservations(*),
        reservation_products(*),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros si existen
    if (status) {
      query = query.eq('status', status);
    }
    if (client_type) {
      query = query.eq('client_type', client_type);
    }
    if (check_in_from) {
      query = query.gte('check_in', check_in_from);
    }
    if (check_in_to) {
      query = query.lte('check_in', check_in_to);
    }
    if (room_id) {
      query = query.eq('room_id', parseInt(room_id));
    }
    if (company_id) {
      query = query.eq('company_id', parseInt(company_id));
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json(
        { error: 'Error al obtener reservas' },
        { status: 500 }
      );
    }

    // Obtener todos los user IDs únicos
    const userIds = new Set();
    (reservations || []).forEach(reservation => {
      if (reservation.created_by) userIds.add(reservation.created_by);
      if (reservation.updated_by) userIds.add(reservation.updated_by);
    });

    // Obtener todos los usuarios de una vez
    let usersMap = new Map();
    if (userIds.size > 0) {
      try {
        const { data: users, error: usersError } = await (await getSupabaseServerClient())
          .from('User')
          .select('id, name, email')
          .in('id', Array.from(userIds));
        
        if (!usersError && users) {
          users.forEach(user => usersMap.set(user.id, user));
        } else {
          console.warn('Error getting users for audit info:', usersError);
        }
      } catch (error) {
        console.warn('Error in user lookup:', error);
      }
    }

    // ✅ LÓGICA UNIFICADA - Usar total_amount directamente (ya incluye descuentos)
    const reservationsWithAuditInfo = (reservations || []).map(reservation => {
      const created_by_user = reservation.created_by ? usersMap.get(reservation.created_by) || null : null;
      const updated_by_user = reservation.updated_by ? usersMap.get(reservation.updated_by) || null : null;

      // ✅ USAR TOTAL_AMOUNT DIRECTAMENTE - Es el campo oficial que ya incluye descuentos aplicados
      const finalTotalAmount = reservation.total_amount || 0;
      
      // 📊 LOG UNIFICADO - Mismo formato que función base común
      console.log(`[API] Reservation ${reservation.id}: Using official total_amount: ${finalTotalAmount} (unified approach)`);

      return {
        ...reservation,
        total_amount: finalTotalAmount, // ✅ Usar el total oficial sin recálculo
        created_by_user,
        updated_by_user
      };
    });

    return NextResponse.json(reservationsWithAuditInfo);
  } catch (error) {
    console.error('Error in reservations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 