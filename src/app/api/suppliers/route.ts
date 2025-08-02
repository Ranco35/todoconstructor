import { NextResponse } from 'next/server';
import { getSuppliers } from '@/actions/suppliers/list';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || undefined,
      companyType: searchParams.get('companyType') || undefined,
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      supplierRank: searchParams.get('supplierRank') || undefined,
      category: searchParams.get('category') || undefined,
      countryCode: searchParams.get('countryCode') || undefined,
    };

    const result = await getSuppliers(params);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en GET /api/suppliers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 