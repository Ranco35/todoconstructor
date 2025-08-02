import { NextResponse } from 'next/server';
import { generateClientTemplate } from '@/actions/clients/export';

export async function GET() {
  try {
    const templateBuffer = await generateClientTemplate();
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="plantilla_clientes.xlsx"');
    
    return new NextResponse(templateBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error en template API de clientes:', error);
    return NextResponse.json(
      { error: 'Error al generar plantilla de clientes' },
      { status: 500 }
    );
  }
} 