import { NextRequest, NextResponse } from 'next/server';
import { importProducts } from '@/actions/products/import';
import { parseExcel, parseCSV } from '@/lib/import-parsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        { error: 'Formato de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)' },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB permitido' },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    let products;
    
    try {
      if (isExcel) {
        products = parseExcel(buffer);
      } else {
        const csvText = new TextDecoder().decode(uint8Array);
        products = parseCSV(csvText);
      }
    } catch (parseError) {
      console.error('Error parseando archivo:', parseError);
      return NextResponse.json(
        { error: 'Error al procesar el archivo. Verifique que el formato sea correcto' },
        { status: 400 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos en el archivo' },
        { status: 400 }
      );
    }

    // Importar productos usando la server action
    const result = await importProducts(products);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en API de importación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 