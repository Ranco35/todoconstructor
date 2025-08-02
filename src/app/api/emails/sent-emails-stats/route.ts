import { NextRequest, NextResponse } from 'next/server';
import { getSentEmailsStats } from '@/actions/emails/sent-email-actions';

export async function GET(request: NextRequest) {
  console.log('📊 API GET: sent-emails-stats ejecutada');
  
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const stats = await getSentEmailsStats(days);

    console.log(`✅ Estadísticas de correos enviados obtenidas para ${days} días`);

    return NextResponse.json({
      success: true,
      stats: stats || {
        totalSent: 0,
        byType: {},
        byStatus: {},
        recentActivity: []
      }
    });

  } catch (error) {
    console.error('❌ Error en API sent-emails-stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 