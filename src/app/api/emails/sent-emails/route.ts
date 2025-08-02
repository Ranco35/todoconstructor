import { NextRequest, NextResponse } from 'next/server';
import { getRecentSentEmails } from '@/actions/emails/sent-email-actions';

export async function GET(request: NextRequest) {
  console.log('📧 API GET: sent-emails ejecutada');
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const emails = await getRecentSentEmails(limit);

    console.log(`✅ ${emails.length} correos enviados obtenidos`);

    return NextResponse.json({
      success: true,
      emails,
      total: emails.length
    });

  } catch (error) {
    console.error('❌ Error en API sent-emails:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 