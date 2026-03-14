import { NextRequest, NextResponse } from 'next/server';
import { getLeadAuditHistory } from '@/actions/crm/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = parseInt(id);
    
    if (isNaN(leadId)) {
      return NextResponse.json(
        { success: false, error: 'ID de lead inválido' },
        { status: 400 }
      );
    }

    const result = await getLeadAuditHistory(leadId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in audit API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
