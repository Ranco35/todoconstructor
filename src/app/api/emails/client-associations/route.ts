import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function GET(request: NextRequest) {
  console.log('📧 API GET: client-associations ejecutada');
  
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const recent = searchParams.get('recent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = await getSupabaseClient();

    let query = supabase
      .from('EmailClientAssociation')
      .select(`
        id,
        senderEmail,
        subject,
        clientId,
        isPaymentRelated,
        paymentAmount,
        paymentMethod,
        reservationId,
        notes,
        createdAt,
        Client!inner (
          id,
          nombrePrincipal,
          telefono
        )
      `)
      .order('createdAt', { ascending: false });

    // Filtrar por análisis específico
    if (analysisId) {
      query = query.eq('emailAnalysisId', parseInt(analysisId));
    }

    // Filtrar recientes (últimas 24 horas)
    if (recent) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      query = query.gte('createdAt', yesterday.toISOString());
    }

    // Aplicar límite
    query = query.limit(limit);

    const { data: associations, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo asociaciones:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo asociaciones' },
        { status: 500 }
      );
    }

    // Transformar datos para el frontend
    const transformedAssociations = associations?.map(assoc => ({
      id: assoc.id,
      senderEmail: assoc.senderEmail,
      subject: assoc.subject || 'Sin asunto',
      clientId: assoc.clientId,
      clientName: assoc.Client?.nombrePrincipal || 'Cliente desconocido',
      clientPhone: assoc.Client?.telefono,
      isPaymentRelated: assoc.isPaymentRelated,
      paymentAmount: assoc.paymentAmount,
      paymentMethod: assoc.paymentMethod,
      reservationId: assoc.reservationId,
      notes: assoc.notes,
      createdAt: assoc.createdAt
    })) || [];

    console.log(`✅ ${transformedAssociations.length} asociaciones encontradas`);

    return NextResponse.json({
      success: true,
      associations: transformedAssociations,
      total: transformedAssociations.length
    });

  } catch (error) {
    console.error('❌ Error en API client-associations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 