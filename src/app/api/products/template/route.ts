import { NextResponse } from 'next/server';
import { generateProductTemplate } from '@/actions/products/export';

export async function GET() {
  try {
    const templateBuffer = await generateProductTemplate();
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="plantilla_productos_completa.xlsx"');
    
    return new NextResponse(templateBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error en template API:', error);
    return NextResponse.json(
      { error: 'Error al generar plantilla' },
      { status: 500 }
    );
  }
} 