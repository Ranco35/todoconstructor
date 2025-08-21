import { NextResponse } from 'next/server'
import { generateCategoriesExcel } from '@/actions/configuration/category-export'

export async function GET() {
  try {
    const buffer = await generateCategoriesExcel();

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="categorias_${new Date().toISOString().split('T')[0]}.xlsx"`);

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    console.error('Error exportando categorías:', error);
    return NextResponse.json({ success: false, error: 'Error exportando categorías' }, { status: 500 });
  }
}