import { NextRequest, NextResponse } from 'next/server';
import { exportSuppliers, SupplierExportFilters } from '@/actions/suppliers/export';

export async function GET(request: NextRequest) {
  try {
    console.log('=== INICIO GET /api/suppliers/export ===');
    
    const { searchParams } = new URL(request.url);
    
    // Construir filtros desde query parameters
    const filters: SupplierExportFilters = {};
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    
    if (searchParams.get('companyType') && searchParams.get('companyType') !== 'todos') {
      filters.companyType = searchParams.get('companyType')!;
    }
    
    if (searchParams.get('active')) {
      filters.active = searchParams.get('active') === 'true';
    }
    
    if (searchParams.get('supplierRank') && searchParams.get('supplierRank') !== 'todos') {
      filters.supplierRank = searchParams.get('supplierRank')!;
    }
    
    if (searchParams.get('category') && searchParams.get('category') !== 'todos') {
      filters.category = searchParams.get('category')!;
    }
    
    if (searchParams.get('countryCode') && searchParams.get('countryCode') !== 'todos') {
      filters.countryCode = searchParams.get('countryCode')!;
    }

    console.log('Filtros aplicados:', filters);

    // Generar Excel
    const buffer = await exportSuppliers(filters);
    
    // Generar nombre del archivo
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = filters.search 
      ? `proveedores_filtrados_${timestamp}.xlsx`
      : `proveedores_${timestamp}.xlsx`;
    
    console.log(`Exportación completada: ${filename}`);

    // Retornar archivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error en GET /api/suppliers/export:', error);
    return NextResponse.json(
      { 
        error: 'Error al exportar proveedores',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIO POST /api/suppliers/export ===');
    
    const body = await request.json();
    const filters: SupplierExportFilters = body;
    
    console.log('Filtros recibidos:', filters);

    // Generar Excel
    const buffer = await exportSuppliers(filters);
    
    // Generar nombre del archivo
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `proveedores_${timestamp}.xlsx`;
    
    if (filters.selectedIds && filters.selectedIds.length > 0) {
      filename = `proveedores_seleccionados_${filters.selectedIds.length}_${timestamp}.xlsx`;
    } else if (filters.search || filters.companyType || filters.supplierRank) {
      filename = `proveedores_filtrados_${timestamp}.xlsx`;
    }
    
    console.log(`Exportación completada: ${filename}`);

    // Retornar archivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error en POST /api/suppliers/export:', error);
    return NextResponse.json(
      { 
        error: 'Error al exportar proveedores',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 