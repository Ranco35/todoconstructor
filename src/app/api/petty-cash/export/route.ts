import { NextRequest, NextResponse } from 'next/server';
import { exportTransactionsToExcel } from '@/actions/configuration/petty-cash-reports';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de filtros
    const filters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sessionId: searchParams.get('sessionId') ? parseInt(searchParams.get('sessionId')!) : undefined,
      type: searchParams.get('type') as 'expense' | 'purchase' | 'all' || undefined,
      userId: searchParams.get('userId') || undefined,
      cashRegisterId: searchParams.get('cashRegisterId') ? parseInt(searchParams.get('cashRegisterId')!) : undefined,
    };

    console.log('🔍 Exportando reporte con filtros:', filters);

    const result = await exportTransactionsToExcel(filters);

    if (!result.success || !result.data) {
      console.error('❌ Error al exportar:', result.error);
      return NextResponse.json(
        { error: result.error || 'Error al generar el reporte' },
        { status: 500 }
      );
    }

    console.log('✅ Reporte generado exitosamente:', result.filename);

    // Retornar archivo Excel
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': result.data.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Error en API de exportación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al exportar el reporte' },
      { status: 500 }
    );
  }
} 