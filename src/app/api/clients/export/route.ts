import { NextResponse } from 'next/server';
import { generateClientsExcel } from '@/actions/clients/export';

export async function GET() {
  try {
    const excelBuffer = await generateClientsExcel();
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.xlsx"`);
    return new NextResponse(excelBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Error en export API de clientes:', error);
    return NextResponse.json(
      { error: 'Error al exportar clientes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filters = {
      search: body.search,
      tipoCliente: body.tipoCliente,
      estado: body.estado,
      etiquetas: body.etiquetas,
      selectedIds: body.selectedIds,
    };
    const excelBuffer = await generateClientsExcel(filters);
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="clientes_exportados_${new Date().toISOString().split('T')[0]}.xlsx"`);
    return new NextResponse(excelBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Error en export API de clientes (POST):', error);
    return NextResponse.json(
      { error: 'Error al exportar clientes (POST)' },
      { status: 500 }
    );
  }
} 